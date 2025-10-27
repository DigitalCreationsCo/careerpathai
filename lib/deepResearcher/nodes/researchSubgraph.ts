import { StateGraph, START, END } from '@langchain/langgraph'
import { 
  ResearcherState, 
  ResearcherOutputState,
} from '../state';
import { compressResearch, researcher, researcherTools } from '../actions/researcher';

// Researcher Subgraph Construction
// Creates individual researcher workflow for conducting focused research on specific topics
const researcherBuilder = new StateGraph(
    ResearcherState, ResearcherOutputState as any
)

// Add researcher nodes for research execution and compression
researcherBuilder.addNode("researcher", researcher, 
                    { ends: ['researcherTools'] })                 // Main researcher logic
researcherBuilder.addNode("researcherTools", researcherTools, 
                    { ends: ['researcher', 'compressResearch'] })  // Tool execution handler
researcherBuilder.addNode("compressResearch", compressResearch)    // Research compression

// Define researcher workflow edges
researcherBuilder.addEdge(START, "researcher" as any)                     // Entry point to researcher
researcherBuilder.addEdge("compressResearch" as any, END)                 // Exit point after compression

// Compile researcher subgraph for parallel execution by supervisor
const researcherSubgraph = researcherBuilder.compile()

export { researcherSubgraph };