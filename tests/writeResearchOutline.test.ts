// Unit tests for writeResearchOutline action
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeResearchOutline } from '@/lib/deepResearcher/actions/writeResearchOutline';
import { AgentState } from '@/lib/deepResearcher/state';
import { RunnableConfig } from '@langchain/core/runnables';
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Command, END } from '@langchain/langgraph';

// Mock dependencies
vi.mock('@/lib/deepResearcher/llmUtils', () => ({
  getTodayStr: vi.fn(() => '2024-01-15'),
  getApiKeyForModel: vi.fn(() => 'mock-api-key')
}));

vi.mock('@/lib/deepResearcher/configuration', () => ({
  configurableModel: Promise.resolve({
    withRetry: vi.fn().mockReturnThis(),
    invoke: vi.fn().mockResolvedValue('Generated research outline based on brief')
  })
}));

vi.mock('../../messageUtils', () => ({
  getBufferString: vi.fn((messages) => 
    messages.map((msg: any) => `${msg.role || msg.type}: ${msg.content}`).join('\n')
  )
}));

vi.mock('@/lib/deepResearcher/prompts', () => ({
  researchOutlineGenerationPrompt: vi.fn((brief, messages, today) => 
    `Generate outline for: ${brief}\nMessages: ${messages}\nDate: ${today}`
  ),
  leadResearcherPrompt: vi.fn((iterations, concurrent, today) => 
    `Lead researcher with ${iterations} iterations, ${concurrent} concurrent units, date: ${today}`
  )
}));

