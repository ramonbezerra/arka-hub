import pytest

from tests.conftest import auth_headers, create_slot

pytestmark = pytest.mark.integration


class TestSchedulesApiFlow:
    def test_leader_creates_publishes_and_volunteer_confirms(
        self,
        client,
        ministry,
        ministry_leader_user,
        ministry_volunteer_user,
    ):
        create_response = client.post(
            f'/api/ministries/{ministry.id}/schedules',
            json={
                'title': 'June Worship',
                'startDate': '2026-06-01',
                'endDate': '2026-06-30',
            },
            headers=auth_headers(ministry_leader_user),
        )
        assert create_response.status_code == 201
        schedule_id = create_response.get_json()['schedule']['id']

        slot_response = client.post(
            f'/api/schedules/{schedule_id}/slots',
            json={
                'title': 'Sunday Service',
                'roleLabel': 'Projection',
                'startsAt': '2026-06-07T09:00:00',
                'endsAt': '2026-06-07T12:00:00',
            },
            headers=auth_headers(ministry_leader_user),
        )
        assert slot_response.status_code == 201
        slot_id = slot_response.get_json()['slot']['id']

        assign_response = client.post(
            f'/api/schedules/slots/{slot_id}/assignments',
            json={'username': ministry_volunteer_user.username},
            headers=auth_headers(ministry_leader_user),
        )
        assert assign_response.status_code == 201
        assignment_id = assign_response.get_json()['assignment']['id']

        publish_response = client.post(
            f'/api/schedules/{schedule_id}/publish',
            headers=auth_headers(ministry_leader_user),
        )
        assert publish_response.status_code == 200
        assert publish_response.get_json()['schedule']['status'] == 'published'

        volunteer_list = client.get(
            '/api/schedules/assignments/me',
            headers=auth_headers(ministry_volunteer_user),
        )
        assert volunteer_list.status_code == 200
        assert len(volunteer_list.get_json()['assignments']) == 1

        confirm_response = client.patch(
            f'/api/schedules/assignments/{assignment_id}',
            json={'status': 'confirmed'},
            headers=auth_headers(ministry_volunteer_user),
        )
        assert confirm_response.status_code == 200
        assert confirm_response.get_json()['assignment']['status'] == 'confirmed'

    def test_volunteer_cannot_see_draft_schedule(
        self,
        client,
        ministry,
        ministry_leader_user,
        ministry_volunteer_user,
        draft_schedule,
    ):
        response = client.get(
            f'/api/schedules/{draft_schedule.id}',
            headers=auth_headers(ministry_volunteer_user),
        )
        assert response.status_code == 403

    def test_volunteer_can_view_published_schedule(
        self,
        client,
        ministry_volunteer_user,
        published_schedule,
    ):
        response = client.get(
            f'/api/schedules/{published_schedule.id}?include_slots=true',
            headers=auth_headers(ministry_volunteer_user),
        )
        assert response.status_code == 200
        data = response.get_json()['schedule']
        assert data['status'] == 'published'
        assert len(data['slots']) == 1

    def test_volunteer_cannot_create_schedule(
        self,
        client,
        ministry,
        ministry_volunteer_user,
    ):
        response = client.post(
            f'/api/ministries/{ministry.id}/schedules',
            json={
                'title': 'Blocked',
                'startDate': '2026-06-01',
                'endDate': '2026-06-30',
            },
            headers=auth_headers(ministry_volunteer_user),
        )
        assert response.status_code == 403

    def test_outsider_cannot_access_ministry_schedules(
        self,
        client,
        ministry,
        member_user,
    ):
        response = client.get(
            f'/api/ministries/{ministry.id}/schedules',
            headers=auth_headers(member_user),
        )
        assert response.status_code == 403

    def test_leader_can_replace_assignment_on_published_schedule(
        self,
        client,
        ministry,
        ministry_leader_user,
        ministry_volunteer_user,
        published_schedule,
    ):
        from tests.conftest import create_user, add_ministry_membership

        replacement = create_user(
            'volunteer2',
            as_member=True,
            role='member',
            email='volunteer2@example.com',
        )
        add_ministry_membership(ministry, replacement)

        slot = published_schedule.slots[0]
        delete_response = client.delete(
            f'/api/schedules/slots/{slot.id}/assignments/{ministry_volunteer_user.id}',
            headers=auth_headers(ministry_leader_user),
        )
        assert delete_response.status_code == 200

        add_response = client.post(
            f'/api/schedules/slots/{slot.id}/assignments',
            json={'username': replacement.username},
            headers=auth_headers(ministry_leader_user),
        )
        assert add_response.status_code == 201

    def test_cannot_edit_slot_on_published_schedule(
        self,
        client,
        ministry_leader_user,
        published_schedule,
    ):
        slot = published_schedule.slots[0]
        response = client.patch(
            f'/api/schedules/slots/{slot.id}',
            json={'title': 'Changed'},
            headers=auth_headers(ministry_leader_user),
        )
        assert response.status_code == 400
