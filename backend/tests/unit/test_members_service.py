from datetime import date

import pytest

from models import Address, Member, db
from services import members_service as svc
from tests.conftest import create_user

pytestmark = pytest.mark.unit

def _enroll(**kwargs):
    defaults = {
        'username': 'enrolled',
        'email': 'enrolled@example.com',
        'password': 'pass123',
        'fullname': 'Enrolled User',
        'phone': '11888888888',
        'gender': 'female',
        'service_preferences': ['yoga', 'pilates'],
    }
    defaults.update(kwargs)
    return svc.enroll_member(**defaults)

class TestListMembers:
    def test_empty_list(self, app):
        result = svc.list_members()
        assert result['members'] == []
        assert result['pagination']['total'] == 0

    def test_excludes_inactive_by_default(self, app):
        create_user('active_m', as_member=True, role='member', full_name='Active One')
        create_user(
            'inactive_m',
            as_member=True,
            role='member',
            is_active=False,
            full_name='Inactive One',
        )
        result = svc.list_members()
        usernames = [m['username'] for m in result['members']]
        assert 'active_m' in usernames
        assert 'inactive_m' not in usernames

    def test_show_inactive(self, app):
        create_user(
            'inactive_m2',
            as_member=True,
            role='member',
            is_active=False,
            full_name='Inactive Two',
        )
        result = svc.list_members(show_inactive=True)
        assert any(m['username'] == 'inactive_m2' for m in result['members'])

    def test_search_by_full_name(self, app):
        create_user('findme', as_member=True, role='member', full_name='Unique Name XYZ')
        create_user('other', as_member=True, role='member', full_name='Someone Else')
        result = svc.list_members(search='Unique Name')
        assert len(result['members']) == 1
        assert result['members'][0]['username'] == 'findme'

    def test_pagination_clamps_per_page(self, app):
        for i in range(3):
            create_user(f'page_user_{i}', as_member=True, role='member')
        result = svc.list_members(page=1, per_page=200)
        assert result['pagination']['per_page'] == 10

    def test_filters_none_does_not_raise(self, app):
        create_user('nofilter', as_member=True, role='member')
        result = svc.list_members(filters=None)
        assert result['pagination']['total'] >= 1

    def test_filter_by_date_of_birth(self, app):
        dob = date(1985, 6, 15)
        create_user(
            'dob_user',
            as_member=True,
            role='member',
            date_of_birth=dob,
        )
        result = svc.list_members(filters={'dateOfBirth': '1985-06-15'})
        assert len(result['members']) == 1
        assert result['members'][0]['username'] == 'dob_user'

class TestEnrollMember:
    def test_enroll_success(self, app):
        result = _enroll()
        assert 'username' in result
        assert result['username'] == 'enrolled'
        member = Member.query.filter_by(username='enrolled').first()
        assert member is not None
        assert member.service_preferences == 'yoga,pilates'

    def test_enroll_with_address(self, app):
        result = svc.enroll_member(
            username='with_addr',
            email='with_addr@example.com',
            password='pass123',
            address_data={
                'address': '123 Main St',
                'city': 'São Paulo',
                'state': 'SP',
                'country': 'BR',
                'postalCode': '01000-000',
            },
        )
        assert 'message' in result
        member = Member.query.filter_by(username='with_addr').first()
        assert len(member.addresses) == 1
        assert member.addresses[0].city == 'São Paulo'

    def test_enroll_missing_required_fields(self, app):
        result = svc.enroll_member(username='', email='', password='')
        assert result['code'] == 400

    def test_enroll_duplicate_username(self, app):
        _enroll()
        result = _enroll(username='enrolled', email='other@example.com')
        assert result['code'] == 409

class TestGetMember:
    def test_get_member_found(self, app):
        _enroll()
        result = svc.get_member('enrolled')
        assert result['member']['fullname'] == 'Enrolled User'

    def test_get_member_not_found(self, app):
        result = svc.get_member('missing')
        assert result['code'] == 404

class TestUpdateMember:
    def test_update_member(self, app):
        _enroll()
        result = svc.update_member(
            'enrolled',
            {'fullname': 'Updated Name', 'phone': '11777777777'},
        )
        assert 'message' in result
        member = Member.query.filter_by(username='enrolled').first()
        assert member.full_name == 'Updated Name'
        assert member.phone == '11777777777'

    def test_update_member_not_found(self, app):
        result = svc.update_member('ghost', {'fullname': 'X'})
        assert result['code'] == 404

class TestMemberProfile:
    def test_get_member_profile(self, app):
        _enroll()
        result = svc.get_member_profile('enrolled')
        assert result['username'] == 'enrolled'
        assert result['fullname'] == 'Enrolled User'

    def test_update_member_info(self, app):
        _enroll()
        result = svc.update_member_info(
            'enrolled',
            {'fullname': 'Profile Updated', 'gender': 'male'},
        )
        assert 'message' in result
        member = Member.query.filter_by(username='enrolled').first()
        assert member.full_name == 'Profile Updated'
        assert member.gender == 'male'

    def test_update_creates_address_when_missing(self, app):
        svc.enroll_member(
            username='no_addr',
            email='no_addr@example.com',
            password='pass123',
        )
        svc.update_member_info(
            'no_addr',
            {'address': '456 Oak Ave', 'city': 'Rio', 'state': 'RJ', 'country': 'BR', 'postalCode': '20000-000'},
        )
        member = Member.query.filter_by(username='no_addr').first()
        assert len(member.addresses) == 1
        assert member.addresses[0].address == '456 Oak Ave'
