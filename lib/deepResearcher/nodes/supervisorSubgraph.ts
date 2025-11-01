// ============================================
// supervisorSubgraph.ts
// ============================================
import { StateGraph, START, END } from '@langchain/langgraph'
import { Configuration } from '../configuration'
import { SupervisorState } from '../state';
import { supervisor, supervisorTools } from '../actions/supervisor';

const supervisorBuilder = new StateGraph(SupervisorState, Configuration.getSchema())

supervisorBuilder.addNode("supervisor", supervisor, { ends:["supervisorTools"] })
supervisorBuilder.addNode("supervisorTools", supervisorTools, { ends: ["supervisor", END] })

supervisorBuilder.addEdge(START, "supervisor" as any)

// Add conditional routing from supervisor
// supervisorBuilder.addConditionalEdges(
//   "supervisorTools",
//   (state: SupervisorState) => {
//     // Your routing logic - when to use tools vs when to finish
//     const shouldUseTool = state.notes?.length < 5; // Example condition
//     return shouldUseTool ? "supervisorTools" : END;
//   },
//   {
//     supervisorTools: "supervisorTools",
//     [END]: END
//   }
// );




const supervisorSubgraph = supervisorBuilder.compile()

export { supervisorSubgraph }

