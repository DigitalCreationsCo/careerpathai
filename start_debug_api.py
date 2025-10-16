#!/usr/bin/env python3
"""Development startup script with enhanced debugging for the Deep Research FastAPI backend."""

import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv(".env.local")

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from api.db.connection import create_tables
from api.checkpointer import checkpointer_manager
from api.logger import setup_logger

# Setup enhanced logging for development
setup_logger(level="DEBUG", log_file="api_debug.log")


async def setup_database():
    """Initialize database tables and checkpointer."""
    print("🔧 Setting up database...")
    try:
        await create_tables()
        print("✅ Database tables created successfully")
    except Exception as e:
        print(f"❌ Database setup failed: {e}")
        raise
    
    print("🔧 Initializing checkpointer...")
    try:
        await checkpointer_manager.get_checkpointer()
        print("✅ Checkpointer initialized successfully")
    except Exception as e:
        print(f"❌ Checkpointer initialization failed: {e}")
        raise


def main():
    """Main startup function with enhanced debugging."""
    print("🚀 Starting Deep Research API in DEBUG mode...")
    
    # Check required environment variables
    required_vars = ["POSTGRES_URL", "AUTH_SECRET"]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Error: Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these variables in your .env.local file or environment")
        sys.exit(1)
    
    # Set development environment
    os.environ["ENVIRONMENT"] = "development"
    
    # Setup database asynchronously
    print("🔧 Initializing Deep Research API...")
    try:
        asyncio.run(setup_database())
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
        sys.exit(1)
    
    # Start the FastAPI server with enhanced debugging
    print("🌐 Starting FastAPI server with debug mode...")
    print("📊 Debug endpoints available:")
    print("   - http://localhost:8000/health")
    print("   - http://localhost:8000/debug/info")
    print("   - http://localhost:8000/docs (Swagger UI)")
    print("   - http://localhost:8000/redoc (ReDoc)")
    print("📝 Logs will be written to api_debug.log")
    
    uvicorn.run(
        "api.index:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="debug",
        access_log=True,
        reload_dirs=["api"],
        reload_includes=["*.py"]
    )


if __name__ == "__main__":
    main()
