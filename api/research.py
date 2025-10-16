"""FastAPI research router with session management and SSE streaming.

Updated to:
- Allow Research Agent to detour to a Chat Agent (streamed).
- Chat Agent responses are streamed (simulated chunking) and inserted
  back into the research flow as assistant messages (but do NOT update research_brief).
- Detect OpenAI-compatible models via per-model env flags and update these flags on streaming errors.
- Preserve existing endpoints & session handling.
"""
import json
import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sse_starlette import EventSourceResponse

from .auth_middleware import get_current_user
from .db import User, ResearchSession
from .session_manager import session_manager
from .checkpointer import checkpointer_manager
from .research_config import config_manager
from open_deep_research.deep_researcher import deep_researcher, configurable_model
from open_deep_research.utils import get_api_key_for_model
from api.logger import logger

router = APIRouter(prefix="/api/research", tags=["research"])


# Pydantic models for request/response
class StartResearchRequest(BaseModel):
    message: str
    chat_id: Optional[str] = None
    configuration: Optional[Dict[str, Any]] = None


class SendMessageRequest(BaseModel):
    message: str


class ResearchSessionResponse(BaseModel):
    id: str
    user_id: str
    chat_id: Optional[str]
    thread_id: str
    status: str
    research_brief: Optional[str]
    configuration: Optional[Dict[str, Any]]
    created_at: str
    updated_at: str


class ResearchSessionsResponse(BaseModel):
    sessions: List[ResearchSessionResponse]
    total: int

# ---------- Helpers: model compatibility & streaming utilities ----------
def model_flag_name(model_env_name: str) -> str:
    """Return env flag key for OpenAI-compatibility for a given model env variable name.
    E.g., for 'CHAT_MODEL' -> 'CHAT_MODEL_OPENAI_COMPATIBLE'"""
    flag = f"{model_env_name.upper()}_OPENAI_COMPATIBLE"
    logger.debug(f"[model_flag_name] Model env name: {model_env_name} -> flag: {flag}")
    return flag

def is_model_openai_compatible_from_env(model_env_name: str) -> bool:
    """Check persisted env flag for whether a model is OpenAI-compatible."""
    flag_key = model_flag_name(model_env_name)
    val = os.environ.get(flag_key, "").lower()
    compatible = val in ("1", "true", "yes")
    logger.debug(
        f"[is_model_openai_compatible_from_env] Checking {flag_key}={os.environ.get(flag_key)}, compatible={compatible}"
    )
    return compatible

def set_model_openai_compatible_flag(model_env_name: str, value: bool) -> None:
    """Persist the compatibility flag in the process env (and log).
    NOTE: This mutates os.environ; for long-term persistence you may want to write to .env.local separately."""
    flag_key = model_flag_name(model_env_name)
    os.environ[flag_key] = "true" if value else "false"
    logger.info(f"Set {flag_key} = {os.environ[flag_key]}")
    logger.debug(f"[set_model_openai_compatible_flag] {flag_key} set to {os.environ[flag_key]}")

    
@router.post("/start", response_model=ResearchSessionResponse)
async def start_research_session(
    request: StartResearchRequest,
    user: User = Depends(get_current_user)
):
    """Start a new research session."""
    logger.info("[start_research_session] Called.")
    logger.debug(f"[start_research_session] User: {user.id}, Chat ID: {request.chat_id}, Configuration: {request.configuration}, Message: {request.message}")
    try:
        # Create new research session
        logger.debug("[start_research_session] Creating research session...")
        session = await session_manager.create_session(
            user_id=str(user.id),
            chat_id=request.chat_id,
            configuration=request.configuration
        )
        logger.debug(f"[start_research_session] New session created: {session.to_dict() if hasattr(session, 'to_dict') else session}")

        # Initialize the research with the user's message
        config = session_manager.create_runnable_config(session)
        logger.debug(f"[start_research_session] Runnable config: {config}")
        checkpointer = await checkpointer_manager.get_checkpointer()
        logger.debug(f"[start_research_session] Got checkpointer: {checkpointer}")

        # Compile graph with checkpointer
        graph = deep_researcher.compile(checkpointer=checkpointer)
        logger.debug(f"[start_research_session] Research graph compiled.")

        # Start the research process
        initial_input = {"messages": [{"role": "user", "content": request.message}]}
        logger.debug(f"[start_research_session] Initial input: {initial_input}")

        # Stream the initial response to get the first state
        async for chunk in graph.astream(initial_input, config, stream_mode="updates"):
            logger.debug(f"[start_research_session] Received chunk: {chunk}")
            # Update session with any research brief if available
            if "research_brief" in chunk:
                logger.info("[start_research_session] Updating session with research_brief.")
                await session_manager.update_session_status(
                    str(session.id),
                    str(user.id),
                    "active",
                    chunk["research_brief"]
                )
            break  # Just get the first update to initialize the session

        logger.info(f"[start_research_session] Research session started successfully: {session.id}")
        return ResearchSessionResponse(**session.to_dict())
        
    except Exception as e:
        logger.exception(f"[start_research_session] Exception occurred: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start research session: {str(e)}"
        )


