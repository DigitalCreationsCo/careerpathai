"""Unit tests for CheckpointerManager."""

import os
import pytest
from unittest.mock import patch, MagicMock

from api.checkpointer import CheckpointerManager


@pytest.mark.asyncio
async def test_initializes_with_psycopg_pool(monkeypatch):
    monkeypatch.setenv("POSTGRES_URL", "postgresql://user:pass@localhost:5432/db")

    created_pool = {}

    class DummyPool:
        def __init__(self, conninfo, **kwargs):
            created_pool["conninfo"] = conninfo
            created_pool["kwargs"] = kwargs
        def close(self):
            created_pool["closed"] = True

    with patch("api.checkpointer.ConnectionPool", DummyPool):
        with patch("api.checkpointer.PostgresSaver") as Saver:
            saver = MagicMock()
            Saver.return_value = saver

            mgr = CheckpointerManager()
            cp = await mgr.get_checkpointer()

            # setup() is called synchronously
            assert Saver.called
            assert saver.setup.called
            assert created_pool["conninfo"].startswith("postgresql://")
            assert created_pool["kwargs"]["min_size"] == 1


@pytest.mark.asyncio
async def test_normalizes_asyncpg_url(monkeypatch):
    monkeypatch.setenv("POSTGRES_URL", "postgresql+asyncpg://user:pass@localhost:5432/db")

    class DummyPool:
        def __init__(self, conninfo, **kwargs):
            self.conninfo = conninfo
        def close(self):
            pass

    with patch("api.checkpointer.ConnectionPool", DummyPool):
        with patch("api.checkpointer.PostgresSaver") as Saver:
            saver = MagicMock()
            Saver.return_value = saver

            mgr = CheckpointerManager()
            await mgr.get_checkpointer()

            # Should be downgraded to standard postgresql://
            assert Saver.call_args[0][0].conninfo.startswith("postgresql://")