describe('writeResearchOutline', () => {
  let mockState: AgentState;
  let mockConfig: RunnableConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockState = {
      messages: [
        { type: 'human', content: 'Research AI safety measures', role: 'user' }
      ],
      researchBrief: 'Comprehensive study on AI safety protocols and implementation strategies',
      supervisorMessages: [],
      notes: [],
      finalReport: '',
      researchOutline: ''
    };

    mockConfig = {
      configurable: {
        maxStructuredOutputRetries: 3,
        researchModel: 'openai:gpt-4',
        researchModelMaxTokens: 4000,
        maxResearcherIterations: 5,
        maxConcurrentResearchUnits: 3
      }
    };
  });

  describe('outline generation', () => {
    it('generates well-structured research outline based on research brief', async () => {
      const expectedOutline = `# AI Safety Research Outline

## 1. Introduction to AI Safety
- Definition and scope
- Historical context
- Current challenges

## 2. Technical Safety Measures
### 2.1 Alignment Techniques
- Value alignment
- Goal specification
- Reward modeling

### 2.2 Robustness and Reliability
- Testing frameworks
- Failure modes analysis
- Safety monitoring

## 3. Implementation Strategies
### 3.1 Industry Best Practices
- Development guidelines
- Deployment protocols
- Risk assessment

### 3.2 Regulatory Frameworks
- Current regulations
- Proposed standards
- International cooperation

## 4. Future Directions
- Emerging technologies
- Research gaps
- Recommendations`;

      // Mock the LLM response
      const mockModel = await import('@/lib/deepResearcher/configuration');
      vi.mocked(mockModel.configurableModel).mockResolvedValue({
        withRetry: vi.fn().mockReturnThis(),
        invoke: vi.fn().mockResolvedValue(expectedOutline)
      } as any);

      const result = await writeResearchOutline(mockState, mockConfig);

      expect(result).toBeInstanceOf(Command);
      const command = result as Command;
      
      expect(command.goto).toBe('researchSupervisor');
      expect(command.update).toHaveProperty('researchOutline');
      expect(command.update.researchOutline).toBe(expectedOutline);
      expect(command.update).toHaveProperty('supervisorMessages');
      expect(command.update).toHaveProperty('messages');
    });

    it('includes research brief in prompt generation', async () => {
      const { researchOutlineGenerationPrompt } = await import('@/lib/deepResearcher/prompts');
      
      await writeResearchOutline(mockState, mockConfig);

      expect(researchOutlineGenerationPrompt).toHaveBeenCalledWith(
        'Comprehensive study on AI safety protocols and implementation strategies',
        expect.any(String),
        '2024-01-15'
      );
    });

    it('handles missing research brief gracefully', async () => {
      mockState.researchBrief = '';

      const result = await writeResearchOutline(mockState, mockConfig);
      
      expect(result).toBeInstanceOf(Command);
      const command = result as Command;
      expect(command.goto).toBe('researchSupervisor');
      
      const { researchOutlineGenerationPrompt } = await import('@/lib/deepResearcher/prompts');
      expect(researchOutlineGenerationPrompt).toHaveBeenCalledWith(
        '',
        expect.any(String),
        '2024-01-15'
      );
    });

    it('processes messages correctly for context', async () => {
      mockState.messages = [
        { type: 'human', content: 'Research AI safety', role: 'user' },
        { type: 'ai', content: 'I will help you research AI safety', role: 'assistant' }
      ];

      const { getBufferString } = await import('../../messageUtils');
      
      await writeResearchOutline(mockState, mockConfig);

      expect(getBufferString).toHaveBeenCalledWith(mockState.messages);
    });
  });

  describe('supervisor message creation', () => {
    it('creates proper supervisor messages with system and human prompts', async () => {
      const result = await writeResearchOutline(mockState, mockConfig);
      const command = result as Command;

      expect(command.update.supervisorMessages).toHaveLength(2);
      
      const systemMessage = command.update.supervisorMessages[0];
      const humanMessage = command.update.supervisorMessages[1];

      expect(systemMessage).toBeInstanceOf(SystemMessage);
      expect(humanMessage).toBeInstanceOf(HumanMessage);
      
      expect(systemMessage.content).toContain('Lead researcher');
      expect(humanMessage.content).toContain('Generated research outline');
    });

    it('uses correct configuration values for supervisor prompt', async () => {
      const { leadResearcherPrompt } = await import('@/lib/deepResearcher/prompts');
      
      await writeResearchOutline(mockState, mockConfig);

      expect(leadResearcherPrompt).toHaveBeenCalledWith(
        5, // maxResearcherIterations
        3, // maxConcurrentResearchUnits
        '2024-01-15'
      );
    });
  });

  describe('state updates', () => {
    it('updates agent state with research outline and messages', async () => {
      const result = await writeResearchOutline(mockState, mockConfig);
      const command = result as Command;

      expect(command.update).toHaveProperty('researchOutline');
      expect(command.update).toHaveProperty('supervisorMessages');
      expect(command.update).toHaveProperty('messages');
      
      const aiMessage = command.update.messages[0];
      expect(aiMessage).toBeInstanceOf(AIMessage);
      expect(aiMessage.content).toBe('Composing research brief...');
    });

    it('navigates to researchSupervisor on success', async () => {
      const result = await writeResearchOutline(mockState, mockConfig);
      const command = result as Command;

      expect(command.goto).toBe('researchSupervisor');
    });
  });

  describe('error handling', () => {
    it('handles LLM invocation errors gracefully', async () => {
      const mockModel = await import('@/lib/deepResearcher/configuration');
      vi.mocked(mockModel.configurableModel).mockResolvedValue({
        withRetry: vi.fn().mockReturnThis(),
        invoke: vi.fn().mockRejectedValue(new Error('API rate limit exceeded'))
      } as any);

      const result = await writeResearchOutline(mockState, mockConfig);
      const command = result as Command;

      expect(command.goto).toBe(END);
      expect(command.update.messages).toHaveLength(1);
      
      const errorMessage = command.update.messages[0];
      expect(errorMessage).toBeInstanceOf(AIMessage);
      expect(errorMessage.content).toBe('Error generating research brief. Please try rephrasing your question.');
    });

    it('logs errors appropriately', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const mockModel = await import('@/lib/deepResearcher/configuration');
      vi.mocked(mockModel.configurableModel).mockResolvedValue({
        withRetry: vi.fn().mockReturnThis(),
        invoke: vi.fn().mockRejectedValue(new Error('Network timeout'))
      } as any);

      await writeResearchOutline(mockState, mockConfig);

      expect(consoleSpy).toHaveBeenCalledWith('[LLM ERROR] writeResearchBrief:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('response format handling', () => {
    it('handles string response format', async () => {
      const mockOutline = 'String format outline';
      const mockModel = await import('@/lib/deepResearcher/configuration');
      vi.mocked(mockModel.configurableModel).mockResolvedValue({
        withRetry: vi.fn().mockReturnThis(),
        invoke: vi.fn().mockResolvedValue(mockOutline)
      } as any);

      const result = await writeResearchOutline(mockState, mockConfig);
      const command = result as Command;

      expect(command.update.researchOutline).toBe(mockOutline);
    });

    it('handles object response format with researchBrief property', async () => {
      const mockResponse = { researchBrief: 'Object format outline' };
      const mockModel = await import('@/lib/deepResearcher/configuration');
      vi.mocked(mockModel.configurableModel).mockResolvedValue({
        withRetry: vi.fn().mockReturnThis(),
        invoke: vi.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await writeResearchOutline(mockState, mockConfig);
      const command = result as Command;

      expect(command.update.researchOutline).toBe('Object format outline');
    });

    it('handles object response format with content property', async () => {
      const mockResponse = { content: { toString: () => 'Content format outline' } };
      const mockModel = await import('@/lib/deepResearcher/configuration');
      vi.mocked(mockModel.configurableModel).mockResolvedValue({
        withRetry: vi.fn().mockReturnThis(),
        invoke: vi.fn().mockResolvedValue(mockResponse)
      } as any);

      const result = await writeResearchOutline(mockState, mockConfig);
      const command = result as Command;

      expect(command.update.researchOutline).toBe('Content format outline');
    });

    it('handles empty response gracefully', async () => {
      const mockModel = await import('@/lib/deepResearcher/configuration');
      vi.mocked(mockModel.configurableModel).mockResolvedValue({
        withRetry: vi.fn().mockReturnThis(),
        invoke: vi.fn().mockResolvedValue({})
      } as any);

      const result = await writeResearchOutline(mockState, mockConfig);
      const command = result as Command;

      expect(command.update.researchOutline).toBe('');
    });
  });

  describe('model configuration', () => {
    it('applies retry configuration correctly', async () => {
      const mockModel = await import('@/lib/deepResearcher/configuration');
      const mockWithRetry = vi.fn().mockReturnThis();
      
      vi.mocked(mockModel.configurableModel).mockResolvedValue({
        withRetry: mockWithRetry,
        invoke: vi.fn().mockResolvedValue('outline')
      } as any);

      await writeResearchOutline(mockState, mockConfig);

      expect(mockWithRetry).toHaveBeenCalledWith({
        stopAfterAttempt: 3
      });
    });

    it('uses correct model configuration for invocation', async () => {
      const mockModel = await import('@/lib/deepResearcher/configuration');
      const mockInvoke = vi.fn().mockResolvedValue('outline');
      
      vi.mocked(mockModel.configurableModel).mockResolvedValue({
        withRetry: vi.fn().mockReturnThis(),
        invoke: mockInvoke
      } as any);

      await writeResearchOutline(mockState, mockConfig);

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.any(String),
        {
          configurable: {
            model: 'openai:gpt-4',
            maxTokens: 4000,
            apiKey: 'mock-api-key'
          }
        }
      );
    });
  });
});