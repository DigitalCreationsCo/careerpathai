# Deep Research FastAPI Integration

This directory contains the FastAPI backend integration for the Deep Researcher LangGraph agent, providing multi-user support with persistent state management, real-time streaming, and NextAuth authentication.

## Architecture Overview

The integration consists of several key components:

- **Database Layer**: PostgreSQL with SQLAlchemy models and Drizzle schema
- **Authentication**: NextAuth JWT verification middleware
- **State Management**: LangGraph PostgresSaver checkpointer
- **Session Management**: Research session lifecycle handling
- **Streaming**: Server-Sent Events for real-time research progress
- **Configuration**: User-specific research settings

## API Endpoints

### Research Session Management

- `POST /api/research/start` - Start a new research session
- `GET /api/research/sessions` - List user's research sessions
- `GET /api/research/session/{session_id}` - Get specific session details
- `POST /api/research/session/{session_id}/message` - Send message to session
- `GET /api/research/stream/{session_id}` - Stream research progress (SSE)
- `DELETE /api/research/session/{session_id}` - Delete a session

### Authentication

The API supports two authentication methods:
1. **Session Cookies**: For web requests (NextAuth session token)
2. **Authorization Header**: For API requests (`Bearer <jwt_token>`)

## Database Schema

### New Tables

#### `research_sessions`
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users table
- `chat_id` (UUID) - Optional foreign key to Chat table
- `thread_id` (VARCHAR) - LangGraph thread identifier
- `status` (VARCHAR) - Session status (active, completed, clarification_needed, archived)
- `research_brief` (TEXT) - Generated research brief
- `configuration` (JSONB) - Session-specific configuration
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

## Environment Variables

Required environment variables:

```bash
# Database
POSTGRES_URL=postgresql://user:password@localhost:5432/database

# Authentication
AUTH_SECRET=your_nextauth_secret

# API Keys (for research models)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
TAVILY_API_KEY=your_tavily_key

# Optional Configuration
MAX_STRUCTURED_OUTPUT_RETRIES=3
ALLOW_CLARIFICATION=true
MAX_CONCURRENT_RESEARCH_UNITS=5
SEARCH_API=tavily
MAX_RESEARCHER_ITERATIONS=6
MAX_REACT_TOOL_CALLS=10
RESEARCH_MODEL=openai:gpt-4.1
COMPRESSION_MODEL=openai:gpt-4.1
FINAL_REPORT_MODEL=openai:gpt-4.1
```

## Usage Examples

### Starting a Research Session

```python
import httpx

async def start_research():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/research/start",
            json={
                "message": "Research the latest AI trends",
                "configuration": {
                    "max_researcher_iterations": 3,
                    "allow_clarification": True
                }
            },
            headers={"Authorization": "Bearer your_jwt_token"}
        )
        session = response.json()
        return session["id"]
```

### Streaming Research Progress

```python
import json

async def stream_progress(session_id):
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "GET",
            f"http://localhost:8000/api/research/stream/{session_id}",
            headers={"Authorization": "Bearer your_jwt_token"}
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    event = json.loads(line[6:])
                    print(f"Event: {event['type']}")
                    if event["type"] == "completion":
                        print(f"Final report: {event['data']['final_report']}")
                        break
```

## Development Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Database Migration**:
   ```bash
   # Apply the new migration
   psql $POSTGRES_URL -f lib/db/migrations/0002_add_research_sessions.sql
   ```

3. **Start the FastAPI Server**:
   ```bash
   uvicorn api.index:app --reload --host 0.0.0.0 --port 8000
   ```

4. **Run Tests**:
   ```bash
   pytest api/tests/ -v
   ```

## Integration with Existing App

The research API integrates seamlessly with your existing Next.js application:

1. **Database**: Uses the same PostgreSQL instance and user authentication
2. **Authentication**: Reuses NextAuth JWT tokens
3. **Chat Integration**: Research sessions can be linked to existing chat conversations
4. **UI Integration**: Use the streaming endpoint to show real-time research progress

### Frontend Integration Example

```typescript
// Start research session
const startResearch = async (message: string) => {
  const response = await fetch('/api/research/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  return response.json();
};

// Stream research progress
const streamResearch = (sessionId: string) => {
  const eventSource = new EventSource(`/api/research/stream/${sessionId}`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    switch (data.type) {
      case 'clarification':
        // Show clarification UI
        break;
      case 'update':
        // Update progress UI
        break;
      case 'completion':
        // Show final report
        eventSource.close();
        break;
    }
  };
};
```

## State Management

The system uses LangGraph's PostgresSaver for automatic state persistence:

- Each research session gets a unique `thread_id`
- State is automatically saved after each graph node execution
- Sessions can be resumed from any point
- Multiple users can have concurrent research sessions
- State is isolated per user and session

## Error Handling

The API includes comprehensive error handling:

- Authentication errors (401)
- Session not found (404)
- Invalid session state (400)
- Internal server errors (500)
- Graceful handling of LangGraph execution errors

## Performance Considerations

- **Concurrent Sessions**: Limited by `max_concurrent_research_units` configuration
- **Database Connections**: Uses connection pooling for efficiency
- **Streaming**: Efficient SSE implementation with proper cleanup
- **State Persistence**: Automatic checkpointing with minimal overhead

## Security

- JWT token verification for all endpoints
- User isolation (users can only access their own sessions)
- Input validation and sanitization
- Secure database queries with parameterized statements

## Monitoring and Logging

- Structured logging for all operations
- Session lifecycle tracking
- Error monitoring and alerting
- Performance metrics collection

## Future Enhancements

- User preference management
- Session sharing and collaboration
- Advanced configuration UI
- Research result caching
- Analytics and insights
