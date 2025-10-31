import { describe, it, expect, vi } from "vitest";
import { convertGraphMessagesToUIMessages } from "@/lib/deepResearcher/checkpointerUtils";
import type { CheckpointChannelValues } from "@/lib/deepResearcher/checkpointerUtils";


vi.mock("@/lib/db/drizzle", () => ({
  db: {}
}));

describe("convertGraphChannelValuesToUIMessages", () => {
  it("should convert serialized LC messages to UIMessage format", () => {
    const input: any = {
      messages: [
        {
          lc: 1,
          type: "constructor",
          id: ["langchain_core", "messages", "HumanMessage"],
          kwargs: {
            id: "e11db367-4fa2-4896-a9f2-d796cad3b432",
            content: "",
            additional_kwargs: {
              timestamp: "2025-10-31T00:55:12.765Z"
            },
            response_metadata: {}
          }
        },
        {
          lc: 1,
          type: "constructor",
          id: ["langchain_core", "messages", "AIMessage"],
          kwargs: {
            content: "What is your current or most recent job title?",
            id: "7f97a9eb-c034-4879-bd1c-7fdc3a0f5bcf",
            tool_calls: [],
            invalid_tool_calls: [],
            additional_kwargs: {},
            response_metadata: {}
          }
        },
        {
          lc: 1,
          type: "constructor",
          id: ["langchain_core", "messages", "HumanMessage"],
          kwargs: {
            id: "cfa7e070-e549-4344-8e18-4a3862afac46",
            content: "SOFTWARE ENGINEER",
            additional_kwargs: {
              timestamp: "2025-10-31T01:01:19.787Z"
            },
            response_metadata: {}
          }
        },
        {
          lc: 1,
          type: "constructor",
          id: ["langchain_core", "messages", "AIMessage"],
          kwargs: {
            content: "What is your industry and how many years of experience do you have in software engineering?",
            id: "be14a690-a72d-40cc-ab68-5ceee972874c",
            tool_calls: [],
            invalid_tool_calls: [],
            additional_kwargs: {},
            response_metadata: {}
          }
        }
      ]
    };

    const uiMessages = convertGraphMessagesToUIMessages(input);

    expect(Array.isArray(uiMessages)).toBe(true);
    expect(uiMessages.length).toBe(4);

    // 1st message - HumanMessage, content ""
    expect(uiMessages[0]).toMatchObject({
      role: "user",
      id: "e11db367-4fa2-4896-a9f2-d796cad3b432",
      parts: [{ type: "text", text: "" }],
      metadata: expect.objectContaining({
        timestamp: "2025-10-31T00:55:12.765Z",
        response_metadata: {}
      })
    });

    // 2nd - AIMessage, content: job title Q
    expect(uiMessages[1]).toMatchObject({
      role: "assistant",
      id: "7f97a9eb-c034-4879-bd1c-7fdc3a0f5bcf",
      parts: [
        { type: "text", text: "What is your current or most recent job title?" }
      ],
      metadata: expect.objectContaining({
        response_metadata: {},
        tool_calls: [],
        invalid_tool_calls: []
      })
    });

    // 3rd - HumanMessage, content: SOFTWARE ENGINEER
    expect(uiMessages[2]).toMatchObject({
      role: "user",
      id: "cfa7e070-e549-4344-8e18-4a3862afac46",
      parts: [
        { type: "text", text: "SOFTWARE ENGINEER" }
      ],
      metadata: expect.objectContaining({
        timestamp: "2025-10-31T01:01:19.787Z",
        response_metadata: {}
      })
    });

    // 4th - AIMessage, content: industry/years Q
    expect(uiMessages[3]).toMatchObject({
      role: "assistant",
      id: "be14a690-a72d-40cc-ab68-5ceee972874c",
      parts: [
        { type: "text", text: "What is your industry and how many years of experience do you have in software engineering?" }
      ],
      metadata: expect.objectContaining({
        response_metadata: {},
        tool_calls: [],
        invalid_tool_calls: []
      })
    });
  });

  it("returns [] if input is invalid", () => {
    expect(convertGraphMessagesToUIMessages(undefined as any)).toEqual([]);
    expect(convertGraphMessagesToUIMessages({} as any)).toEqual([]);
    expect(convertGraphMessagesToUIMessages({ messages: "not-an-array" } as any)).toEqual([]);
  });
});