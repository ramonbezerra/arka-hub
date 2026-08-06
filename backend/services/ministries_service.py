from models import Ministry, MinistryMembership, User, db
from services.ministries_auth import (
    MEMBERSHIP_ROLE_LEADER,
    MEMBERSHIP_ROLE_VOLUNTEER,
    VALID_MEMBERSHIP_ROLES,
    user_belongs_to_ministry,
)

def _serialize_membership(membership):
    user = membership.user
    return {
        'userId': membership.user_id,
        'username': user.username,
        'fullName': user.full_name,
        'email': user.email,
        'role': membership.role,
        'joinedAt': membership.joined_at.isoformat() if membership.joined_at else None,
    }

def _serialize_ministry(ministry, *, include_members=False):
    data = {
        'id': ministry.id,
        'name': ministry.name,
        'description': ministry.description or '',
        'isActive': ministry.is_active,
        'createdAt': ministry.created_at.isoformat() if ministry.created_at else None,
        'updatedAt': ministry.updated_at.isoformat() if ministry.updated_at else None,
    }
    if include_members:
        data['members'] = [
            _serialize_membership(m) for m in ministry.memberships
        ]
    return data

def list_ministries(*, user_id=None, is_admin=False, show_inactive=False):
    query = Ministry.query.order_by(Ministry.name)
    if not show_inactive:
        query = query.filter(Ministry.is_active.is_(True))

    if not is_admin:
        if user_id is None:
            return {'ministries': []}
        query = query.join(MinistryMembership).filter(
            MinistryMembership.user_id == user_id
        )

    ministries = query.all()
    return {'ministries': [_serialize_ministry(m) for m in ministries]}

def create_ministry(name, description=''):
    name = (name or '').strip()
    if not name:
        return {'error': 'name is required', 'code': 400}

    if Ministry.query.filter_by(name=name).first():
        return {'error': 'Ministry with that name already exists', 'code': 409}

    ministry = Ministry(name=name, description=(description or '').strip())
    db.session.add(ministry)
    db.session.commit()
    return {'ministry': _serialize_ministry(ministry)}

def get_ministry(ministry_id, *, include_members=False):
    ministry = Ministry.query.get(ministry_id)
    if not ministry:
        return {'error': 'Ministry not found', 'code': 404}
    return {'ministry': _serialize_ministry(ministry, include_members=include_members)}

def update_ministry(ministry_id, data):
    ministry = Ministry.query.get(ministry_id)
    if not ministry:
        return {'error': 'Ministry not found', 'code': 404}

    if 'name' in data and data['name'] is not None:
        name = data['name'].strip()
        if not name:
            return {'error': 'name cannot be empty', 'code': 400}
        existing = Ministry.query.filter(
            Ministry.name == name,
            Ministry.id != ministry_id,
        ).first()
        if existing:
            return {'error': 'Ministry with that name already exists', 'code': 409}
        ministry.name = name

    if 'description' in data and data['description'] is not None:
        ministry.description = data['description'].strip()

    if 'isActive' in data and data['isActive'] is not None:
        ministry.is_active = bool(data['isActive'])

    db.session.commit()
    return {'ministry': _serialize_ministry(ministry)}

def list_ministry_members(ministry_id):
    ministry = Ministry.query.get(ministry_id)
    if not ministry:
        return {'error': 'Ministry not found', 'code': 404}
    return {
        'members': [_serialize_membership(m) for m in ministry.memberships],
    }

def add_ministry_member(ministry_id, username, role=MEMBERSHIP_ROLE_VOLUNTEER):
    ministry = Ministry.query.get(ministry_id)
    if not ministry:
        return {'error': 'Ministry not found', 'code': 404}

    if role not in VALID_MEMBERSHIP_ROLES:
        return {
            'error': f'role must be one of: {", ".join(VALID_MEMBERSHIP_ROLES)}',
            'code': 400,
        }

    username = (username or '').strip()
    if not username:
        return {'error': 'username is required', 'code': 400}

    user = User.query.filter_by(username=username).first()
    if not user:
        return {'error': 'User not found', 'code': 404}
    if not user.is_active:
        return {'error': 'User is inactive', 'code': 400}

    if user_belongs_to_ministry(user.id, ministry_id):
        return {'error': 'User is already a member of this ministry', 'code': 409}

    membership = MinistryMembership(
        ministry_id=ministry_id,
        user_id=user.id,
        role=role,
    )
    db.session.add(membership)
    db.session.commit()
    return {'member': _serialize_membership(membership)}

def remove_ministry_member(ministry_id, user_id):
    ministry = Ministry.query.get(ministry_id)
    if not ministry:
        return {'error': 'Ministry not found', 'code': 404}

    membership = MinistryMembership.query.filter_by(
        ministry_id=ministry_id,
        user_id=user_id,
    ).first()
    if not membership:
        return {'error': 'Membership not found', 'code': 404}

    db.session.delete(membership)
    db.session.commit()
    return {'message': 'Member removed from ministry'}
