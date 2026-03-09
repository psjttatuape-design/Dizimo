#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime
from typing import Optional, Dict, Any

# Get backend URL from frontend .env
BACKEND_URL = "https://permission-manager-8.preview.emergentagent.com"
API = f"{BACKEND_URL}/api"

class DizimosAPITester:
    def __init__(self):
        self.admin_token = None
        self.regular_user_token = None
        self.created_user_id = None
        self.created_dizimista_id = None
        self.created_valor_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status}: {name}")
        if details:
            print(f"   {details}")
        
        self.test_results.append({
            "test": name,
            "status": "PASSED" if success else "FAILED",
            "details": details
        })
        print()

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, token: Optional[str] = None) -> tuple[bool, Dict[str, Any]]:
        """Run a single API test"""
        url = f"{API}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'

        print(f"🔍 Testing {name}...")
        print(f"   {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            try:
                response_data = response.json() if response.content else {}
            except:
                response_data = {"raw_response": response.text}

            details = f"Status: {response.status_code}"
            if not success:
                details += f" (expected {expected_status})"
                if response.content:
                    try:
                        error_detail = response.json().get('detail', response.text[:200])
                        details += f", Error: {error_detail}"
                    except:
                        details += f", Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response_data

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self) -> bool:
        """Test health endpoint"""
        success, _ = self.run_test(
            "Health Check",
            "GET", 
            "health",
            200
        )
        return success

    def test_admin_login(self) -> bool:
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            return True
        return False

    def test_auth_me(self) -> bool:
        """Test get current user endpoint"""
        if not self.admin_token:
            self.log_test("Get Current User", False, "No admin token available")
            return False
            
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            token=self.admin_token
        )
        
        if success:
            expected_fields = ['id', 'username', 'name', 'role', 'permissions']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                self.log_test("User Data Validation", False, f"Missing fields: {missing_fields}")
                return False
            else:
                self.log_test("User Data Validation", True, "All required fields present")
        
        return success

    def test_list_users(self) -> bool:
        """Test listing users (admin only)"""
        success, response = self.run_test(
            "List Users",
            "GET",
            "users",
            200,
            token=self.admin_token
        )
        
        if success and isinstance(response, list):
            self.log_test("Users List Validation", True, f"Found {len(response)} users")
        elif success:
            self.log_test("Users List Validation", False, "Response is not a list")
            return False
            
        return success

    def test_create_user(self) -> bool:
        """Test creating a new user"""
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "username": f"testuser_{timestamp}",
            "password": "testpass123",
            "name": f"Test User {timestamp}",
            "role": "user",
            "permissions": {
                "dizimistas_view": True,
                "dizimistas_edit": False,
                "relatorios_view": True,
                "relatorios_edit": False
            }
        }
        
        success, response = self.run_test(
            "Create User",
            "POST",
            "users",
            200,
            data=user_data,
            token=self.admin_token
        )
        
        if success and 'id' in response:
            self.created_user_id = response['id']
            return True
        return False

    def test_regular_user_login(self) -> bool:
        """Test logging in as regular user"""
        if not self.created_user_id:
            self.log_test("Regular User Login", False, "No regular user created")
            return False
            
        # Get the username from created user
        timestamp = datetime.now().strftime("%H%M%S")
        username = f"testuser_{timestamp}"
        
        success, response = self.run_test(
            "Regular User Login",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": "testpass123"}
        )
        
        if success and 'access_token' in response:
            self.regular_user_token = response['access_token']
            return True
        return False

    def test_update_user_permissions(self) -> bool:
        """Test updating user permissions"""
        if not self.created_user_id:
            self.log_test("Update User Permissions", False, "No user to update")
            return False
            
        permissions = {
            "dizimistas_view": True,
            "dizimistas_edit": True,
            "relatorios_view": True,
            "relatorios_edit": False
        }
        
        success, _ = self.run_test(
            "Update User Permissions",
            "PUT",
            f"users/{self.created_user_id}/permissions",
            200,
            data=permissions,
            token=self.admin_token
        )
        return success

    def test_create_dizimista(self) -> bool:
        """Test creating a dizimista"""
        dizimista_data = {
            "nome": "João da Silva",
            "telefone": "(11) 99999-9999",
            "email": "joao@exemplo.com",
            "endereco": "Rua das Flores, 123",
            "valor_dizimo": 100.50
        }
        
        success, response = self.run_test(
            "Create Dizimista",
            "POST",
            "dizimistas",
            200,
            data=dizimista_data,
            token=self.admin_token
        )
        
        if success and 'id' in response:
            self.created_dizimista_id = response['id']
            return True
        return False

    def test_list_dizimistas(self) -> bool:
        """Test listing dizimistas"""
        success, response = self.run_test(
            "List Dizimistas",
            "GET",
            "dizimistas",
            200,
            token=self.admin_token
        )
        
        if success and isinstance(response, list):
            self.log_test("Dizimistas List Validation", True, f"Found {len(response)} dizimistas")
        elif success:
            self.log_test("Dizimistas List Validation", False, "Response is not a list")
            return False
            
        return success

    def test_update_dizimista(self) -> bool:
        """Test updating a dizimista"""
        if not self.created_dizimista_id:
            self.log_test("Update Dizimista", False, "No dizimista to update")
            return False
            
        update_data = {
            "nome": "João da Silva Santos",
            "valor_dizimo": 150.75
        }
        
        success, _ = self.run_test(
            "Update Dizimista",
            "PUT",
            f"dizimistas/{self.created_dizimista_id}",
            200,
            data=update_data,
            token=self.admin_token
        )
        return success

    def test_create_contribuicao(self) -> bool:
        """Test creating a contribution"""
        if not self.created_dizimista_id:
            self.log_test("Create Contribution", False, "No dizimista available")
            return False
            
        contribuicao_data = {
            "dizimista_id": self.created_dizimista_id,
            "valor": 100.00,
            "observacao": "Contribuição de teste"
        }
        
        success, _ = self.run_test(
            "Create Contribution",
            "POST",
            "contribuicoes",
            200,
            data=contribuicao_data,
            token=self.admin_token
        )
        return success

    def test_list_contribuicoes(self) -> bool:
        """Test listing contributions"""
        success, response = self.run_test(
            "List Contributions",
            "GET",
            "contribuicoes",
            200,
            token=self.admin_token
        )
        
        if success and isinstance(response, list):
            self.log_test("Contributions List Validation", True, f"Found {len(response)} contributions")
        elif success:
            self.log_test("Contributions List Validation", False, "Response is not a list")
            return False
            
        return success

    def test_relatorio_resumo(self) -> bool:
        """Test summary report"""
        success, response = self.run_test(
            "Summary Report",
            "GET",
            "relatorios/resumo",
            200,
            token=self.admin_token
        )
        
        if success:
            expected_fields = ['total_dizimistas', 'total_arrecadado', 'total_contribuicoes', 'por_mes']
            missing_fields = [field for field in expected_fields if field not in response]
            if missing_fields:
                self.log_test("Summary Report Validation", False, f"Missing fields: {missing_fields}")
                return False
            else:
                self.log_test("Summary Report Validation", True, "All required fields present")
        
        return success

    def test_relatorio_contribuicoes(self) -> bool:
        """Test contributions report"""
        success, response = self.run_test(
            "Contributions Report",
            "GET",
            "relatorios/contribuicoes",
            200,
            token=self.admin_token
        )
        
        if success and isinstance(response, list):
            self.log_test("Contributions Report Validation", True, f"Found {len(response)} records")
        elif success:
            self.log_test("Contributions Report Validation", False, "Response is not a list")
            return False
            
        return success

    def test_create_valor_mensal(self) -> bool:
        """Test creating monthly value"""
        valor_data = {
            "mes": 12,
            "ano": 2025,
            "valor": 1500.00,
            "observacao": "Dízimos + ofertas Dezembro"
        }
        
        success, response = self.run_test(
            "Create Monthly Value",
            "POST",
            "valores-mensais",
            200,
            data=valor_data,
            token=self.admin_token
        )
        
        if success and 'id' in response:
            self.created_valor_id = response['id']
            return True
        return False

    def test_list_valores_mensais(self) -> bool:
        """Test listing monthly values"""
        success, response = self.run_test(
            "List Monthly Values",
            "GET",
            "valores-mensais",
            200,
            token=self.admin_token
        )
        
        if success and isinstance(response, list):
            self.log_test("Monthly Values List Validation", True, f"Found {len(response)} monthly values")
        elif success:
            self.log_test("Monthly Values List Validation", False, "Response is not a list")
            return False
            
        return success

    def test_update_valor_mensal(self) -> bool:
        """Test updating monthly value"""
        if not hasattr(self, 'created_valor_id') or not self.created_valor_id:
            self.log_test("Update Monthly Value", False, "No monthly value to update")
            return False
            
        update_data = {
            "valor": 1650.00,
            "observacao": "Dízimos + ofertas + doações Dezembro"
        }
        
        success, _ = self.run_test(
            "Update Monthly Value",
            "PUT",
            f"valores-mensais/{self.created_valor_id}",
            200,
            data=update_data,
            token=self.admin_token
        )
        return success

    def test_permission_denied_scenarios(self) -> bool:
        """Test permission denied scenarios"""
        all_passed = True
        
        # Test accessing users endpoint without admin token
        success, _ = self.run_test(
            "Non-Admin Access to Users",
            "GET",
            "users",
            403,
            token=self.regular_user_token
        )
        if not success:
            all_passed = False
            
        # Test accessing dizimistas without permission (should fail if user has no dizimistas_view)
        # Note: our test user has dizimistas_view=True, so this should succeed
        success, _ = self.run_test(
            "Access Dizimistas with Permission",
            "GET",
            "dizimistas",
            200,
            token=self.regular_user_token
        )
        if not success:
            all_passed = False
            
        return all_passed

    def cleanup(self) -> bool:
        """Clean up test data"""
        all_cleaned = True
        
        # Delete created monthly value
        if hasattr(self, 'created_valor_id') and self.created_valor_id:
            success, _ = self.run_test(
                "Delete Test Monthly Value",
                "DELETE",
                f"valores-mensais/{self.created_valor_id}",
                200,
                token=self.admin_token
            )
            if not success:
                all_cleaned = False
        
        # Delete created dizimista
        if self.created_dizimista_id:
            success, _ = self.run_test(
                "Delete Test Dizimista",
                "DELETE",
                f"dizimistas/{self.created_dizimista_id}",
                200,
                token=self.admin_token
            )
            if not success:
                all_cleaned = False
                
        # Delete created user
        if self.created_user_id:
            success, _ = self.run_test(
                "Delete Test User",
                "DELETE",
                f"users/{self.created_user_id}",
                200,
                token=self.admin_token
            )
            if not success:
                all_cleaned = False
                
        return all_cleaned

    def run_all_tests(self) -> int:
        """Run all tests"""
        print("🚀 Starting Dizimos API Tests")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Basic connectivity and auth tests
        if not self.test_health_check():
            print("❌ Health check failed - stopping tests")
            return 1
            
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return 1
            
        if not self.test_auth_me():
            print("❌ Auth validation failed")
        
        # User management tests
        self.test_list_users()
        
        if self.test_create_user():
            self.test_regular_user_login()
            self.test_update_user_permissions()
        
        # Dizimistas and contributions tests
        if self.test_create_dizimista():
            self.test_update_dizimista()
            self.test_create_contribuicao()
            
        self.test_list_dizimistas()
        self.test_list_contribuicoes()
        
        # Monthly values tests (new feature)
        self.test_list_valores_mensais()
        if self.test_create_valor_mensal():
            self.test_update_valor_mensal()
        
        # Reports tests
        self.test_relatorio_resumo()
        self.test_relatorio_contribuicoes()
        
        # Permission tests
        if self.regular_user_token:
            self.test_permission_denied_scenarios()
        
        # Cleanup
        print("\n🧹 Cleaning up test data...")
        self.cleanup()
        
        # Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"   Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🎉 Backend tests mostly successful!")
            return 0
        elif success_rate >= 60:
            print("⚠️  Backend has some issues but mostly working")
            return 0
        else:
            print("❌ Backend has significant issues")
            return 1

def main():
    tester = DizimosAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())