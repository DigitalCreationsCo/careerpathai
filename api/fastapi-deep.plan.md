# FastAPI Deep Researcher Integration Plan

## Overview

Integrate the Deep Researcher LangGraph conversational agent with FastAPI, supporting multiple users with persistent state management via PostgreSQL checkpointer, real-time SSE streaming, and NextAuth session authentication.

## Architecture Components

### 1. Database Schema Extension

Add `research_sessions` table to PostgreSQL schema:

- Links to existing `users` and `chat` tables
- Stores LangGraph `thread_id` for state persistence
- Tracks session metadata (status, configuration, timestamps)
- Will be accessed by both Python (via SQLAlchemy) and TypeScript (via Drizzle)

### 2. Python Dependencies

Add to `requirements.txt`:

- `langgraph-checkpoint-postgres` - PostgreSQL state persistence
- `psycopg[binary,pool]` - PostgreSQL adapter for async operations
- `sqlalchemy` - Database ORM for Python
- `sse-starlette` - Server-Sent Events support for FastAPI
- `pyjwt` - JWT token verification for NextAuth sessions

### 3. FastAPI Research Endpoint

Create `/api/research` endpoint in new `api/research.py`:

- **POST `/api/research/start`** - Initialize new research session
- **GET `/api/research/stream/{session_id}`** - SSE stream for research progress
- **POST `/api/research/message`** - Send message to existing session
- **GET `/api/research/sessions`** - List user's research sessions
- **GET `/api/research/session/{session_id}`** - Get session details and state

### 4. State Management Strategy

Use LangGraph's `PostgresSaver` checkpointer:

- Initialize with connection to existing PostgreSQL database
- Automatically creates checkpoint tables (separate from app schema)
- Each session gets unique `thread_id` stored in `research_sessions` table
- State automatically persisted after each graph node execution
- Retrieve conversation history via `graph.get_state(config)`

### 5. Authentication Middleware

Create `api/auth_middleware.py`:

- Extract NextAuth JWT from session cookie (`next-auth.session-token`)
- Verify JWT signature using `AUTH_SECRET` from environment
- Extract user email/ID from verified token
- Query `users` table to get user UUID
- Attach user context to FastAPI request state

### 6. Streaming Implementation

SSE streaming strategy:

- Stream JSON events: `{"type": "clarification"|"research_brief"|"tool_call"|"progress"|"final_report", "data": {...}}`
- Use LangGraph's `.astream()` method with `stream_mode="updates"`
- Parse graph state updates and convert to SSE events
- Handle clarification questions (pause stream, await user response)
- Stream final report incrementally as it's generated

### 7. Session Lifecycle Management

- **Start**: Create `research_sessions` record, generate `thread_id`, initialize PostgresSaver config
- **Continue**: Load existing session, append new message, resume from checkpoint
- **Cleanup**: Mark sessions as completed, archive after 30 days (background task)

## Key Implementation Files

### Database Migration

`lib/db/migrations/XXXX_add_research_sessions.sql`:

```sql
CREATE TABLE research_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  chat_id UUID REFERENCES Chat(id),
  thread_id VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  research_brief TEXT,
  configuration JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_research_sessions_user_id ON research_sessions(user_id);
CREATE INDEX idx_research_sessions_thread_id ON research_sessions(thread_id);
```

### Python Database Models

`api/db/models.py` - SQLAlchemy models mirroring TypeScript schema

### FastAPI Research Router

`api/research.py`:

- Import compiled `deep_researcher` graph from `api/open_deep_research/deep_researcher.py`
- Initialize `PostgresSaver` with connection pool
- Implement SSE streaming with `EventSourceResponse`
- Handle user authentication via middleware
- Map LangGraph state updates to SSE events

### Drizzle Schema Update

`lib/db/schema.ts` - Add `researchSessions` table definition

### Configuration Management

`api/research_config.py`:

- Load default Configuration from environment
- Merge with user-specific settings from database
- Create RunnableConfig with user's thread_id and preferences

## Integration Points

1. **Existing chat flow**: Research sessions optionally linked to `chat` table for unified conversation history
2. **User authentication**: Reuse NextAuth JWT validation, query existing `users` table
3. **Database**: Single PostgreSQL instance for both app data and LangGraph checkpoints
4. **API consistency**: Follow existing FastAPI patterns from `api/chat.py`

## Testing Strategy

- Unit tests for auth middleware (JWT validation)
- Integration tests for session CRUD operations
- End-to-end test: start session → stream progress → handle clarification → final report
- Test concurrent sessions for same user
- Test session recovery after interruption