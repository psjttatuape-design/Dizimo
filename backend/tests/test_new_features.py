"""
Test cases for new features:
- Dashboard filters (Status, Nota, Mês Contribuição)
- New dizimista fields (modo_contribuicao, mes_contribuicao)
- Export with filters
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestAuthentication:
    """Authentication tests"""
    
    def test_admin_login(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "admin"
        print("✓ Admin login successful")


@pytest.fixture
def auth_token():
    """Get authentication token for admin"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123"
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Could not authenticate")


@pytest.fixture
def auth_headers(auth_token):
    """Headers with authorization token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestDizimistaNewFields:
    """Test new fields: modo_contribuicao and mes_contribuicao"""
    
    def test_create_dizimista_with_new_fields(self, auth_headers):
        """Create a dizimista with modo_contribuicao and mes_contribuicao"""
        dizimista_data = {
            "nome": "TEST_Dizimista_API_NewFields",
            "telefone": "(11) 99999-8888",
            "email": "test.api@teste.com",
            "nota": "Novo",
            "status": "Ativo",
            "modo_contribuicao": "PIX",
            "mes_contribuicao": "3",  # Março
            "valor_dizimo": 200.00
        }
        
        response = requests.post(
            f"{BASE_URL}/api/dizimistas",
            json=dizimista_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify new fields are saved
        assert data["modo_contribuicao"] == "PIX"
        assert data["mes_contribuicao"] == "3"
        assert data["nome"] == "TEST_Dizimista_API_NewFields"
        assert "id" in data
        
        print(f"✓ Created dizimista with new fields: {data['id']}")
        return data["id"]
    
    def test_update_dizimista_new_fields(self, auth_headers):
        """Update dizimista with new fields"""
        # First create a dizimista
        create_response = requests.post(
            f"{BASE_URL}/api/dizimistas",
            json={
                "nome": "TEST_Update_NewFields",
                "modo_contribuicao": "Envelope",
                "mes_contribuicao": "1"
            },
            headers=auth_headers
        )
        assert create_response.status_code == 200
        dizimista_id = create_response.json()["id"]
        
        # Update the fields
        update_response = requests.put(
            f"{BASE_URL}/api/dizimistas/{dizimista_id}",
            json={
                "modo_contribuicao": "Depósito",
                "mes_contribuicao": "6"
            },
            headers=auth_headers
        )
        
        assert update_response.status_code == 200
        data = update_response.json()
        assert data["modo_contribuicao"] == "Depósito"
        assert data["mes_contribuicao"] == "6"
        
        print(f"✓ Updated dizimista new fields: {dizimista_id}")


class TestDizimistaFilters:
    """Test dizimista listing with filters"""
    
    def test_list_all_dizimistas(self, auth_headers):
        """List all dizimistas without filters"""
        response = requests.get(
            f"{BASE_URL}/api/dizimistas",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} dizimistas")
    
    def test_filter_by_status(self, auth_headers):
        """Filter dizimistas by status"""
        response = requests.get(
            f"{BASE_URL}/api/dizimistas?status=Ativo",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned dizimistas should have status=Ativo
        for d in data:
            assert d.get("status") == "Ativo" or d.get("status") is None
        
        print(f"✓ Filtered by status=Ativo: {len(data)} results")
    
    def test_filter_by_nota(self, auth_headers):
        """Filter dizimistas by nota"""
        response = requests.get(
            f"{BASE_URL}/api/dizimistas?nota=Novo",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        for d in data:
            assert d.get("nota") == "Novo"
        
        print(f"✓ Filtered by nota=Novo: {len(data)} results")
    
    def test_filter_by_birthday_month(self, auth_headers):
        """Filter dizimistas by birthday month"""
        response = requests.get(
            f"{BASE_URL}/api/dizimistas?mes_aniversario=1",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all returned have birthday in January
        for d in data:
            if d.get("data_nascimento"):
                parts = d["data_nascimento"].split("-")
                if len(parts) >= 2:
                    assert parts[1] == "01"
        
        print(f"✓ Filtered by birthday month=1: {len(data)} results")


class TestExportWithFilters:
    """Test Excel export with filters"""
    
    def test_export_all(self, auth_headers):
        """Export all dizimistas"""
        response = requests.get(
            f"{BASE_URL}/api/dizimistas/export/excel",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")
        print("✓ Export all dizimistas successful")
    
    def test_export_with_status_filter(self, auth_headers):
        """Export with status filter"""
        response = requests.get(
            f"{BASE_URL}/api/dizimistas/export/excel?status=Ativo",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers.get("content-type", "")
        print("✓ Export with status=Ativo filter successful")
    
    def test_export_with_nota_filter(self, auth_headers):
        """Export with nota filter"""
        response = requests.get(
            f"{BASE_URL}/api/dizimistas/export/excel?nota=Novo",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        print("✓ Export with nota=Novo filter successful")
    
    def test_export_with_multiple_filters(self, auth_headers):
        """Export with multiple filters"""
        response = requests.get(
            f"{BASE_URL}/api/dizimistas/export/excel?status=Ativo&nota=Novo&mes_aniversario=3",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        print("✓ Export with multiple filters successful")


class TestDashboardFilters:
    """Test dashboard/reports endpoints with filters"""
    
    def test_resumo_without_filters(self, auth_headers):
        """Get resumo without filters"""
        response = requests.get(
            f"{BASE_URL}/api/relatorios/resumo",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_dizimistas" in data
        assert "total_arrecadado" in data
        print(f"✓ Resumo: {data['total_dizimistas']} dizimistas, R$ {data['total_arrecadado']}")
    
    def test_resumo_with_status_filter(self, auth_headers):
        """Get resumo filtered by status"""
        response = requests.get(
            f"{BASE_URL}/api/relatorios/resumo?status=Ativo",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_dizimistas" in data
        print(f"✓ Resumo with status=Ativo: {data['total_dizimistas']} active dizimistas")
    
    def test_resumo_with_nota_filter(self, auth_headers):
        """Get resumo filtered by nota"""
        response = requests.get(
            f"{BASE_URL}/api/relatorios/resumo?nota=OK",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Resumo with nota=OK: {data['total_dizimistas']} dizimistas")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_dizimistas(self, auth_headers):
        """Delete test dizimistas created during tests"""
        # Get all dizimistas
        response = requests.get(
            f"{BASE_URL}/api/dizimistas",
            headers=auth_headers
        )
        
        if response.status_code == 200:
            dizimistas = response.json()
            deleted_count = 0
            
            for d in dizimistas:
                if d.get("nome", "").startswith("TEST_"):
                    delete_response = requests.delete(
                        f"{BASE_URL}/api/dizimistas/{d['id']}",
                        headers=auth_headers
                    )
                    if delete_response.status_code == 200:
                        deleted_count += 1
            
            print(f"✓ Cleaned up {deleted_count} test dizimistas")