@router.get("/sessions", response_model=ResearchSessionsResponse)
async def get_user_sessions(
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    user: User = Depends(get_current_user)
):
    """Get all research sessions for the current user."""
    logger.info(f"[get_user_sessions] Called. User: {user.id}, status_filter={status_filter}, limit={limit}, offset={offset}")
    try:
        sessions = await session_manager.get_user_sessions(
            user_id=str(user.id),
            status=status_filter,
            limit=limit,
            offset=offset
        )
        logger.debug(f"[get_user_sessions] Fetched sessions: {len(sessions)}")
        session_responses = [ResearchSessionResponse(**session.to_dict()) for session in sessions]

        logger.info(f"[get_user_sessions] Returning {len(session_responses)} sessions.")
        return ResearchSessionsResponse(
            sessions=session_responses,
            total=len(session_responses)
        )
        
    except Exception as e:
        logger.exception(f"[get_user_sessions] Exception occurred: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get sessions: {str(e)}"
        )


@router.get("/session/{session_id}", response_model=ResearchSessionResponse)
async def get_session(
    session_id: str,
    user: User = Depends(get_current_user)
):
    """Get a specific research session."""
    logger.info(f"[get_session] Called for session_id={session_id}, user={user.id}")
    try:
        session = await session_manager.get_session(session_id, str(user.id))
        logger.debug(f"[get_session] Session fetch result: {session}")
        if not session:
            logger.warning(f"[get_session] Session {session_id} not found for user {user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        logger.info(f"[get_session] Returning session {session_id}")
        return ResearchSessionResponse(**session.to_dict())
        
    except HTTPException:
        logger.warning("[get_session] Raising existing HTTPException")
        raise
    except Exception as e:
        logger.exception(f"[get_session] Exception occurred: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session: {str(e)}"
        )


@router.post("/session/{session_id}/message")
async def send_message_to_session(
    session_id: str,
    request: SendMessageRequest,
    user: User = Depends(get_current_user)
):
    """Send a message to an existing research session."""
    logger.info(f"[send_message_to_session] Called for session_id={session_id}, user={user.id}, message={request.message}")
    try:
        # Get the session
        session = await session_manager.get_session(session_id, str(user.id))
        logger.debug(f"[send_message_to_session] Session fetch result: {session}")
        if not session:
            logger.warning(f"[send_message_to_session] Session {session_id} not found!")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        if session.status not in ["active", "clarification_needed"]:
            logger.warning(f"[send_message_to_session] Session {session_id} is not active: current status={session.status}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session is not active"
            )
        
        # Create config and get checkpointer
        config = session_manager.create_runnable_config(session)
        logger.debug(f"[send_message_to_session] Runnable config: {config}")
        checkpointer = await checkpointer_manager.get_checkpointer()
        logger.debug(f"[send_message_to_session] Got checkpointer: {checkpointer}")
        graph = deep_researcher.compile(checkpointer=checkpointer)
        logger.debug(f"[send_message_to_session] Compiled graph.")

        # Send message to the session
        message_input = {"messages": [{"role": "user", "content": request.message}]}
        logger.debug(f"[send_message_to_session] Message input: {message_input}")
        
        # Stream the response
        response_received = False
        async for chunk in graph.astream(message_input, config, stream_mode="updates"):
            logger.debug(f"[send_message_to_session] Received chunk: {chunk}")
            response_received = True
            # Update session status if needed
            if "research_brief" in chunk:
                logger.info(f"[send_message_to_session] Updating session status with new research_brief.")
                await session_manager.update_session_status(
                    session_id,
                    str(user.id),
                    "active",
                    chunk["research_brief"]
                )
        if not response_received:
            logger.warning(f"[send_message_to_session] No response chunks received for session {session_id}.")
        logger.info(f"[send_message_to_session] Message sent successfully to session {session_id}")
        return {"status": "message_sent", "session_id": session_id}
        
    except HTTPException:
        logger.warning("[send_message_to_session] Raising existing HTTPException")
        raise
    except Exception as e:
        logger.exception(f"[send_message_to_session] Exception occurred: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send message: {str(e)}"
        )


@router.get("/stream/{session_id}")
async def stream_research_progress(
    session_id: str,
    request: Request,
    user: User = Depends(get_current_user)
):
    """Stream research progress via Server-Sent Events."""
    logger.info(f"[stream_research_progress] Called for session_id={session_id}, user={user.id}")
    try:
        # Get the session
        session = await session_manager.get_session(session_id, str(user.id))
        logger.debug(f"[stream_research_progress] Session fetch result: {session}")
        if not session:
            logger.warning(f"[stream_research_progress] Session {session_id} not found!")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Create config and get checkpointer
        config = session_manager.create_runnable_config(session)
        logger.debug(f"[stream_research_progress] Runnable config: {config}")
        checkpointer = await checkpointer_manager.get_checkpointer()
        logger.debug(f"[stream_research_progress] Got checkpointer: {checkpointer}")
        graph = deep_researcher.compile(checkpointer=checkpointer)
        logger.debug(f"[stream_research_progress] Compiled research graph.")

        async def event_generator():
            """Generate SSE events from LangGraph stream."""
            logger.info("[event_generator] Initializing SSE event generator.")
            try:
                # Get current state
                current_state = graph.get_state(config)
                logger.debug(f"[event_generator] Current state: {current_state}")

                # Stream updates
                async for chunk in graph.astream(
                    {"messages": []},  # Empty messages to continue from current state
                    config,
                    stream_mode="updates"
                ):
                    logger.debug(f"[event_generator] Received chunk: {chunk}")
                    # Convert chunk to SSE event
                    event_data = {
                        "type": "update",
                        "data": chunk,
                        "timestamp": str(uuid.uuid4())
                    }
                    
                    logger.debug(f"[event_generator] Yielding research_update event: {event_data}")
                    yield {
                        "event": "research_update",
                        "data": json.dumps(event_data)
                    }
                    
                    # Check if research is complete
                    if "final_report" in chunk:
                        logger.info(f"[event_generator] Research complete for session {session_id}")
                        # Mark session as completed
                        await session_manager.complete_session(
                            session_id,
                            str(user.id),
                            session.research_brief
                        )
                        logger.debug(f"[event_generator] Session marked as complete.")
                        yield {
                            "event": "research_complete",
                            "data": json.dumps({
                                "type": "completion",
                                "final_report": chunk["final_report"],
                                "session_id": session_id
                            })
                        }
                        break
                    
                    # Check if clarification is needed
                    if any("clarification" in str(msg) for msg in chunk.get("messages", [])):
                        logger.info(f"[event_generator] Clarification needed for session {session_id}")
                        await session_manager.update_session_status(
                            session_id,
                            str(user.id),
                            "clarification_needed"
                        )
                        
                        yield {
                            "event": "clarification_needed",
                            "data": json.dumps({
                                "type": "clarification",
                                "session_id": session_id
                            })
                        }
                
            except Exception as e:
                logger.exception(f"[event_generator] Exception during research stream: {str(e)}")
                yield {
                    "event": "error",
                    "data": json.dumps({
                        "type": "error",
                        "error": str(e),
                        "session_id": session_id
                    })
                }
        
        logger.info(f"[stream_research_progress] EventSourceResponse streaming started for session {session_id}")
        return EventSourceResponse(event_generator())
        
    except HTTPException:
        logger.warning("[stream_research_progress] Raising existing HTTPException")
        raise
    except Exception as e:
        logger.exception(f"[stream_research_progress] Exception occurred: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stream research progress: {str(e)}"
        )


@router.delete("/session/{session_id}")
async def delete_session(
    session_id: str,
    user: User = Depends(get_current_user)
):
    """Delete a research session."""
    logger.info(f"[delete_session] Called for session_id={session_id}, user={user.id}")
    try:
        success = await session_manager.delete_session(session_id, str(user.id))
        logger.debug(f"[delete_session] Delete result: {success}")
        if not success:
            logger.warning(f"[delete_session] Session {session_id} not found for user {user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        logger.info(f"[delete_session] Session {session_id} deleted successfully")
        return {"status": "deleted", "session_id": session_id}
        
    except HTTPException:
        logger.warning("[delete_session] Raising existing HTTPException")
        raise
    except Exception as e:
        logger.exception(f"[delete_session] Exception occurred: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete session: {str(e)}"
        )
