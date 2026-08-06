from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from models import User
from services.ministries_auth import user_can_access_ministry, user_can_manage_ministry
from services.ministries_service import (
    add_ministry_member as service_add_ministry_member,
    create_ministry as service_create_ministry,
    get_ministry as service_get_ministry,
    list_ministries as service_list_ministries,
    list_ministry_members as service_list_ministry_members,
    remove_ministry_member as service_remove_ministry_member,
    update_ministry as service_update_ministry,
)
from services.schedules_service import (
    create_schedule as service_create_schedule,
    list_ministry_schedules as service_list_ministry_schedules,
)

ministries_blueprint = Blueprint('ministries', __name__)

def _current_user():
    username = get_jwt_identity()
    return User.query.filter_by(username=username).first()

def _is_admin(claims):
    return claims.get('role') == 'admin'

@ministries_blueprint.route('/', methods=['GET'])
@jwt_required()
def list_ministries():
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    show_inactive = request.args.get('show_inactive', 'false').lower() == 'true'
    if show_inactive and not _is_admin(claims):
        return jsonify(message='Admins only'), 403

    result = service_list_ministries(
        user_id=user.id,
        is_admin=_is_admin(claims),
        show_inactive=show_inactive,
    )
    return jsonify(**result), 200

@ministries_blueprint.route('/me', methods=['GET'])
@jwt_required()
def list_my_ministries():
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    result = service_list_ministries(user_id=user.id, is_admin=False)
    return jsonify(**result), 200

@ministries_blueprint.route('/', methods=['POST'])
@jwt_required()
def create_ministry():
    claims = get_jwt()
    if not _is_admin(claims):
        return jsonify(message='Admins only'), 403

    data = request.json or {}
    result = service_create_ministry(
        name=data.get('name'),
        description=data.get('description', ''),
    )
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 400)
    return jsonify(**result), 201

@ministries_blueprint.route('/<int:ministry_id>', methods=['GET'])
@jwt_required()
def get_ministry(ministry_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    if not user_can_access_ministry(
        user.id, ministry_id, is_admin=_is_admin(claims)
    ):
        return jsonify(message='Forbidden'), 403

    include_members = request.args.get('include_members', 'false').lower() == 'true'
    result = service_get_ministry(ministry_id, include_members=include_members)
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 404)
    return jsonify(**result), 200

@ministries_blueprint.route('/<int:ministry_id>', methods=['PATCH'])
@jwt_required()
def update_ministry(ministry_id):
    claims = get_jwt()
    if not _is_admin(claims):
        return jsonify(message='Admins only'), 403

    result = service_update_ministry(ministry_id, request.json or {})
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 404)
    return jsonify(**result), 200

@ministries_blueprint.route('/<int:ministry_id>/members', methods=['GET'])
@jwt_required()
def list_ministry_members(ministry_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    if not user_can_access_ministry(
        user.id, ministry_id, is_admin=_is_admin(claims)
    ):
        return jsonify(message='Forbidden'), 403

    result = service_list_ministry_members(ministry_id)
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 404)
    return jsonify(**result), 200

@ministries_blueprint.route('/<int:ministry_id>/members', methods=['POST'])
@jwt_required()
def add_ministry_member(ministry_id):
    claims = get_jwt()
    if not _is_admin(claims):
        return jsonify(message='Admins only'), 403

    data = request.json or {}
    result = service_add_ministry_member(
        ministry_id,
        username=data.get('username'),
        role=data.get('role', 'volunteer'),
    )
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 400)
    return jsonify(**result), 201

@ministries_blueprint.route('/<int:ministry_id>/members/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_ministry_member(ministry_id, user_id):
    claims = get_jwt()
    if not _is_admin(claims):
        return jsonify(message='Admins only'), 403

    result = service_remove_ministry_member(ministry_id, user_id)
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 404)
    return jsonify(**result), 200


@ministries_blueprint.route('/<int:ministry_id>/schedules', methods=['GET'])
@jwt_required()
def list_ministry_schedules(ministry_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    result = service_list_ministry_schedules(
        ministry_id,
        user_id=user.id,
        is_admin=_is_admin(claims),
        status=request.args.get('status'),
    )
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 404)
    return jsonify(**result), 200


@ministries_blueprint.route('/<int:ministry_id>/schedules', methods=['POST'])
@jwt_required()
def create_ministry_schedule(ministry_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    if not user_can_manage_ministry(
        user.id, ministry_id, is_admin=_is_admin(claims)
    ):
        return jsonify(message='Forbidden'), 403

    data = request.json or {}
    result = service_create_schedule(
        ministry_id,
        user.id,
        title=data.get('title'),
        start_date=data.get('startDate'),
        end_date=data.get('endDate'),
    )
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 400)
    return jsonify(**result), 201
