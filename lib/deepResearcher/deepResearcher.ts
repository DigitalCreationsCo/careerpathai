import { StateGraph, START, END } from '@langchain/langgraph'
import { Configuration } from './configuration'
import { AgentState } from './state';
import { clarifyWithUser } from './actions/clarifyWithUser';
import { writeResearchBrief } from './actions/writeResearchBrief';
import { supervisorSubgraph } from './nodes/supervisorSubgraph';
import { finalReportGeneration } from './actions/finalReportGeneration';

export type Message = {
  role: 'human' | 'ai' | 'system' | 'tool'
  content: string
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  name: string
  id: string
  args: any
}


const deepResearcherBuilder = new StateGraph(AgentState, Configuration.getSchema())

deepResearcherBuilder.addNode('clarifyWithUser', clarifyWithUser, 
                        { ends: ["writeResearchBrief"] })                       // User clarification phase
deepResearcherBuilder.addNode('writeResearchBrief', writeResearchBrief, 
                        { ends: ["clarifyWithUser", "researchSupervisor"] })   // Research planning phase
                        deepResearcherBuilder.addEdge(START, 'clarifyWithUser')                        // Entry point


deepResearcherBuilder.addNode('researchSupervisor', supervisorSubgraph)        // Research execution phase
deepResearcherBuilder.addEdge('researchSupervisor', 'finalReportGeneration')   // Research to report

deepResearcherBuilder.addNode("finalReportGeneration", finalReportGeneration)  // Report generation phase
deepResearcherBuilder.addEdge('finalReportGeneration', END)                    // Final exit point


export { deepResearcherBuilder as deepResearcher }
