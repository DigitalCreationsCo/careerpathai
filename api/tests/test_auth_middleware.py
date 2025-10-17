"""Unit tests for NextAuth JWT verification middleware."""

import os
import uuid
import jwt
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
import dotenv

dotenv.load_dotenv(dotenv.find_dotenv('.env.local'))

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

def test_verify_jwt():
    os.environ['AUTH_SECRET'] = 'e89cd4dd3bc84d402a5d7823b940291fb80aa831f2f6087b68263fbe1f1dde5d'
    
    from auth_middleware import decrypt_jwe_token, derive_keys_from_secret

    token = "eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiczBqVUw3TGRxQmNicFZvaUJWZVJSZmFuTThyV29IUlNmWV9WTG5WS25HS0FJdFM5aDNRLXNXc3JQazF0MDJ3MTUxWnp4RzhycDV1WDEtbWJWUS1ydXcifQ..NBbYwU3Mbdp3WYFc_YoxGQ.F8DWFVsYCH4JZG3NFgkLpwdwXFJbfSiSsZ3dL0nNvOux1WLDSAyBHeINYVQpw1E_eBU2yUTMlQs10SP_yvxh9Dj7mvYMiVJj3nZ1b_iQNvt0g5s_kz2cu7ah4uwJWoDu9E-0M6dUcWOkORQqWA-qHtiT5bxaUplhNxUFICI9H5gA0GioBK5S2pg7LOHY-6DTQ3oRpebsP9SPbxi7Jgs4vaTy6PQqVZwvy8t9-KJAlGvJgrQxOIjhWtocl344tioIk3EkKVgyFWIEWjuQTYMmdls1MPy5Z6Kt55n6gtgcE4xiRj4EdmCxWq57WgKhdRsPv8ixBYEcrTMRSbCEoXOpJ-uuOcp8w89g3cdjqHztX-FpFznIEke6jzhk5GZE1MnjZkazeCpda36zzJ4stE-_9Q.AGG5C96CilMPszCNEotTj4P-RO8BPtuuqAQHrWkLgDk"
    mac_key, enc_key = derive_keys_from_secret(os.getenv('AUTH_SECRET'))
    payload = decrypt_jwe_token(token, mac_key, enc_key)
    print("Payload: ", payload)