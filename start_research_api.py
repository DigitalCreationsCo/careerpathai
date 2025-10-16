#!/usr/bin/env python3
"""Startup script for the Deep Research FastAPI backend."""

import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

load_dotenv(".env.local")

import uvicorn
from api.db.connection import create_tables
from api.checkpointer import checkpointer_manager


async def setup_database():
    """Initialize database tables and checkpointer."""
    print("Setting up database...")
    await create_tables()
    print("Database tables created successfully")
    
    print("Initializing checkpointer...")
    await checkpointer_manager.get_checkpointer()
    print("Checkpointer initialized successfully")


def main():
    """Main startup function."""
    # Check required environment variables
    required_vars = ["POSTGRES_URL", "AUTH_SECRET"]
    missing_vars = [var for var in required_vars if not os.getenv(var, "./")]
    
    if missing_vars:
        print(f"Error: Missing required environment variables: {', '.join(missing_vars)}")
        print("Please set these variables in your .env file or environment")
        sys.exit(1)
    
    # Setup database asynchronously
    print("Initializing Deep Research API...")
    asyncio.run(setup_database())
    
    # Start the FastAPI server
    print("Starting FastAPI server...")
    uvicorn.run(
        "api.index:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
