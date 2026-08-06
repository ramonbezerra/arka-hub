import pytest

from services.ministries_auth import (
    user_belongs_to_ministry,
    user_can_access_ministry,
    user_leads_ministry,
)
from tests.conftest import add_ministry_membership, create_ministry, create_user

pytestmark = pytest.mark.unit


class TestMinistriesAuth:
    def test_user_belongs_to_ministry(self, app, ministry):
        user = create_user('belongs_m', as_member=True, role='member')
        assert user_belongs_to_ministry(user.id, ministry.id) is False
        add_ministry_membership(ministry, user)
        assert user_belongs_to_ministry(user.id, ministry.id) is True

    def test_user_leads_ministry(self, app, ministry):
        leader = create_user('lead_m', as_member=True, role='member')
        volunteer = create_user('vol_m', as_member=True, role='member')
        add_ministry_membership(ministry, leader, role='leader')
        add_ministry_membership(ministry, volunteer, role='volunteer')
        assert user_leads_ministry(leader.id, ministry.id) is True
        assert user_leads_ministry(volunteer.id, ministry.id) is False

    def test_user_can_access_ministry_admin(self, app, ministry):
        assert user_can_access_ministry(999, ministry.id, is_admin=True) is True
