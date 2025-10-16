"""SQLAlchemy models for database access from Python FastAPI backend."""

import uuid
from datetime import datetime
from typing import Optional, Dict, Any

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    """User model matching the TypeScript schema."""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100))
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(Text, nullable=False)
    role = Column(String(20), nullable=False, default="member")
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now())
    deleted_at = Column(DateTime)
    
    # Relationships
    research_sessions = relationship("ResearchSession", back_populates="user")


class Chat(Base):
    """Chat model matching the TypeScript schema."""
    __tablename__ = "Chat"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, nullable=False)
    title = Column(Text, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    visibility = Column(String(20), nullable=False, default="private")
    last_context = Column(JSONB)
    
    # Relationships
    research_sessions = relationship("ResearchSession", back_populates="chat")


class ResearchSession(Base):
    """Research session model for managing LangGraph research sessions."""
    __tablename__ = "research_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("Chat.id"), nullable=True)
    thread_id = Column(String(255), nullable=False, unique=True)
    status = Column(String(50), nullable=False, default="active")
    research_brief = Column(Text)
    configuration = Column(JSONB)
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="research_sessions")
    chat = relationship("Chat", back_populates="research_sessions")
    
    # Indexes
    __table_args__ = (
        Index("idx_research_sessions_user_id", "user_id"),
        Index("idx_research_sessions_thread_id", "thread_id"),
        Index("idx_research_sessions_status", "status"),
    )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for JSON serialization."""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "chat_id": str(self.chat_id) if self.chat_id else None,
            "thread_id": self.thread_id,
            "status": self.status,
            "research_brief": self.research_brief,
            "configuration": self.configuration,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
