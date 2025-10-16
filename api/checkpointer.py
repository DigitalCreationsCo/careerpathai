"""PostgresSaver checkpointer initialization and management."""

import os
from typing import Optional
from langgraph.checkpoint.postgres import PostgresSaver
from psycopg_pool import ConnectionPool

from .research_config import config_manager


class CheckpointerManager:
    """Manages PostgresSaver checkpointer for LangGraph state persistence."""
    
    def __init__(self):
        self._checkpointer: Optional[PostgresSaver] = None
        self._pool: Optional[ConnectionPool] = None
    
    async def get_checkpointer(self) -> PostgresSaver:
        """Get or create PostgresSaver checkpointer."""
        if self._checkpointer is None:
            await self._initialize_checkpointer()
        return self._checkpointer
    
    async def _initialize_checkpointer(self):
        """Initialize PostgresSaver with a psycopg connection pool (sync)."""
        database_url = os.getenv("POSTGRES_URL")
        if not database_url:
            raise ValueError("POSTGRES_URL environment variable is required")

        # Normalize DSN to a standard psycopg-compatible URL (no async driver suffix)
        if database_url.startswith("postgres://"):
            database_url = "postgresql://" + database_url[len("postgres://"):]
        elif database_url.startswith("postgresql+asyncpg://"):
            database_url = "postgresql://" + database_url[len("postgresql+asyncpg://"):]

        # Create a synchronous psycopg connection pool
        self._pool = ConnectionPool(
            conninfo=database_url,
            min_size=1,
            max_size=int(os.getenv("PG_POOL_MAX", "10")),
            timeout=30,
            configure=lambda conn: setattr(conn, "autocommit", True),
        )

        # Initialize PostgresSaver with the pool
        self._checkpointer = PostgresSaver(self._pool)

        # Setup tables if they don't exist (sync call)
        self._checkpointer.setup()
    
    async def close(self):
        """Close database connections."""
        if self._pool:
            self._pool.close()


# Global checkpointer manager instance
checkpointer_manager = CheckpointerManager()
