import pytest

from models import Ministry, MinistryMembership
from services import ministries_service as svc
from tests.conftest import add_ministry_membership, create_ministry, create_user

pytestmark = pytest.mark.unit


class TestCreateMinistry:
    def test_create_ministry_success(self, app):
        result = svc.create_ministry('Louvor', 'Worship team')
        assert 'ministry' in result
        assert result['ministry']['name'] == 'Louvor'
        assert result['ministry']['description'] == 'Worship team'
        assert result['ministry']['isActive'] is True

    def test_create_ministry_requires_name(self, app):
        result = svc.create_ministry('  ')
        assert result['error'] == 'name is required'
        assert result['code'] == 400

    def test_create_ministry_duplicate_name(self, app):
        svc.create_ministry('Louvor')
        result = svc.create_ministry('Louvor')
        assert result['error'] == 'Ministry with that name already exists'
        assert result['code'] == 409


class TestListMinistries:
    def test_admin_sees_all_active(self, app):
        create_ministry('A')
        create_ministry('B')
        create_ministry('Inactive', is_active=False)
        result = svc.list_ministries(is_admin=True)
        names = [m['name'] for m in result['ministries']]
        assert 'A' in names
        assert 'B' in names
        assert 'Inactive' not in names

    def test_admin_show_inactive(self, app):
        create_ministry('Inactive', is_active=False)
        result = svc.list_ministries(is_admin=True, show_inactive=True)
        names = [m['name'] for m in result['ministries']]
        assert 'Inactive' in names

    def test_member_sees_only_their_ministries(self, app, ministry, other_ministry):
        user = create_user('scoped_m', as_member=True, role='member')
        add_ministry_membership(ministry, user)
        result = svc.list_ministries(user_id=user.id, is_admin=False)
        names = [m['name'] for m in result['ministries']]
        assert ministry.name in names
        assert other_ministry.name not in names


class TestMinistryMembership:
    def test_add_member_success(self, app, ministry):
        user = create_user('new_vol', as_member=True, role='member')
        result = svc.add_ministry_member(ministry.id, user.username, role='volunteer')
        assert result['member']['username'] == 'new_vol'
        assert result['member']['role'] == 'volunteer'

    def test_add_member_duplicate(self, app, ministry):
        user = create_user('dup_vol', as_member=True, role='member')
        svc.add_ministry_member(ministry.id, user.username)
        result = svc.add_ministry_member(ministry.id, user.username)
        assert result['error'] == 'User is already a member of this ministry'
        assert result['code'] == 409

    def test_add_member_invalid_role(self, app, ministry):
        user = create_user('bad_role', as_member=True, role='member')
        result = svc.add_ministry_member(ministry.id, user.username, role='invalid')
        assert result['code'] == 400

    def test_add_inactive_user(self, app, ministry):
        user = create_user(
            'inactive_vol',
            as_member=True,
            role='member',
            is_active=False,
        )
        result = svc.add_ministry_member(ministry.id, user.username)
        assert result['error'] == 'User is inactive'
        assert result['code'] == 400

    def test_remove_member(self, app, ministry):
        user = create_user('remove_me', as_member=True, role='member')
        svc.add_ministry_member(ministry.id, user.username)
        result = svc.remove_ministry_member(ministry.id, user.id)
        assert result['message'] == 'Member removed from ministry'
        assert MinistryMembership.query.filter_by(
            ministry_id=ministry.id,
            user_id=user.id,
        ).first() is None


class TestUpdateMinistry:
    def test_update_ministry(self, app, ministry):
        result = svc.update_ministry(
            ministry.id,
            {'name': 'Louvor Atualizado', 'description': 'Updated', 'isActive': False},
        )
        assert result['ministry']['name'] == 'Louvor Atualizado'
        assert result['ministry']['isActive'] is False
        refreshed = Ministry.query.get(ministry.id)
        assert refreshed.is_active is False
