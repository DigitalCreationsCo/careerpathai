"""Unit tests for the research FastAPI router."""

import uuid
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

from api.index import app
from api.db.models import User, ResearchSession


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def user():
    return User(
        id=uuid.uuid4(),
        email="user@example.com",
        name="User",
        password_hash="x",
        role="member",
    )


def make_session(user_id):
    return ResearchSession(
        id=uuid.uuid4(),
        user_id=user_id,
        thread_id=str(uuid.uuid4()),
        status="active",
    )


@pytest.mark.asyncio
@patch("api.research.checkpointer_manager.get_checkpointer")
@patch("api.research.deep_researcher.compile")
@patch("api.research.session_manager.create_session")
@patch("api.auth_middleware.get_current_user")
async def test_start_endpoint(
    mock_get_current_user,
    mock_create_session,
    mock_compile,
    mock_get_checkpointer,
    client,
    user,
):
    mock_get_current_user.return_value = user
    sess = make_session(user.id)
    mock_create_session.return_value = sess

    # Mock graph and its astream
    mock_graph = AsyncMock()
    async def astream(*args, **kwargs):
        yield {"research_brief": "rb"}
    mock_graph.astream = astream
    mock_compile.return_value = mock_graph

    r = client.post("/api/research/start", json={"message": "hello"})
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == str(sess.id)
    assert body["status"] == "active"


@pytest.mark.asyncio
@patch("api.research.session_manager.get_user_sessions")
@patch("api.auth_middleware.get_current_user")
async def test_sessions_list(
    mock_get_current_user,
    mock_get_sessions,
    client,
    user,
):
    mock_get_current_user.return_value = user
    sess = make_session(user.id)
    mock_get_sessions.return_value = [sess]

    r = client.get("/api/research/sessions")
    assert r.status_code == 200
    assert r.json()["total"] == 1


@pytest.mark.asyncio
@patch("api.research.session_manager.get_session")
@patch("api.auth_middleware.get_current_user")
async def test_get_session(
    mock_get_current_user,
    mock_get_session,
    client,
    user,
):
    mock_get_current_user.return_value = user
    sess = make_session(user.id)
    mock_get_session.return_value = sess

    r = client.get(f"/api/research/session/{sess.id}")
    assert r.status_code == 200
    assert r.json()["id"] == str(sess.id)


@pytest.mark.asyncio
@patch("api.research.checkpointer_manager.get_checkpointer")
@patch("api.research.deep_researcher.compile")
@patch("api.research.session_manager.get_session")
@patch("api.auth_middleware.get_current_user")
async def test_send_message(
    mock_get_current_user,
    mock_get_session,
    mock_compile,
    mock_get_checkpointer,
    client,
    user,
):
    mock_get_current_user.return_value = user
    sess = make_session(user.id)
    mock_get_session.return_value = sess

    mock_graph = AsyncMock()
    async def astream(*args, **kwargs):
        yield {"research_brief": "rb2"}
    mock_graph.astream = astream
    mock_compile.return_value = mock_graph

    r = client.post(f"/api/research/session/{sess.id}/message", json={"message": "go"})
    assert r.status_code == 200
    assert r.json()["status"] == "message_sent"


@pytest.mark.asyncio
@patch("api.research.session_manager.delete_session")
@patch("api.auth_middleware.get_current_user")
async def test_delete_session(
    mock_get_current_user,
    mock_delete_session,
    client,
    user,
):
    mock_get_current_user.return_value = user
    mock_delete_session.return_value = True

    sess = make_session(user.id)
    r = client.delete(f"/api/research/session/{sess.id}")
    assert r.status_code == 200
    assert r.json()["status"] == "deleted"

