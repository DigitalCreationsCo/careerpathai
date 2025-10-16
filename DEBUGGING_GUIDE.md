# FastAPI Debugging Guide

This guide provides comprehensive debugging tools and techniques for the Deep Research FastAPI application.

## 🚀 Quick Start with Debug Mode

### 1. Start with Enhanced Debugging
```bash
# Use the debug startup script
python start_debug_api.py

# Or manually with debug flags
uvicorn api.index:app --reload --log-level debug --host 0.0.0.0 --port 8000
```

### 2. Test API Endpoints
```bash
# Run the test script
python test_api.py

# Or test manually
curl http://localhost:8000/health
curl http://localhost:8000/debug/info
```

## 🔧 Debugging Tools

### Debug Endpoints

- **Health Check**: `GET /health` - Basic API status
- **Debug Info**: `GET /debug/info` - Environment and configuration status
- **API Docs**: `GET /docs` - Interactive Swagger UI
- **ReDoc**: `GET /redoc` - Alternative API documentation

### Logging

#### Console Logging
- **Request/Response**: All HTTP requests logged with timing
- **Error Details**: Full stack traces for exceptions
- **Database Operations**: SQL queries and connection status
- **Authentication**: JWT token validation and user lookup

#### File Logging
- **Debug Log**: `api_debug.log` - Detailed application logs
- **Error Log**: Errors written to file for persistent debugging

### Middleware Features

#### Debug Middleware (Development Only)
- **Request Logging**: Full request details (headers, body, query params)
- **Response Timing**: Request processing time
- **Error Handling**: Detailed error responses with stack traces
- **Body Inspection**: Request/response body logging

#### Exception Handlers
- **Validation Errors**: Detailed Pydantic validation error messages
- **HTTP Errors**: Consistent error response format
- **Database Errors**: SQLAlchemy error handling
- **General Exceptions**: Catch-all with optional traceback

## 🐛 Common Issues and Solutions

### 1. AIMessage Validation Error
**Error**: `AIMessage.__init__() missing 1 required positional argument: 'content'`

**Solution**: The client should send messages in this format:
```json
{
  "messages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi there!"}
  ]
}
```

### 2. Database Connection Issues
**Error**: `POSTGRES_URL environment variable is required`

**Solution**: 
1. Check `.env.local` file exists
2. Verify `POSTGRES_URL` is set correctly
3. Test database connection manually

### 3. Authentication Errors
**Error**: `Authentication required`

**Solution**:
1. Check `AUTH_SECRET` is set
2. Verify JWT token format
3. Check user exists in database

### 4. LangGraph State Issues
**Error**: `Invalid connection type: AsyncEngine`

**Solution**: This is fixed in the checkpointer implementation - uses psycopg pool instead of async SQLAlchemy engine.

## 🔍 Debugging Techniques

### 1. Request/Response Inspection
```python
# Enable detailed logging
import logging
logging.getLogger("api").setLevel(logging.DEBUG)

# Check request body
print(f"Request body: {await request.body()}")
print(f"Request headers: {dict(request.headers)}")
```

### 2. Database Query Debugging
```python
# Enable SQLAlchemy logging
import logging
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)

# Check database connection
from api.db.connection import engine
async with engine.begin() as conn:
    result = await conn.execute("SELECT 1")
    print(f"DB connection test: {result.scalar()}")
```

### 3. Authentication Debugging
```python
# Test JWT token
from api.auth_middleware import auth_middleware
user = await auth_middleware.get_user_from_token("your_jwt_token")
print(f"Authenticated user: {user.email}")
```

### 4. LangGraph State Debugging
```python
# Check graph state
from api.checkpointer import checkpointer_manager
checkpointer = await checkpointer_manager.get_checkpointer()
state = graph.get_state(config)
print(f"Current state: {state}")
```

## 📊 Monitoring and Metrics

### Health Checks
```bash
# Basic health
curl http://localhost:8000/health

# Detailed debug info
curl http://localhost:8000/debug/info
```

### Log Analysis
```bash
# Monitor logs in real-time
tail -f api_debug.log

# Search for errors
grep "ERROR" api_debug.log

# Search for specific requests
grep "POST /api/chat" api_debug.log
```

## 🛠️ Development Tools

### 1. Interactive API Testing
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Postman**: Import OpenAPI spec from `/openapi.json`

### 2. Database Tools
```bash
# Connect to database
psql $POSTGRES_URL

# Check research sessions
SELECT * FROM research_sessions LIMIT 5;

# Check LangGraph checkpoints
SELECT * FROM checkpoints LIMIT 5;
```

### 3. Environment Verification
```bash
# Check environment variables
python -c "import os; print('POSTGRES_URL:', bool(os.getenv('POSTGRES_URL')))"
python -c "import os; print('AUTH_SECRET:', bool(os.getenv('AUTH_SECRET')))"
python -c "import os; print('OPENAI_API_KEY:', bool(os.getenv('OPENAI_API_KEY')))"
```

## 🚨 Error Response Format

All errors follow this consistent format:
```json
{
  "error": "Error Type",
  "message": "Human readable message",
  "details": "Additional error details (if applicable)",
  "path": "/api/endpoint",
  "method": "POST",
  "traceback": ["stack", "trace", "lines"] // Only in development
}
```

## 🔄 Hot Reloading

The debug server supports hot reloading:
- **File Changes**: Automatically restarts on Python file changes
- **Environment Changes**: Restart required for `.env` changes
- **Database Changes**: Migration changes require restart

## 📝 Best Practices

1. **Always use debug mode in development**
2. **Check logs first when debugging issues**
3. **Use the test script to verify basic functionality**
4. **Monitor the debug endpoints for system status**
5. **Keep environment variables in `.env.local`**
6. **Use the interactive API docs for testing**

## 🆘 Getting Help

If you encounter issues:

1. **Check the logs**: `tail -f api_debug.log`
2. **Run the test script**: `python test_api.py`
3. **Check debug info**: `curl http://localhost:8000/debug/info`
4. **Verify environment**: Check all required variables are set
5. **Test database connection**: Verify PostgreSQL is accessible
6. **Check API documentation**: Use `/docs` endpoint for interactive testing
