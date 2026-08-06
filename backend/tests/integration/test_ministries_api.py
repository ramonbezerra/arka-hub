import pytest

from tests.conftest import auth_headers, create_ministry

pytestmark = pytest.mark.integration


class TestMinistriesApiAuth:
    def test_list_requires_jwt(self, client):
        response = client.get('/api/ministries/')
        assert response.status_code == 401


class TestMinistriesApiAdmin:
    def test_create_ministry(self, client, admin_user):
        response = client.post(
            '/api/ministries/',
            json={'name': 'Louvor', 'description': 'Worship'},
            headers=auth_headers(admin_user),
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data['ministry']['name'] == 'Louvor'

    def test_create_ministry_forbidden_for_member(self, client, member_user):
        response = client.post(
            '/api/ministries/',
            json={'name': 'Kids'},
            headers=auth_headers(member_user),
        )
        assert response.status_code == 403

    def test_list_all_for_admin(self, client, admin_user, ministry, other_ministry):
        response = client.get(
            '/api/ministries/',
            headers=auth_headers(admin_user),
        )
        assert response.status_code == 200
        names = [m['name'] for m in response.get_json()['ministries']]
        assert ministry.name in names
        assert other_ministry.name in names

    def test_add_and_remove_member(self, client, admin_user, ministry, member_user):
        add_response = client.post(
            f'/api/ministries/{ministry.id}/members',
            json={'username': member_user.username, 'role': 'leader'},
            headers=auth_headers(admin_user),
        )
        assert add_response.status_code == 201
        assert add_response.get_json()['member']['role'] == 'leader'

        list_response = client.get(
            f'/api/ministries/{ministry.id}/members',
            headers=auth_headers(admin_user),
        )
        assert list_response.status_code == 200
        usernames = [m['username'] for m in list_response.get_json()['members']]
        assert member_user.username in usernames

        delete_response = client.delete(
            f'/api/ministries/{ministry.id}/members/{member_user.id}',
            headers=auth_headers(admin_user),
        )
        assert delete_response.status_code == 200

    def test_patch_ministry(self, client, admin_user, ministry):
        response = client.patch(
            f'/api/ministries/{ministry.id}',
            json={'description': 'New description'},
            headers=auth_headers(admin_user),
        )
        assert response.status_code == 200
        assert response.get_json()['ministry']['description'] == 'New description'


class TestMinistriesApiAccess:
    def test_leader_lists_own_ministries(self, client, ministry_leader_user, ministry):
        response = client.get(
            '/api/ministries/me',
            headers=auth_headers(ministry_leader_user),
        )
        assert response.status_code == 200
        names = [m['name'] for m in response.get_json()['ministries']]
        assert ministry.name in names

    def test_member_cannot_list_inactive_without_admin(
        self, client, ministry_leader_user
    ):
        create_ministry('Hidden', is_active=False)
        response = client.get(
            '/api/ministries/?show_inactive=true',
            headers=auth_headers(ministry_leader_user),
        )
        assert response.status_code == 403

    def test_volunteer_can_get_ministry(self, client, ministry_volunteer_user, ministry):
        response = client.get(
            f'/api/ministries/{ministry.id}',
            headers=auth_headers(ministry_volunteer_user),
        )
        assert response.status_code == 200
        assert response.get_json()['ministry']['id'] == ministry.id

    def test_outsider_forbidden(self, client, member_user, ministry):
        response = client.get(
            f'/api/ministries/{ministry.id}',
            headers=auth_headers(member_user),
        )
        assert response.status_code == 403

    def test_volunteer_cannot_add_members(self, client, ministry_volunteer_user, ministry, member_user):
        response = client.post(
            f'/api/ministries/{ministry.id}/members',
            json={'username': member_user.username},
            headers=auth_headers(ministry_volunteer_user),
        )
        assert response.status_code == 403
