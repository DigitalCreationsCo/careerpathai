"""Session lifecycle management for research sessions."""

import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from .db import get_db_session, ResearchSession, User
from .research_config import config_manager


class SessionManager:
    """Manages research session lifecycle."""
    
    async def create_session(
        self,
        user_id: str,
        chat_id: Optional[str] = None,
        configuration: Optional[Dict[str, Any]] = None
    ) -> ResearchSession:
        """Create a new research session."""
        thread_id = str(uuid.uuid4())
        
        async with get_db_session() as session:
            research_session = ResearchSession(
                user_id=uuid.UUID(user_id),
                chat_id=uuid.UUID(chat_id) if chat_id else None,
                thread_id=thread_id,
                status="active",
                configuration=configuration or {}
            )
            
            session.add(research_session)
            await session.commit()
            await session.refresh(research_session)
            
            return research_session
    
    async def get_session(self, session_id: str, user_id: str) -> Optional[ResearchSession]:
        """Get a research session by ID, ensuring user ownership."""
        async with get_db_session() as session:
            result = await session.execute(
                select(ResearchSession).where(
                    ResearchSession.id == uuid.UUID(session_id),
                    ResearchSession.user_id == uuid.UUID(user_id)
                )
            )
            return result.scalar_one_or_none()
    
    async def get_user_sessions(
        self,
        user_id: str,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[ResearchSession]:
        """Get all research sessions for a user."""
        async with get_db_session() as session:
            query = select(ResearchSession).where(
                ResearchSession.user_id == uuid.UUID(user_id)
            )
            
            if status:
                query = query.where(ResearchSession.status == status)
            
            query = query.order_by(ResearchSession.created_at.desc()).limit(limit).offset(offset)
            
            result = await session.execute(query)
            return result.scalars().all()
    
    async def update_session_status(
        self,
        session_id: str,
        user_id: str,
        status: str,
        research_brief: Optional[str] = None
    ) -> Optional[ResearchSession]:
        """Update session status and optionally research brief."""
        async with get_db_session() as session:
            result = await session.execute(
                update(ResearchSession)
                .where(
                    ResearchSession.id == uuid.UUID(session_id),
                    ResearchSession.user_id == uuid.UUID(user_id)
                )
                .values(
                    status=status,
                    research_brief=research_brief,
                    updated_at=datetime.utcnow()
                )
                .returning(ResearchSession)
            )
            
            updated_session = result.scalar_one_or_none()
            if updated_session:
                await session.commit()
            
            return updated_session
    
    async def complete_session(
        self,
        session_id: str,
        user_id: str,
        research_brief: Optional[str] = None
    ) -> Optional[ResearchSession]:
        """Mark a session as completed."""
        return await self.update_session_status(
            session_id, user_id, "completed", research_brief
        )
    
    async def archive_old_sessions(self, days_old: int = 30) -> int:
        """Archive sessions older than specified days."""
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)
        
        async with get_db_session() as session:
            result = await session.execute(
                update(ResearchSession)
                .where(
                    ResearchSession.status == "completed",
                    ResearchSession.updated_at < cutoff_date
                )
                .values(status="archived")
            )
            
            await session.commit()
            return result.rowcount
    
    async def delete_session(self, session_id: str, user_id: str) -> bool:
        """Delete a research session."""
        async with get_db_session() as session:
            result = await session.execute(
                delete(ResearchSession).where(
                    ResearchSession.id == uuid.UUID(session_id),
                    ResearchSession.user_id == uuid.UUID(user_id)
                )
            )
            
            await session.commit()
            return result.rowcount > 0
    
    async def get_session_by_thread_id(self, thread_id: str) -> Optional[ResearchSession]:
        """Get session by thread_id (for LangGraph integration)."""
        async with get_db_session() as session:
            result = await session.execute(
                select(ResearchSession).where(ResearchSession.thread_id == thread_id)
            )
            return result.scalar_one_or_none()
    
    def create_runnable_config(
        self,
        session: ResearchSession,
        additional_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create RunnableConfig for a session."""
        return config_manager.create_runnable_config(
            session.thread_id,
            str(session.user_id),
            session.configuration
        )


# Global session manager instance
session_manager = SessionManager()
