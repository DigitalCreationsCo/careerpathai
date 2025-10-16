"""Unit tests for SessionManager."""

import uuid
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta

from api.session_manager import session_manager
from api.db.models import ResearchSession


def make_session(**overrides):
    base = {
        "id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "chat_id": None,
        "thread_id": str(uuid.uuid4()),
        "status": "active",
        "research_brief": None,
        "configuration": {},
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    base.update(overrides)
    s = ResearchSession(**base)
    return s


@pytest.mark.asyncio
async def test_create_session(monkeypatch):
    new_session = make_session()

    class FakeSession:
        def add(self, obj):
            pass
        async def commit(self):
            pass
        async def refresh(self, obj):
            pass

    async def fake_ctx():
        yield FakeSession()

    with patch("api.session_manager.get_db_session", fake_ctx):
        s = await session_manager.create_session(str(new_session.user_id), None, {"x": 1})
        # We don't assert DB fields since we use SQLAlchemy in real impl; basic sanity
        assert s.status == "active"


@pytest.mark.asyncio
async def test_update_and_complete_session(monkeypatch):
    existing = make_session()
    updated = make_session(id=existing.id, user_id=existing.user_id, status="completed")

    class FakeResult:
        def __init__(self, value):
            self.value = value
        def scalar_one_or_none(self):
            return self.value

    class FakeSession:
        async def execute(self, *args, **kwargs):
            return FakeResult(updated)
        async def commit(self):
            pass

    async def fake_ctx():
        yield FakeSession()

    with patch("api.session_manager.get_db_session", fake_ctx):
        s = await session_manager.complete_session(str(existing.id), str(existing.user_id), "rb")
        assert s.status == "completed"


@pytest.mark.asyncio
async def test_get_user_sessions(monkeypatch):
    s1 = make_session()

    class FakeResult:
        def __init__(self, values):
            self.values = values
        def scalars(self):
            class _:
                def __init__(self, vs):
                    self.vs = vs
                def all(self):
                    return self.vs
            return _(self.values)

    class FakeSession:
        async def execute(self, *args, **kwargs):
            return FakeResult([s1])

    async def fake_ctx():
        yield FakeSession()

    with patch("api.session_manager.get_db_session", fake_ctx):
        sessions = await session_manager.get_user_sessions(str(s1.user_id))
        assert len(sessions) == 1
        assert sessions[0].id == s1.id

