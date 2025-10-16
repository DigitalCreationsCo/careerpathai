import os
from dotenv import load_dotenv
from fastapi import FastAPI
from .chat import router as chat_router
from .research import router as research_router
from .db.connection import create_tables
from .debug_middleware import DebugMiddleware, setup_debug_logging
from .exception_handlers import setup_exception_handlers

load_dotenv(".env.local")

# Setup debugging
setup_debug_logging()

app = FastAPI(
    title="GoCareerPath API",
    description="API for GoCareerPath application with Deep Research capabilities",
    version="1.0.0",
    debug=os.getenv("ENVIRONMENT", "development") == "development"
)

# Add debugging middleware in development
if os.getenv("ENVIRONMENT", "development") == "development":
    app.add_middleware(DebugMiddleware)

# Setup exception handlers
setup_exception_handlers(app)

# Include routers
app.include_router(chat_router)
app.include_router(research_router)

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup."""
    await create_tables()

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/debug/info")
async def debug_info():
    """Debug information endpoint."""
    return {
        "environment": os.getenv("ENVIRONMENT", "development"),
        "debug_mode": app.debug,
        "database_url_set": bool(os.getenv("POSTGRES_URL")),
        "auth_secret_set": bool(os.getenv("AUTH_SECRET")),
        "openai_key_set": bool(os.getenv("OPENAI_API_KEY")),
    }
