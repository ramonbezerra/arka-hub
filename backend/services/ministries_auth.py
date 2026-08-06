from models import MinistryMembership

MEMBERSHIP_ROLE_LEADER = 'leader'
MEMBERSHIP_ROLE_VOLUNTEER = 'volunteer'
VALID_MEMBERSHIP_ROLES = (MEMBERSHIP_ROLE_LEADER, MEMBERSHIP_ROLE_VOLUNTEER)

def get_membership(user_id, ministry_id):
    return MinistryMembership.query.filter_by(
        user_id=user_id,
        ministry_id=ministry_id,
    ).first()

def user_belongs_to_ministry(user_id, ministry_id):
    return get_membership(user_id, ministry_id) is not None

def user_leads_ministry(user_id, ministry_id):
    membership = get_membership(user_id, ministry_id)
    return membership is not None and membership.role == MEMBERSHIP_ROLE_LEADER

def user_can_access_ministry(user_id, ministry_id, *, is_admin=False):
    if is_admin:
        return True
    return user_belongs_to_ministry(user_id, ministry_id)

def user_can_manage_ministry(user_id, ministry_id, *, is_admin=False):
    if is_admin:
        return True
    return user_leads_ministry(user_id, ministry_id)
