"""Integration tests for research session management."""

import pytest
import uuid
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from ..index import app
from ..db.models import User, ResearchSession


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_user():
    """Create mock user for testing."""
    return User(
        id=uuid.uuid4(),
        email="test@example.com",
        name="Test User",
        password_hash="hashed_password",
        role="member"
    )


@pytest.fixture
def mock_session():
    """Create mock research session for testing."""
    return ResearchSession(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        thread_id=str(uuid.uuid4()),
        status="active",
        research_brief="Test research brief"
    )


class TestResearchSessionManagement:
    """Test research session management endpoints."""
    
    @patch('api.research.session_manager.create_session')
    @patch('api.research.checkpointer_manager.get_checkpointer')
    @patch('api.research.deep_researcher.compile')
    @patch('api.auth_middleware.get_current_user')
    async def test_start_research_session(
        self,
        mock_get_user,
        mock_compile,
        mock_get_checkpointer,
        mock_create_session,
        client,
        mock_user,
        mock_session
    ):
        """Test starting a new research session."""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_create_session.return_value = mock_session
        mock_checkpointer = AsyncMock()
        mock_get_checkpointer.return_value = mock_checkpointer
        mock_graph = AsyncMock()
        mock_compile.return_value = mock_graph
        
        # Mock the graph streaming
        async def mock_astream(*args, **kwargs):
            yield {"research_brief": "Test research brief"}
        
        mock_graph.astream = mock_astream
        
        # Make request
        response = client.post(
            "/api/research/start",
            json={
                "message": "Research the latest trends in AI",
                "chat_id": str(uuid.uuid4())
            }
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(mock_session.id)
        assert data["status"] == "active"
        assert data["thread_id"] == mock_session.thread_id
    
    @patch('api.research.session_manager.get_user_sessions')
    @patch('api.auth_middleware.get_current_user')
    async def test_get_user_sessions(
        self,
        mock_get_user,
        mock_get_sessions,
        client,
        mock_user,
        mock_session
    ):
        """Test getting user's research sessions."""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_sessions.return_value = [mock_session]
        
        # Make request
        response = client.get("/api/research/sessions")
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert len(data["sessions"]) == 1
        assert data["sessions"][0]["id"] == str(mock_session.id)
        assert data["total"] == 1
    
    @patch('api.research.session_manager.get_session')
    @patch('api.auth_middleware.get_current_user')
    async def test_get_session(
        self,
        mock_get_user,
        mock_get_session,
        client,
        mock_user,
        mock_session
    ):
        """Test getting a specific research session."""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_session.return_value = mock_session
        
        # Make request
        response = client.get(f"/api/research/session/{mock_session.id}")
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(mock_session.id)
        assert data["status"] == "active"
    
    @patch('api.research.session_manager.get_session')
    @patch('api.research.checkpointer_manager.get_checkpointer')
    @patch('api.research.deep_researcher.compile')
    @patch('api.auth_middleware.get_current_user')
    async def test_send_message_to_session(
        self,
        mock_get_user,
        mock_compile,
        mock_get_checkpointer,
        mock_get_session,
        client,
        mock_user,
        mock_session
    ):
        """Test sending a message to an existing session."""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_get_session.return_value = mock_session
        mock_checkpointer = AsyncMock()
        mock_get_checkpointer.return_value = mock_checkpointer
        mock_graph = AsyncMock()
        mock_compile.return_value = mock_graph
        
        # Mock the graph streaming
        async def mock_astream(*args, **kwargs):
            yield {"research_brief": "Updated research brief"}
        
        mock_graph.astream = mock_astream
        
        # Make request
        response = client.post(
            f"/api/research/session/{mock_session.id}/message",
            json={"message": "Continue the research"}
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "message_sent"
        assert data["session_id"] == str(mock_session.id)
    
    @patch('api.research.session_manager.delete_session')
    @patch('api.auth_middleware.get_current_user')
    async def test_delete_session(
        self,
        mock_get_user,
        mock_delete_session,
        client,
        mock_user,
        mock_session
    ):
        """Test deleting a research session."""
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_delete_session.return_value = True
        
        # Make request
        response = client.delete(f"/api/research/session/{mock_session.id}")
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"
        assert data["session_id"] == str(mock_session.id)


class TestAuthentication:
    """Test authentication middleware."""
    
    async def test_unauthenticated_request(self, client):
        """Test that unauthenticated requests are rejected."""
        response = client.post(
            "/api/research/start",
            json={"message": "Test message"}
        )
        
        assert response.status_code == 401
        assert "Authentication required" in response.json()["detail"]
    
    @patch('api.auth_middleware.auth_middleware.get_user_from_cookie')
    async def test_cookie_authentication(self, mock_get_user_from_cookie, client, mock_user):
        """Test authentication via session cookie."""
        mock_get_user_from_cookie.return_value = mock_user
        
        response = client.get(
            "/api/research/sessions",
            cookies={"next-auth.session-token": "valid_token"}
        )
        
        # Should not raise authentication error
        assert response.status_code != 401


class TestSessionLifecycle:
    """Test session lifecycle management."""
    
    @patch('api.session_manager.SessionManager.create_session')
    async def test_session_creation(self, mock_create_session, mock_user, mock_session):
        """Test session creation logic."""
        mock_create_session.return_value = mock_session
        
        from api.session_manager import session_manager
        
        session = await session_manager.create_session(
            user_id=str(mock_user.id),
            chat_id=str(uuid.uuid4()),
            configuration={"max_researcher_iterations": 5}
        )
        
        assert session.id == mock_session.id
        assert session.user_id == mock_user.id
        assert session.status == "active"
    
    @patch('api.session_manager.SessionManager.update_session_status')
    async def test_session_status_update(self, mock_update_status, mock_user, mock_session):
        """Test session status update logic."""
        mock_update_status.return_value = mock_session
        
        from api.session_manager import session_manager
        
        updated_session = await session_manager.complete_session(
            str(mock_session.id),
            str(mock_user.id),
            "Completed research brief"
        )
        
        assert updated_session.id == mock_session.id
        mock_update_status.assert_called_once_with(
            str(mock_session.id),
            str(mock_user.id),
            "completed",
            "Completed research brief"
        )
