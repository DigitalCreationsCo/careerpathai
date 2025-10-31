// ============================================
// lib/deepResearcher/deepResearcher.ts
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
deepResearcherBuilder.addNode('researchSupervisor', supervisorSubgraph as any)
deepResearcherBuilder.addNode("finalReportGeneration", finalReportGeneration)

deepResearcherBuilder.addEdge(START, 'clarifyWithUser' as any)
deepResearcherBuilder.addEdge('researchSupervisor' as any, 'finalReportGeneration' as any)
deepResearcherBuilder.addEdge('finalReportGeneration' as any, END)

const deepResearcherGraph = deepResearcherBuilder.compile();

export { 
  deepResearcherBuilder as deepResearcher,
  deepResearcherGraph
}