import jwt
import httpx
import pytest

from app.main import app
from app.dependencies import get_db

pytestmark = pytest.mark.integration

# N3 regression suite: the N1 authentication contract over HTTP, re-checked after
# N2 changed the refresh cookie (REFRESH_COOKIE_SECURE) and the account flows.

AUTH = "/api/identity/authentication"
USERS = "/api/identity/users"
PASSWORD = "senha-forte-123"

@pytest.fixture
async def client(session):
    async def test_db():
        yield session

    app.dependency_overrides[get_db] = test_db
    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as http:
            yield http
    finally:
        app.dependency_overrides.pop(get_db, None)

def _refresh_cookie(response: httpx.Response) -> str:
    header = response.headers["set-cookie"]
    assert header.startswith("refresh_token=")

    return header.split(";", 1)[0].split("=", 1)[1]

def _user_id(access_token: str) -> str:
    return jwt.decode(access_token, options={"verify_signature": False})["sub"]

async def _register(client, email="regressao@example.com", cpf="52998224725"):
    return await client.post(USERS, json={"name": "Regressão N3", "cpf": cpf, "email": email, "password": PASSWORD})

async def test_register_returns_token_and_scoped_http_only_refresh_cookie(client):
    response = await _register(client)

    assert response.status_code == 201
    assert response.json()["access_token"]
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie
    assert f"path={AUTH}" in cookie
    # development keeps the N1 behavior: no Secure flag, SameSite=Lax.
    assert "secure" not in cookie
    assert "samesite=lax" in cookie

async def test_register_with_duplicate_email_or_cpf_returns_409(client):
    assert (await _register(client)).status_code == 201

    assert (await _register(client, cpf="11144477735")).status_code == 409
    assert (await _register(client, email="outro@example.com")).status_code == 409

async def test_login_with_wrong_password_returns_401(client):
    await _register(client)

    response = await client.post(f"{AUTH}/login", json={"email": "regressao@example.com", "password": "errada-123"})

    assert response.status_code == 401

async def test_refresh_rotates_cookie_and_rejects_the_previous_one(client):
    await _register(client)
    login = await client.post(f"{AUTH}/login", json={"email": "regressao@example.com", "password": PASSWORD})
    assert login.status_code == 200
    first = _refresh_cookie(login)
    client.cookies.clear()

    rotated = await client.post(f"{AUTH}/refresh", headers={"Cookie": f"refresh_token={first}"})
    assert rotated.status_code == 200
    assert rotated.json()["access_token"]
    assert _refresh_cookie(rotated) != first
    client.cookies.clear()

    reused = await client.post(f"{AUTH}/refresh", headers={"Cookie": f"refresh_token={first}"})
    assert reused.status_code == 401

async def test_refresh_without_cookie_returns_401(client):
    response = await client.post(f"{AUTH}/refresh")

    assert response.status_code == 401

async def test_logout_clears_cookie_and_revokes_refresh(client):
    registered = await _register(client)
    access = registered.json()["access_token"]
    refresh = _refresh_cookie(registered)
    client.cookies.clear()

    logout = await client.post(f"{AUTH}/logout", headers={"Authorization": f"Bearer {access}"})
    assert logout.status_code == 204
    assert "max-age=0" in logout.headers["set-cookie"].lower()
    client.cookies.clear()

    after = await client.post(f"{AUTH}/refresh", headers={"Cookie": f"refresh_token={refresh}"})
    assert after.status_code == 401

async def test_profile_requires_owner_token(client):
    registered = await _register(client)
    access = registered.json()["access_token"]
    other = await _register(client, email="outro@example.com", cpf="11144477735")
    other_access = other.json()["access_token"]

    me = await client.get(f"{USERS}/{_user_id(access)}", headers={"Authorization": f"Bearer {access}"})
    assert me.status_code == 200
    assert me.json()["email"] == "regressao@example.com"

    forbidden = await client.get(f"{USERS}/{_user_id(access)}", headers={"Authorization": f"Bearer {other_access}"})
    assert forbidden.status_code == 403

    anonymous = await client.get(f"{USERS}/{_user_id(access)}")
    assert anonymous.status_code == 401

async def test_forgot_password_does_not_reveal_whether_the_account_exists(client):
    await _register(client)

    known = await client.post(f"{AUTH}/password/forgot", json={"email": "regressao@example.com"})
    unknown = await client.post(f"{AUTH}/password/forgot", json={"email": "ninguem@example.com"})

    assert known.status_code == unknown.status_code == 202
    assert known.json() == unknown.json()
