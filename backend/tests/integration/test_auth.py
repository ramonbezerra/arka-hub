import pytest
from tests.conftest import auth_headers, create_user

pytestmark = pytest.mark.integration

class TestRegister:
    def test_register_member_success(self, client):
        response = client.post(
            '/api/auth/register',
            json={
                'username': 'newmember',
                'password': 'secret123',
                'email': 'newmember@example.com',
                'role': 'member',
            },
        )
        assert response.status_code == 201
        assert response.get_json()['message'] == 'User registered successfully'

    def test_register_duplicate_username(self, client, member_user):
        response = client.post(
            '/api/auth/register',
            json={
                'username': member_user.username,
                'password': 'otherpass',
                'email': 'other@example.com',
            },
        )
        assert response.status_code == 409
        assert response.get_json()['message'] == 'User already exists'

class TestLogin:
    def test_login_success(self, client, member_user):
        response = client.post(
            '/api/auth/login',
            json={'username': 'member1', 'password': 'memberpass'},
        )
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert 'refresh_token' in data

    def test_login_user_not_found(self, client):
        response = client.post(
            '/api/auth/login',
            json={'username': 'nobody', 'password': 'wrong'},
        )
        assert response.status_code == 404
        assert response.get_json()['message'] == 'User not found'

    def test_login_wrong_password(self, client, member_user):
        response = client.post(
            '/api/auth/login',
            json={'username': 'member1', 'password': 'wrongpassword'},
        )
        assert response.status_code == 401
        assert response.get_json()['message'] == 'Invalid username or password'

    def test_login_inactive_user(self, client, inactive_user):
        response = client.post(
            '/api/auth/login',
            json={'username': 'inactive1', 'password': 'inactivepass'},
        )
        assert response.status_code == 401
        assert response.get_json()['message'] == 'User is inactive'

class TestRefreshToken:
    def test_refresh_token_success(self, client, member_user):
        login_response = client.post(
            '/api/auth/login',
            json={'username': 'member1', 'password': 'memberpass'},
        )

        assert login_response.status_code == 200
        refresh_token = login_response.get_json()['refresh_token']

        response = client.post(
            '/api/auth/refresh',
            headers={'Authorization': f'Bearer {refresh_token}'},
        )

        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert data['access_token']
        assert data['access_token'] != refresh_token

class TestChangePassword:
    def test_change_password_success(self, client, member_user):
        response = client.patch(
            '/api/auth/change-password',
            json={'old_password': 'memberpass', 'new_password': 'newpass456'},
            headers=auth_headers(member_user),
        )
        assert response.status_code == 200
        assert response.get_json()['message'] == 'Password changed successfully'

        login_response = client.post(
            '/api/auth/login',
            json={'username': 'member1', 'password': 'newpass456'},
        )
        assert login_response.status_code == 200

    def test_change_password_wrong_old_password(self, client, member_user):
        response = client.patch(
            '/api/auth/change-password',
            json={'old_password': 'wrong', 'new_password': 'newpass456'},
            headers=auth_headers(member_user),
        )
        assert response.status_code == 401
        assert response.get_json()['message'] == 'Invalid old password'

    def test_change_password_requires_jwt(self, client):
        response = client.patch(
            '/api/auth/change-password',
            json={'old_password': 'a', 'new_password': 'b'},
        )
        assert response.status_code == 401
