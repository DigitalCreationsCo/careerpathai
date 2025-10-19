export async function clarifyWithUserTest(state, config) {
    const messages = state.messages || [];
    console.log("[clarifyWithUser] Node invoked.");
  
    const mockResponse = {
      needClarification: true,
      question: "Can you clarify the topic you'd like me to research?"
    };
  
    return {
      goto: "END",
      update: {
        messages: [
          ...messages,
          { role: "ai", content: mockResponse.question }
        ]
      }
    };
  }
  