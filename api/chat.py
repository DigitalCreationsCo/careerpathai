import os
import json
from typing import List
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from openai.types.chat.chat_completion_message_param import ChatCompletionMessageParam
from pydantic import BaseModel
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from openai import OpenAI
from open_deep_research.utils import get_current_weather, convert_to_openai_messages
from api.logger import logger

router = APIRouter()

client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
)

class ClientMessage(BaseModel):
    """Client message format for chat requests."""
    role: str
    content: str

class Request(BaseModel):
    messages: List[ClientMessage]


available_tools = {
    "get_current_weather": get_current_weather,
}

def do_stream(messages: List[ChatCompletionMessageParam]):
    stream = client.chat.completions.create(
        messages=messages,
        model="gpt-4o",
        stream=True,
        tools=[{
            "type": "function",
            "function": {
                "name": "get_current_weather",
                "description": "Get the current weather at a location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "latitude": {
                            "type": "number",
                            "description": "The latitude of the location",
                        },
                        "longitude": {
                            "type": "number",
                            "description": "The longitude of the location",
                        },
                    },
                    "required": ["latitude", "longitude"],
                },
            },
        }]
    )

    return stream

def stream_text(messages: List[ChatCompletionMessageParam], protocol: str = 'data'):
    draft_tool_calls = []
    draft_tool_calls_index = -1

    stream = client.chat.completions.create(
        messages=messages,
        model="gpt-4o",
        stream=True,
        tools=[{
            "type": "function",
            "function": {
                "name": "get_current_weather",
                "description": "Get the current weather at a location",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "latitude": {
                            "type": "number",
                            "description": "The latitude of the location",
                        },
                        "longitude": {
                            "type": "number",
                            "description": "The longitude of the location",
                        },
                    },
                    "required": ["latitude", "longitude"],
                },
            },
        }]
    )

    for chunk in stream:
        for choice in chunk.choices:
            if choice.finish_reason == "stop":
                continue

            elif choice.finish_reason == "tool_calls":
                for tool_call in draft_tool_calls:
                    yield '9:{{"toolCallId":"{id}","toolName":"{name}","args":{args}}}\n'.format(
                        id=tool_call["id"],
                        name=tool_call["name"],
                        args=tool_call["arguments"])

                for tool_call in draft_tool_calls:
                    tool_result = available_tools[tool_call["name"]](
                        **json.loads(tool_call["arguments"]))

                    yield 'a:{{"toolCallId":"{id}","toolName":"{name}","args":{args},"result":{result}}}\n'.format(
                        id=tool_call["id"],
                        name=tool_call["name"],
                        args=tool_call["arguments"],
                        result=json.dumps(tool_result))

            elif choice.delta.tool_calls:
                for tool_call in choice.delta.tool_calls:
                    id = tool_call.id
                    name = tool_call.function.name
                    arguments = tool_call.function.arguments

                    if (id is not None):
                        draft_tool_calls_index += 1
                        draft_tool_calls.append(
                            {"id": id, "name": name, "arguments": ""})

                    else:
                        draft_tool_calls[draft_tool_calls_index]["arguments"] += arguments

            else:
                yield '0:{text}\n'.format(text=json.dumps(choice.delta.content))

        if chunk.choices == []:
            usage = chunk.usage
            prompt_tokens = usage.prompt_tokens
            completion_tokens = usage.completion_tokens

            yield 'e:{{"finishReason":"{reason}","usage":{{"promptTokens":{prompt},"completionTokens":{completion}}},"isContinued":false}}\n'.format(
                reason="tool-calls" if len(
                    draft_tool_calls) > 0 else "stop",
                prompt=prompt_tokens,
                completion=completion_tokens
            )


@router.post("/api/chat")
async def handle_chat_data(request: Request, protocol: str = Query('data')):
    logger.debug("handle_chat_data called")
    logger.debug(f"Protocol parameter received: {protocol}")
    try:
        messages = request.messages
        logger.debug(f"Received messages: {messages}")
    except AttributeError as e:
        logger.error(f"Request does not contain 'messages': {e}")
        raise

    try:
        openai_messages = convert_to_openai_messages(messages)
        logger.debug(f"Converted to OpenAI message format: {openai_messages}")
    except Exception as e:
        logger.error(f"Error in converting messages: {e}")
        raise

    try:
        gen = stream_text(openai_messages, protocol)
        logger.debug("stream_text generator created successfully")
    except Exception as e:
        logger.error(f"Error creating stream_text generator: {e}")
        raise

    try:
        response = StreamingResponse(gen)
        logger.debug("StreamingResponse created")
        response.headers['x-vercel-ai-data-stream'] = 'v1'
        logger.debug("Header x-vercel-ai-data-stream set to v1")
    except Exception as e:
        logger.error(f"Error preparing StreamingResponse: {e}")
        raise

    logger.debug("StreamingResponse ready to be returned")
    return response
