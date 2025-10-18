import { StateGraph, START } from '@langchain/langgraph'
import { Configuration } from '../configuration'
import { SupervisorState } from '../state';
import { supervisor, supervisorTools } from '../actions/supervisor';

// Supervisor Subgraph Construction
// Creates the supervisor workflow that manages research delegation and coordination
const supervisorBuilder = new StateGraph(SupervisorState, Configuration.getSchema())

// Add supervisor nodes for research management
supervisorBuilder.addNode("supervisor", supervisor, { ends: ["supervisorTools"] })  // Main supervisor logic
supervisorBuilder.addNode("supervisorTools", supervisorTools)                       // Tool execution handler

// Define supervisor workflow edges
supervisorBuilder.addEdge(START, "supervisor")                                      // Entry point to supervisor

// Compile supervisor subgraph for use in main workflow
const supervisorSubgraph = supervisorBuilder.compile()

export { supervisorSubgraph }