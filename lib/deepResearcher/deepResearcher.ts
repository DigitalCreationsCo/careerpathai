// ============================================
// deepResearcher.ts
// ============================================
import { StateGraph, START, END } from '@langchain/langgraph'
import { Configuration } from './configuration'
import { AgentState } from './state';
import { clarifyWithUser } from './actions/clarifyWithUser';
import { writeResearchBrief } from './actions/writeResearchBrief';
import { supervisorSubgraph } from './nodes/supervisorSubgraph';
import { finalReportGeneration } from './actions/finalReportGeneration';
import { writeResearchOutline } from './actions/writeResearchOutline';

const deepResearcherBuilder = new StateGraph(AgentState, Configuration.getSchema())

deepResearcherBuilder.addNode('clarifyWithUser', clarifyWithUser, { ends: ["writeResearchBrief"] });
deepResearcherBuilder.addNode('writeResearchBrief', writeResearchBrief, { ends: ["writeResearchOutline"] });
deepResearcherBuilder.addNode('writeResearchOutline', writeResearchOutline, { ends: ["researchSupervisor"] });
deepResearcherBuilder.addNode('researchSupervisor', supervisorSubgraph)
deepResearcherBuilder.addNode("finalReportGeneration", finalReportGeneration)

deepResearcherBuilder.addEdge(START, 'clarifyWithUser')
deepResearcherBuilder.addEdge('researchSupervisor', 'finalReportGeneration')
deepResearcherBuilder.addEdge('finalReportGeneration', END)

const deepResearcherGraph = deepResearcherBuilder.compile();

export { 
  deepResearcherBuilder as deepResearcher,
  deepResearcherGraph
}