// lib/deepResearcher/debug-tools.ts
// Run this to verify your tools are properly structured

import { thinkTool, ConductResearch, ResearchComplete, supervisorTools } from './llmUtils';

/**
 * Debug function to verify tool structure
 * Should log proper LangChain tool objects, NOT Zod schemas
 */
export function debugToolStructure() {
  console.log('=== TOOL STRUCTURE DEBUG ===\n');
  
  console.log('1. Individual Tools:');
  console.log('thinkTool:', {
    name: thinkTool.name,
    description: thinkTool.description,
    hasSchema: !!thinkTool.schema,
    schemaType: typeof thinkTool.schema,
    // Check for Zod internals (should NOT be present)
    hasZodDef: !!(thinkTool as any)._def,
    hasZodStandard: !!(thinkTool as any)['~standard']
  });
  
  console.log('\nConductResearch:', {
    name: ConductResearch.name,
    description: ConductResearch.description,
    hasSchema: !!ConductResearch.schema,
    schemaType: typeof ConductResearch.schema,
    hasZodDef: !!(ConductResearch as any)._def,
    hasZodStandard: !!(ConductResearch as any)['~standard']
  });
  
  console.log('\nResearchComplete:', {
    name: ResearchComplete.name,
    description: ResearchComplete.description,
    hasSchema: !!ResearchComplete.schema,
    schemaType: typeof ResearchComplete.schema,
    hasZodDef: !!(ResearchComplete as any)._def,
    hasZodStandard: !!(ResearchComplete as any)['~standard']
  });
  
  console.log('\n2. Tool Array:');
  console.log('supervisorTools length:', supervisorTools.length);
  console.log('supervisorTools types:', supervisorTools.map(t => ({
    name: t.name,
    type: t.constructor.name,
    isStructuredTool: t.constructor.name === 'StructuredTool' || t.constructor.name === 'DynamicStructuredTool'
  })));
  
  console.log('\n3. Expected Structure:');
  console.log('✓ Tools should be StructuredTool or DynamicStructuredTool instances');
  console.log('✓ hasZodDef should be false');
  console.log('✓ hasZodStandard should be false');
  console.log('✗ If any are true, tools are raw Zod schemas and will fail');
  
  console.log('\n=== END DEBUG ===');
}

// Run immediately if executed directly
if (require.main === module) {
  debugToolStructure();
}

/**
 * Alternative: Test tool schema conversion for Google AI
 */
export function testGoogleToolConversion() {
  console.log('\n=== GOOGLE AI TOOL CONVERSION TEST ===\n');
  
  try {
    // Simulate what ChatGoogleGenerativeAI does
    const tools = supervisorTools.map(tool => {
      // LangChain should convert these to Google's function calling format
      return {
        name: tool.name,
        description: tool.description,
        parameters: tool.schema // This should be a Zod schema
      };
    });
    
    console.log('Converted tools for Google AI:');
    tools.forEach(t => {
      console.log(`\n${t.name}:`, {
        hasName: !!t.name,
        hasDescription: !!t.description,
        hasParameters: !!t.parameters,
        parametersType: typeof t.parameters,
        // Should NOT have these Zod internals
        hasDef: !!(t.parameters as any)?._def,
        hasStandard: !!(t.parameters as any)?['~standard']
      });
    });
    
    console.log('\nIf hasDef or hasStandard are true, the schema is not properly formatted');
    
  } catch (error) {
    console.error('Error during conversion:', error);
  }
}