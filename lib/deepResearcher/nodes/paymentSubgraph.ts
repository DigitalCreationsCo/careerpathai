// ============================================
// paymentAgent.ts
// ============================================

import { Command } from "@langchain/langgraph";
import { createMessageFromMessageType } from "@/lib/deepResearcher/llmUtils";
import { RunnableConfig } from "@langchain/core/runnables";
import { AgentState, PaymentState } from "../state";
import { StateGraph, START, END } from '@langchain/langgraph'
import { Configuration } from '../configuration'
import { SupervisorState } from '../state';
import { supervisor, supervisorTools } from '../actions/supervisor';
import { sendCareerPathReportEmail } from "@/lib/email/send-report-email";
import { generateUUID } from "@/lib/utils";

/**
 * The main function to check if payment has been made, and prompt the user if not.
 * If payment required, sends a tool message with a frontend "redirect to checkout" command.
 * 
 * Returns Command with updated state and (optionally) a tool message for frontend redirection.
 */
export async function acceptPayment(
  state: PaymentState,
  config: RunnableConfig
): Promise<Command> {
  // If user already paid, proceed
  if (state.paymentStatus === "paid") {
    return new Command({
      goto: "fulfillment",
      update: {
        messages: [
          ...(state.messages || []),
          createMessageFromMessageType(
            "ai",
            "Thank you! Your payment has been received. Proceeding to deliver your report."
          ),
        ],
      },
    });
  }

  const toolCallId = generateUUID();
  const paymentPrompt =
    "To unlock your personalized Career Path report, please complete payment. Click the button below to proceed to checkout.";

  return new Command({
    goto: "acceptPayment",
    update: {
      paymentStatus: "pending",
      messages: [
        ...(state.messages || []),
        createMessageFromMessageType("ai", paymentPrompt),
        createMessageFromMessageType(
          "tool", 
          "",
          { 
            name: "redirectToCheckout", 
            tool_call_id: toolCallId, 
            action: "redirect_to_checkout",
            paymentSessionId: state.paymentSessionId || null,
          }
        ),
      ],
    },
  });
}

export async function fulfillPayment(
  state: PaymentState,
  config: RunnableConfig
): Promise<Command> {
  try {
    // const formData = new FormData();
    // formData.append("email", state.userEmail);
    // formData.append("markdownContent", state.finalReport);
    // await sendCareerPathReportEmail(formData);
    return new Command({
      goto: END,
      update: {
        paymentStatus: "fulfilled",
        messages: [
          ...(state.messages || []),
          createMessageFromMessageType(
            "ai",
            "Your payment is confirmed and your Career Path report has been delivered to your email! Thank you for your order, and best wishes on your career journey."
          ),
        ],
      },
    });
  } catch (e) {
    return new Command({
      goto: END,
      update: {
        messages: [
          ...(state.messages || []),
          createMessageFromMessageType(
            "ai",
            "We encountered an error while delivering your report by email. Please contact support."
          ),
        ],
      },
    });
  }
}

const paymentGraphBuilder = new StateGraph(SupervisorState, Configuration.getSchema())
paymentGraphBuilder.addNode("acceptPayment", acceptPayment, { ends:["fulfillPayment"] })
paymentGraphBuilder.addNode("fulfillPayment", fulfillPayment, { ends: [END] })
paymentGraphBuilder.addEdge(START, "acceptPayment" as any)

const paymentSubgraph = paymentGraphBuilder.compile()

export { paymentSubgraph }