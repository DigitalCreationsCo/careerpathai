// Unit tests for /api/research/start endpoint
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/research/start/route';
import { auth } from '@/auth';
import { getOrCreateChat, updateChatTitle } from '@/lib/db/queries/chat';
import { sessionManager } from '@/lib/deepResearcher/sessionManager';
import { checkpointerManager } from '@/lib/deepResearcher/checkpointer';
import { deepResearcher } from '@/lib/deepResearcher/deepResearcher';

// Mock dependencies
vi.mock('@/auth');
vi.mock('@/lib/db/queries/chat');
vi.mock('@/lib/deepResearcher/sessionManager');
vi.mock('@/lib/deepResearcher/checkpointer');
vi.mock('@/lib/deepResearcher/deepResearcher');

describe('/api/research/start endpoint', () => {
  const mockUser = { id: 'user-123' };
  const mockChatId = 'chat-456';
  const mockSession = {
    id: 'session-789',
    threadId: 'thread-abc',
    chatId: mockChatId
  };
  const mockConfig = { configurable: { test: true } };
  const mockCheckpointer = { save: vi.fn(), load: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock auth to return user
    vi.mocked(auth).mockResolvedValue({ user: mockUser });
    
    // Mock database functions
    vi.mocked(getOrCreateChat).mockResolvedValue(mockChatId);
    vi.mocked(updateChatTitle).mockResolvedValue(undefined);
    
    // Mock session manager
    vi.mocked(sessionManager.getOrCreateSession).mockResolvedValue(mockSession);
    vi.mocked(sessionManager.createRunnableConfig).mockReturnValue(mockConfig);
    vi.mocked(sessionManager.updateSessionStatus).mockResolvedValue(undefined);
    
    // Mock checkpointer
    vi.mocked(checkpointerManager.getCheckpointer).mockResolvedValue(mockCheckpointer);
    vi.mocked(checkpointerManager.loadCheckpoint).mockResolvedValue(null);
  });

  describe('NDJSON stream format validation', () => {
    it('returns valid NDJSON stream with correct message and update formats', async () => {
      const mockUpdates = [
        { 'node1': { messages: [{ type: 'human', content: 'test', id: 'msg-1' }], researchBrief: 'Test brief' } },
        { 'node2': { messages: [{ type: 'ai', content: 'response', id: 'msg-2' }] } }
      ];
      
      const mockFinalState = {
        values: {
          messages: [{ type: 'human', content: 'test', id: 'msg-1' }],
          finalReport: 'Test report'
        }
      };

      // Mock graph stream
      const mockGraph = {
        stream: vi.fn().mockResolvedValue(mockUpdates),
        getState: vi.fn().mockResolvedValue(mockFinalState),
        compile: vi.fn().mockReturnThis()
      };
      vi.mocked(deepResearcher.compile).mockReturnValue(mockGraph);

      const request = new Request('http://localhost/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: { parts: [{ text: 'test research query' }], id: 'msg-123' }
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/x-ndjson');
      expect(response.headers.get('X-Session-Id')).toBe(mockSession.id);
      expect(response.headers.get('X-Thread-Id')).toBe(mockSession.threadId);
      expect(response.headers.get('X-Resume-Mode')).toBe('false');
      expect(response.headers.get('X-User-Message-Id')).toBe('msg-123');

      // Read and validate stream content
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let chunks: string[] = [];
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(decoder.decode(value));
        }
      } finally {
        reader.releaseLock();
      }

      const fullContent = chunks.join('');
      const lines = fullContent.trim().split('\n').filter(line => line.trim());
      
      // Validate NDJSON format
      expect(lines.length).toBeGreaterThan(0);
      
      lines.forEach(line => {
        expect(() => JSON.parse(line)).not.toThrow();
        const parsed = JSON.parse(line);
        expect(parsed).toHaveProperty('type');
        expect(parsed).toHaveProperty('timestamp');
        expect(parsed).toHaveProperty('userMessageId', 'msg-123');
        
        if (parsed.type === 'update') {
          expect(parsed).toHaveProperty('node');
          expect(parsed).toHaveProperty('data');
        } else if (parsed.type === 'final') {
          expect(parsed).toHaveProperty('messages');
          expect(parsed).toHaveProperty('finalReport');
        }
      });
    });

    it('handles error state correctly in NDJSON format', async () => {
      const mockGraph = {
        stream: vi.fn().mockRejectedValue(new Error('Graph execution failed')),
        compile: vi.fn().mockReturnThis()
      };
      vi.mocked(deepResearcher.compile).mockReturnValue(mockGraph);

      const request = new Request('http://localhost/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: { parts: [{ text: 'test query' }], id: 'msg-error' }
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let content = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          content += decoder.decode(value);
        }
      } finally {
        reader.releaseLock();
      }

      const errorChunk = JSON.parse(content.trim());
      expect(errorChunk.type).toBe('error');
      expect(errorChunk.error).toBe('Graph execution failed');
      expect(errorChunk.userMessageId).toBe('msg-error');
      expect(errorChunk).toHaveProperty('timestamp');
    });
  });

  describe('Resume functionality', () => {
    it('correctly resumes research session when shouldResume is active', async () => {
      // Mock existing checkpoint to trigger resume
      const mockExistingCheckpoint = { state: 'existing' };
      vi.mocked(checkpointerManager.loadCheckpoint).mockResolvedValue(mockExistingCheckpoint);

      const mockGraph = {
        stream: vi.fn().mockResolvedValue([]),
        getState: vi.fn().mockResolvedValue({ values: { messages: [], finalReport: '' } }),
        compile: vi.fn().mockReturnThis()
      };
      vi.mocked(deepResearcher.compile).mockReturnValue(mockGraph);

      const request = new Request('http://localhost/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: { parts: [{ text: '' }] }, // Empty text to trigger resume
          chatId: mockChatId
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Resume-Mode')).toBe('true');
      
      // Verify graph.stream was called with null input for resume
      expect(mockGraph.stream).toHaveBeenCalledWith(null, expect.any(Object));
    });

    it('starts new session when shouldResume is false', async () => {
      // No existing checkpoint
      vi.mocked(checkpointerManager.loadCheckpoint).mockResolvedValue(null);

      const mockGraph = {
        stream: vi.fn().mockResolvedValue([]),
        getState: vi.fn().mockResolvedValue({ values: { messages: [], finalReport: '' } }),
        compile: vi.fn().mockReturnThis()
      };
      vi.mocked(deepResearcher.compile).mockReturnValue(mockGraph);

      const request = new Request('http://localhost/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: { parts: [{ text: 'new research query' }], id: 'new-msg' }
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Resume-Mode')).toBe('false');
      
      // Verify graph.stream was called with proper input message
      expect(mockGraph.stream).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              id: 'new-msg',
              role: 'user',
              content: 'new research query'
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it('handles resume with existing checkpoint and empty message', async () => {
      const mockExistingCheckpoint = { 
        state: 'partial_research',
        notes: ['note1', 'note2']
      };
      vi.mocked(checkpointerManager.loadCheckpoint).mockResolvedValue(mockExistingCheckpoint);

      const mockGraph = {
        stream: vi.fn().mockResolvedValue([]),
        getState: vi.fn().mockResolvedValue({ values: { messages: [], finalReport: '' } }),
        compile: vi.fn().mockReturnThis()
      };
      vi.mocked(deepResearcher.compile).mockReturnValue(mockGraph);

      const request = new Request('http://localhost/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: { parts: [{ text: '   ' }] }, // Whitespace only
          messageId: 'resume-msg'
        })
      });

      const response = await POST(request);

      expect(response.headers.get('X-Resume-Mode')).toBe('true');
      expect(response.headers.get('X-User-Message-Id')).toBe('resume-msg');
      expect(mockGraph.stream).toHaveBeenCalledWith(null, expect.any(Object));
    });
  });

  describe('Authentication and authorization', () => {
    it('returns 401 when user is not authenticated', async () => {
      vi.mocked(auth).mockResolvedValue(null);

      const request = new Request('http://localhost/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: { parts: [{ text: 'test' }] }
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
      const error = await response.json();
      expect(error.error).toBe('Unauthorized');
    });

    it('returns 401 when user has no id', async () => {
      vi.mocked(auth).mockResolvedValue({ user: {} });

      const request = new Request('http://localhost/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: { parts: [{ text: 'test' }] }
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Message ID handling', () => {
    it('uses explicit messageId when provided', async () => {
      const mockGraph = {
        stream: vi.fn().mockResolvedValue([]),
        getState: vi.fn().mockResolvedValue({ values: { messages: [], finalReport: '' } }),
        compile: vi.fn().mockReturnThis()
      };
      vi.mocked(deepResearcher.compile).mockReturnValue(mockGraph);

      const request = new Request('http://localhost/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: { parts: [{ text: 'test' }] },
          messageId: 'explicit-msg-id'
        })
      });

      const response = await POST(request);
      expect(response.headers.get('X-User-Message-Id')).toBe('explicit-msg-id');
    });

    it('uses message.id when messageId not provided', async () => {
      const mockGraph = {
        stream: vi.fn().mockResolvedValue([]),
        getState: vi.fn().mockResolvedValue({ values: { messages: [], finalReport: '' } }),
        compile: vi.fn().mockReturnThis()
      };
      vi.mocked(deepResearcher.compile).mockReturnValue(mockGraph);

      const request = new Request('http://localhost/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: { 
            id: 'msg-from-message-object',
            parts: [{ text: 'test' }] 
          }
        })
      });

      const response = await POST(request);
      expect(response.headers.get('X-User-Message-Id')).toBe('msg-from-message-object');
    });

    it('generates fallback messageId when none provided', async () => {
      const mockGraph = {
        stream: vi.fn().mockResolvedValue([]),
        getState: vi.fn().mockResolvedValue({ values: { messages: [], finalReport: '' } }),
        compile: vi.fn().mockReturnThis()
      };
      vi.mocked(deepResearcher.compile).mockReturnValue(mockGraph);

      const request = new Request('http://localhost/api/research/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: { parts: [{ text: 'test' }] }
        })
      });

      const response = await POST(request);
      const messageId = response.headers.get('X-User-Message-Id');
      
      expect(messageId).toBeDefined();
      expect(messageId).toMatch(/^msg_[a-z0-9]+_\d+$/);
    });
  });
});