from datetime import date

import bcrypt
import pytest
from flask_jwt_extended import create_access_token

from app import create_app
from models import Member, User, db


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
