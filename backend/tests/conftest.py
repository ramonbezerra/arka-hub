from datetime import date, datetime

import bcrypt
import pytest
from flask_jwt_extended import create_access_token

from app import create_app
from models import (
    Member,
    Ministry,
    MinistryMembership,
    ScheduleSlot,
    ServiceSchedule,
    SlotAssignment,
    User,
    db,
)


@pytest.fixture
def app():
    application = create_app('testing')
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def _hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())


def create_user(
    username,
    password='password123',
    *,
    role='user',
    email=None,
    is_active=True,
    as_member=False,
    **kwargs,
):
    email = email or f'{username}@example.com'
    hashed = _hash_password(password)
    model = Member if as_member or role == 'member' else User
    user = model(
        username=username,
        password=hashed,
        email=email,
        role=role,
        full_name=kwargs.pop('full_name', 'Test User'),
        phone=kwargs.pop('phone', '11999999999'),
        date_of_birth=kwargs.pop('date_of_birth', date(1990, 1, 1)),
        gender=kwargs.pop('gender', 'other'),
        is_active=is_active,
        **kwargs,
    )
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def admin_user(app):
    return create_user('admin', 'adminpass', role='admin', email='admin@example.com')


@pytest.fixture
def member_user(app):
    return create_user(
        'member1',
        'memberpass',
        role='member',
        as_member=True,
        email='member1@example.com',
    )


@pytest.fixture
def inactive_user(app):
    return create_user(
        'inactive1',
        'inactivepass',
        role='member',
        as_member=True,
        is_active=False,
        email='inactive1@example.com',
    )


def auth_headers(user):
    token = create_access_token(
        identity=user.username,
        additional_claims={'role': user.role, 'is_active': user.is_active},
    )
    return {'Authorization': f'Bearer {token}'}


def create_ministry(name='Louvor', description='Ministry of worship', *, is_active=True):
    ministry = Ministry(name=name, description=description, is_active=is_active)
    db.session.add(ministry)
    db.session.commit()
    return ministry


def add_ministry_membership(ministry, user, role='volunteer'):
    membership = MinistryMembership(
        ministry_id=ministry.id,
        user_id=user.id,
        role=role,
    )
    db.session.add(membership)
    db.session.commit()
    return membership


@pytest.fixture
def ministry(app):
    return create_ministry()


@pytest.fixture
def other_ministry(app):
    return create_ministry(name='Mídia', description='Media ministry')


@pytest.fixture
def ministry_leader_user(app, ministry):
    user = create_user(
        'leader1',
        'leaderpass',
        role='member',
        as_member=True,
        email='leader1@example.com',
        full_name='Ministry Leader',
    )
    add_ministry_membership(ministry, user, role='leader')
    return user


@pytest.fixture
def ministry_volunteer_user(app, ministry):
    user = create_user(
        'volunteer1',
        'volpass',
        role='member',
        as_member=True,
        email='volunteer1@example.com',
        full_name='Ministry Volunteer',
    )
    add_ministry_membership(ministry, user, role='volunteer')
    return user


def create_schedule(
    ministry,
    created_by,
    *,
    title='June Schedule',
    start_date=None,
    end_date=None,
    status='draft',
):
    start = start_date or date(2026, 6, 1)
    end = end_date or date(2026, 6, 30)
    schedule = ServiceSchedule(
        ministry_id=ministry.id,
        title=title,
        start_date=start,
        end_date=end,
        status=status,
        created_by_id=created_by.id,
    )
    db.session.add(schedule)
    db.session.commit()
    return schedule


def create_slot(
    schedule,
    *,
    title='Sunday Service',
    role_label='Projection',
    starts_at=None,
    ends_at=None,
):
    starts = starts_at or datetime(2026, 6, 7, 9, 0, 0)
    ends = ends_at or datetime(2026, 6, 7, 12, 0, 0)
    slot = ScheduleSlot(
        schedule_id=schedule.id,
        title=title,
        role_label=role_label,
        starts_at=starts,
        ends_at=ends,
    )
    db.session.add(slot)
    db.session.commit()
    return slot


def assign_volunteer(slot, user, *, status='assigned'):
    assignment = SlotAssignment(
        slot_id=slot.id,
        user_id=user.id,
        status=status,
        assigned_at=datetime.utcnow(),
    )
    db.session.add(assignment)
    db.session.commit()
    return assignment


@pytest.fixture
def draft_schedule(app, ministry, ministry_leader_user):
    return create_schedule(ministry, ministry_leader_user)


@pytest.fixture
def published_schedule(app, ministry, ministry_leader_user, ministry_volunteer_user):
    schedule = create_schedule(ministry, ministry_leader_user, status='draft')
    slot = create_slot(schedule)
    assign_volunteer(slot, ministry_volunteer_user)
    schedule.status = 'published'
    db.session.commit()
    return schedule
