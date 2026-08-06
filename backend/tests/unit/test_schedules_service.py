from datetime import date, datetime

import pytest

from models import ScheduleSlot, SlotAssignment
from services import schedules_service as svc
from tests.conftest import (
    add_ministry_membership,
    assign_volunteer,
    create_ministry,
    create_schedule,
    create_slot,
    create_user,
)

pytestmark = pytest.mark.unit


class TestCreateSchedule:
    def test_create_schedule_success(self, app, ministry, ministry_leader_user):
        result = svc.create_schedule(
            ministry.id,
            ministry_leader_user.id,
            'June Worship',
            '2026-06-01',
            '2026-06-30',
        )
        assert result['schedule']['title'] == 'June Worship'
        assert result['schedule']['status'] == 'draft'

    def test_create_schedule_invalid_dates(self, app, ministry, ministry_leader_user):
        result = svc.create_schedule(
            ministry.id,
            ministry_leader_user.id,
            'Bad Dates',
            '2026-06-30',
            '2026-06-01',
        )
        assert result['code'] == 400


class TestScheduleSlots:
    def test_create_slot_success(self, app, draft_schedule):
        result = svc.create_slot(
            draft_schedule.id,
            {
                'title': 'Sunday',
                'roleLabel': 'Sound',
                'startsAt': '2026-06-07T09:00:00',
                'endsAt': '2026-06-07T12:00:00',
            },
        )
        assert result['slot']['title'] == 'Sunday'

    def test_create_slot_invalid_times(self, app, draft_schedule):
        result = svc.create_slot(
            draft_schedule.id,
            {
                'title': 'Sunday',
                'startsAt': '2026-06-07T12:00:00',
                'endsAt': '2026-06-07T09:00:00',
            },
        )
        assert result['code'] == 400

    def test_create_slot_outside_schedule_period(self, app, draft_schedule):
        result = svc.create_slot(
            draft_schedule.id,
            {
                'title': 'Outside',
                'startsAt': '2026-07-01T09:00:00',
                'endsAt': '2026-07-01T12:00:00',
            },
        )
        assert result['code'] == 400

    def test_cannot_add_slot_to_published_schedule(self, app, published_schedule):
        result = svc.create_slot(
            published_schedule.id,
            {
                'title': 'Extra',
                'startsAt': '2026-06-14T09:00:00',
                'endsAt': '2026-06-14T12:00:00',
            },
        )
        assert result['code'] == 400


class TestAssignments:
    def test_assign_volunteer_success(self, app, ministry, draft_schedule, ministry_volunteer_user):
        slot = create_slot(draft_schedule)
        result = svc.add_slot_assignment(slot.id, ministry_volunteer_user.username)
        assert result['assignment']['username'] == ministry_volunteer_user.username

    def test_assign_non_member_fails(self, app, draft_schedule, member_user):
        slot = create_slot(draft_schedule)
        result = svc.add_slot_assignment(slot.id, member_user.username)
        assert result['error'] == 'User is not a member of this ministry'
        assert result['code'] == 400

    def test_assign_inactive_user_fails(self, app, ministry, draft_schedule, inactive_user):
        add_ministry_membership(ministry, inactive_user)
        slot = create_slot(draft_schedule)
        result = svc.add_slot_assignment(slot.id, inactive_user.username)
        assert result['error'] == 'User is inactive'

    def test_assignment_overlap(self, app, ministry, draft_schedule, ministry_volunteer_user):
        slot1 = create_slot(draft_schedule)
        slot2 = create_slot(
            draft_schedule,
            title='Second Service',
            starts_at=datetime(2026, 6, 7, 10, 0, 0),
            ends_at=datetime(2026, 6, 7, 11, 0, 0),
        )
        svc.add_slot_assignment(slot1.id, ministry_volunteer_user.username)
        result = svc.add_slot_assignment(slot2.id, ministry_volunteer_user.username)
        assert result['code'] == 409


class TestPublishSchedule:
    def test_publish_requires_slots(self, app, draft_schedule):
        result = svc.publish_schedule(draft_schedule.id)
        assert result['error'] == 'Cannot publish a schedule without slots'
        assert result['code'] == 400

    def test_publish_success(self, app, draft_schedule):
        create_slot(draft_schedule)
        result = svc.publish_schedule(draft_schedule.id)
        assert result['schedule']['status'] == 'published'
        assert len(result['schedule']['slots']) == 1


class TestVolunteerAssignmentStatus:
    def test_confirm_assignment(self, app, published_schedule, ministry_volunteer_user):
        assignment = published_schedule.slots[0].assignments[0]
        result = svc.update_assignment_status(
            assignment.id,
            ministry_volunteer_user.id,
            'confirmed',
        )
        assert result['assignment']['status'] == 'confirmed'

    def test_cannot_confirm_other_users_assignment(
        self, app, published_schedule, member_user
    ):
        assignment = published_schedule.slots[0].assignments[0]
        result = svc.update_assignment_status(
            assignment.id,
            member_user.id,
            'confirmed',
        )
        assert result['code'] == 403


class TestListSchedules:
    def test_volunteer_sees_only_published(self, app, ministry, ministry_volunteer_user, ministry_leader_user):
        create_schedule(ministry, ministry_leader_user, title='Draft One', status='draft')
        create_schedule(ministry, ministry_leader_user, title='Published One', status='published')
        result = svc.list_ministry_schedules(
            ministry.id,
            user_id=ministry_volunteer_user.id,
            is_admin=False,
        )
        titles = [s['title'] for s in result['schedules']]
        assert 'Published One' in titles
        assert 'Draft One' not in titles

    def test_leader_sees_drafts(self, app, ministry, ministry_leader_user):
        create_schedule(ministry, ministry_leader_user, title='Draft One', status='draft')
        result = svc.list_ministry_schedules(
            ministry.id,
            user_id=ministry_leader_user.id,
            is_admin=False,
        )
        titles = [s['title'] for s in result['schedules']]
        assert 'Draft One' in titles
