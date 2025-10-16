"""Unit tests for NextAuth JWT verification middleware."""

import uuid
import jwt
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient

from api.auth_middleware import get_current_user, auth_middleware
from api.db.models import User


def create_jwt(payload: dict, secret: str = "test_secret") -> str:
    return jwt.encode(payload, secret, algorithm="HS256")


class DummyUserRepo:
    """A tiny in-memory user repo mock used via monkeypatching the DB layer."""

    def __init__(self, user: User | None):
        self.user = user

    async def get_user_by_email(self, email: str):
        if self.user and self.user.email == email:
            return self.user
        return None


@pytest.fixture
def user():
    return User(
        id=uuid.uuid4(),
        email="user@example.com",
        name="User",
        password_hash="x",
        role="member",
    )


@pytest.fixture
def app(user, monkeypatch):
    # Patch DB dependency chain inside auth_middleware to return our user
    async def fake_get_user_from_token(token: str):
        payload = jwt.decode(token, "test_secret", algorithms=["HS256"])
        if payload.get("email") == user.email:
            return user
        raise AssertionError("Unexpected token payload")

    monkeypatch.setattr(auth_middleware, "get_user_from_token", fake_get_user_from_token)

    api = FastAPI()

    @api.get("/me")
    async def me(u: User = Depends(get_current_user)):
        return {"id": str(u.id), "email": u.email}

    return api


def test_rejects_missing_auth(app):
    client = TestClient(app)
    r = client.get("/me")
    assert r.status_code == 401


def test_accepts_bearer_token(app, user):
    client = TestClient(app)
    token = create_jwt({"email": user.email})
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == user.email


def test_accepts_cookie_token(app, user):
    client = TestClient(app)
    token = create_jwt({"email": user.email})
    r = client.get("/me", cookies={"next-auth.session-token": token})
    assert r.status_code == 200
    assert r.json()["email"] == user.email


def test_invalid_token_rejected(app):
    client = TestClient(app)
    r = client.get("/me", headers={"Authorization": "Bearer invalid"})
    assert r.status_code == 401

