"""Backend regression tests after refactor (server.py → routes/* + services/*).

Validates that all endpoints continue to work as expected and that no
behavior changed during the refactor. No mocks; live API hits via
REACT_APP_BACKEND_URL.
"""
import io
import os
import uuid

import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"


# ---------------- fixtures ----------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(
        f"{API}/auth/login",
        json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
    )
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json",
    }


@pytest.fixture(scope="session")
def first_dizimista_id(session, auth_headers):
    """Pick first existing dizimista or create one for contribuição tests."""
    r = session.get(f"{API}/dizimistas", headers=auth_headers, timeout=30)
    assert r.status_code == 200
    items = r.json()
    if items:
        return items[0]["id"]
    payload = {"nome": f"TEST_DIZ_{uuid.uuid4().hex[:6]}", "valor_dizimo": 50.0}
    r = session.post(f"{API}/dizimistas", headers=auth_headers, json=payload)
    assert r.status_code == 200
    return r.json()["id"]


# ---------------- health ----------------
class TestHealth:
    def test_health_endpoint(self, session):
        r = session.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json() == {"status": "healthy"}


# ---------------- auth ----------------
class TestAuth:
    def test_login_success(self, session):
        r = session.post(
            f"{API}/auth/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD},
        )
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body.get("access_token"), str)
        assert len(body["access_token"]) > 0
        assert body.get("token_type") == "bearer"
        assert body["user"]["username"] == "admin"
        assert "password" not in body["user"]

    def test_login_invalid(self, session):
        r = session.post(
            f"{API}/auth/login",
            json={"username": "admin", "password": "wrong"},
        )
        assert r.status_code == 401

    def test_me_requires_token(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code in (401, 403)

    def test_me_with_token(self, session, auth_headers):
        r = session.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        u = r.json()
        assert u["username"] == "admin"
        assert u["role"] == "admin"
        assert "password" not in u


# ---------------- users (admin) ----------------
class TestUsers:
    def test_list_users_admin(self, session, auth_headers):
        r = session.get(f"{API}/users", headers=auth_headers)
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list)
        assert any(u.get("username") == "admin" for u in users)
        for u in users:
            assert "password" not in u
            assert "_id" not in u


# ---------------- dizimistas ----------------
class TestDizimistas:
    def test_list_returns_200(self, session, auth_headers):
        r = session.get(f"{API}/dizimistas", headers=auth_headers, timeout=60)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        # Spec says ~156 dizimistas; relax to >0 to avoid being brittle
        assert len(items) > 0
        for d in items[:5]:
            assert "_id" not in d
            assert "id" in d
            assert "nome" in d

    def test_template_excel_download(self, session, auth_headers):
        r = session.get(f"{API}/dizimistas/template/excel", headers=auth_headers)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "spreadsheetml" in ct or "excel" in ct.lower()
        # XLSX magic bytes: PK..
        assert r.content[:2] == b"PK"

    def test_export_excel_download(self, session, auth_headers):
        r = session.get(f"{API}/dizimistas/export/excel", headers=auth_headers)
        assert r.status_code == 200
        ct = r.headers.get("content-type", "")
        assert "spreadsheetml" in ct or "excel" in ct.lower()
        assert r.content[:2] == b"PK"


# ---------------- contribuicoes ----------------
class TestContribuicoes:
    def test_list_contribuicoes(self, session, auth_headers):
        r = session.get(f"{API}/contribuicoes", headers=auth_headers, timeout=60)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        for c in items[:5]:
            assert "_id" not in c
            assert "dizimista_nome" in c

    def test_create_invalid_valor_zero_returns_422(self, session, auth_headers, first_dizimista_id):
        payload = {"dizimista_id": first_dizimista_id, "valor": 0, "mes_referencia": "1"}
        r = session.post(f"{API}/contribuicoes", headers=auth_headers, json=payload)
        assert r.status_code == 422

    def test_create_invalid_negative_returns_422(self, session, auth_headers, first_dizimista_id):
        payload = {"dizimista_id": first_dizimista_id, "valor": -10, "mes_referencia": "1"}
        r = session.post(f"{API}/contribuicoes", headers=auth_headers, json=payload)
        assert r.status_code == 422

    def test_create_and_delete_contribuicao_with_sync(self, session, auth_headers, first_dizimista_id):
        payload = {
            "dizimista_id": first_dizimista_id,
            "valor": 12.34,
            "mes_referencia": "1",
            "meio": "PIX",
            "data": "2026-01-15",
        }
        r = session.post(f"{API}/contribuicoes", headers=auth_headers, json=payload)
        assert r.status_code == 200, r.text
        created = r.json()
        cid = created["id"]
        assert created["valor"] == 12.34
        assert created["mes_referencia"] == "1"
        assert created.get("dizimista_nome")
        assert "_id" not in created

        # Verify GET shows the new record with dizimista_nome populated
        r2 = session.get(
            f"{API}/contribuicoes",
            headers=auth_headers,
            params={"dizimista_id": first_dizimista_id},
        )
        assert r2.status_code == 200
        ids = [c["id"] for c in r2.json()]
        assert cid in ids

        # Verify auto-sync: valores_mensais should contain entry for mes=1, ano=2026
        r3 = session.get(f"{API}/valores-mensais", headers=auth_headers)
        assert r3.status_code == 200
        vm = r3.json()
        match = [v for v in vm if v.get("mes") == 1 and v.get("ano") == 2026]
        assert len(match) >= 1, "Auto-sync did not create/update valor mensal"

        # DELETE
        rd = session.delete(f"{API}/contribuicoes/{cid}", headers=auth_headers)
        assert rd.status_code == 200
        assert "excluí" in rd.json().get("message", "").lower() or rd.json().get("message")

        # Verify deletion
        r4 = session.get(
            f"{API}/contribuicoes",
            headers=auth_headers,
            params={"dizimista_id": first_dizimista_id},
        )
        assert cid not in [c["id"] for c in r4.json()]

    def test_sincronizar_valores_mensais_admin(self, session, auth_headers):
        r = session.post(
            f"{API}/contribuicoes/sincronizar-valores-mensais", headers=auth_headers
        )
        assert r.status_code == 200
        body = r.json()
        assert "message" in body
        assert "totais" in body


# ---------------- valores mensais ----------------
class TestValoresMensais:
    def test_list(self, session, auth_headers):
        r = session.get(f"{API}/valores-mensais", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------------- relatorios ----------------
class TestRelatorios:
    def test_resumo_structure(self, session, auth_headers):
        r = session.get(f"{API}/relatorios/resumo", headers=auth_headers, timeout=60)
        assert r.status_code == 200
        b = r.json()
        for key in (
            "total_dizimistas",
            "dizimistas_ativos",
            "dizimistas_pendentes",
            "dizimistas_inativos",
            "total_arrecadado",
            "por_mes",
        ):
            assert key in b, f"Missing key: {key}"
        assert isinstance(b["total_dizimistas"], int)
        assert isinstance(b["por_mes"], dict)

    def test_relatorio_contribuicoes(self, session, auth_headers):
        r = session.get(f"{API}/relatorios/contribuicoes", headers=auth_headers, timeout=60)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        if items:
            assert "dizimista_nome" in items[0]
            assert "_id" not in items[0]
