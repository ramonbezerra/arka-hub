from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt, get_jwt_identity, jwt_required

from models import User
from services.ministries_auth import user_can_manage_ministry
from services.schedules_service import (
    add_slot_assignment as service_add_slot_assignment,
    archive_schedule as service_archive_schedule,
    check_schedule_access,
    check_slot_access,
    create_slot as service_create_slot,
    delete_slot as service_delete_slot,
    get_schedule as service_get_schedule,
    list_my_assignments as service_list_my_assignments,
    publish_schedule as service_publish_schedule,
    remove_slot_assignment as service_remove_slot_assignment,
    update_assignment_status as service_update_assignment_status,
    update_schedule as service_update_schedule,
    update_slot as service_update_slot,
)

schedules_blueprint = Blueprint('schedules', __name__)

def _current_user():
    username = get_jwt_identity()
    return User.query.filter_by(username=username).first()


def _is_admin(claims):
    return claims.get('role') == 'admin'


def _error_response(result):
    return jsonify(message=result['error']), result.get('code', 400)


@schedules_blueprint.route('/assignments/me', methods=['GET'])
@jwt_required()
def list_my_assignments():
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    status = request.args.get('status')
    result = service_list_my_assignments(user.id, status=status)
    return jsonify(**result), 200


@schedules_blueprint.route('/<int:schedule_id>', methods=['GET'])
@jwt_required()
def get_schedule(schedule_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    schedule, error = check_schedule_access(
        schedule_id, user.id, is_admin=_is_admin(claims)
    )
    if error:
        return _error_response(error)

    include_slots = request.args.get('include_slots', 'false').lower() == 'true'
    result = service_get_schedule(schedule_id, include_slots=include_slots)
    return jsonify(**result), 200


@schedules_blueprint.route('/<int:schedule_id>', methods=['PATCH'])
@jwt_required()
def update_schedule(schedule_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    schedule, error = check_schedule_access(
        schedule_id, user.id, is_admin=_is_admin(claims)
    )
    if error:
        return _error_response(error)

    if not user_can_manage_ministry(
        user.id, schedule.ministry_id, is_admin=_is_admin(claims)
    ):
        return jsonify(message='Forbidden'), 403

    result = service_update_schedule(schedule_id, request.json or {})
    if result.get('error'):
        return _error_response(result)
    return jsonify(**result), 200


@schedules_blueprint.route('/<int:schedule_id>/publish', methods=['POST'])
@jwt_required()
def publish_schedule(schedule_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    schedule, error = check_schedule_access(
        schedule_id, user.id, is_admin=_is_admin(claims)
    )
    if error:
        return _error_response(error)

    if not user_can_manage_ministry(
        user.id, schedule.ministry_id, is_admin=_is_admin(claims)
    ):
        return jsonify(message='Forbidden'), 403

    result = service_publish_schedule(schedule_id)
    if result.get('error'):
        return _error_response(result)
    return jsonify(**result), 200


@schedules_blueprint.route('/<int:schedule_id>/archive', methods=['POST'])
@jwt_required()
def archive_schedule(schedule_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    schedule, error = check_schedule_access(
        schedule_id, user.id, is_admin=_is_admin(claims)
    )
    if error:
        return _error_response(error)

    if not user_can_manage_ministry(
        user.id, schedule.ministry_id, is_admin=_is_admin(claims)
    ):
        return jsonify(message='Forbidden'), 403

    result = service_archive_schedule(schedule_id)
    if result.get('error'):
        return _error_response(result)
    return jsonify(**result), 200


@schedules_blueprint.route('/<int:schedule_id>/slots', methods=['POST'])
@jwt_required()
def create_slot(schedule_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    schedule, error = check_schedule_access(
        schedule_id, user.id, is_admin=_is_admin(claims)
    )
    if error:
        return _error_response(error)

    if not user_can_manage_ministry(
        user.id, schedule.ministry_id, is_admin=_is_admin(claims)
    ):
        return jsonify(message='Forbidden'), 403

    result = service_create_slot(schedule_id, request.json or {})
    if result.get('error'):
        return _error_response(result)
    return jsonify(**result), 201


@schedules_blueprint.route('/slots/<int:slot_id>', methods=['PATCH'])
@jwt_required()
def update_slot(slot_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    slot, error = check_slot_access(slot_id, user.id, is_admin=_is_admin(claims))
    if error:
        return _error_response(error)

    if not user_can_manage_ministry(
        user.id, slot.schedule.ministry_id, is_admin=_is_admin(claims)
    ):
        return jsonify(message='Forbidden'), 403

    result = service_update_slot(slot_id, request.json or {})
    if result.get('error'):
        return _error_response(result)
    return jsonify(**result), 200


@schedules_blueprint.route('/slots/<int:slot_id>', methods=['DELETE'])
@jwt_required()
def delete_slot(slot_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    slot, error = check_slot_access(slot_id, user.id, is_admin=_is_admin(claims))
    if error:
        return _error_response(error)

    if not user_can_manage_ministry(
        user.id, slot.schedule.ministry_id, is_admin=_is_admin(claims)
    ):
        return jsonify(message='Forbidden'), 403

    result = service_delete_slot(slot_id)
    if result.get('error'):
        return _error_response(result)
    return jsonify(**result), 200


@schedules_blueprint.route('/slots/<int:slot_id>/assignments', methods=['POST'])
@jwt_required()
def add_slot_assignment(slot_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    slot, error = check_slot_access(slot_id, user.id, is_admin=_is_admin(claims))
    if error:
        return _error_response(error)

    if not user_can_manage_ministry(
        user.id, slot.schedule.ministry_id, is_admin=_is_admin(claims)
    ):
        return jsonify(message='Forbidden'), 403

    data = request.json or {}
    result = service_add_slot_assignment(slot_id, data.get('username'))
    if result.get('error'):
        return _error_response(result)
    return jsonify(**result), 201


@schedules_blueprint.route(
    '/slots/<int:slot_id>/assignments/<int:user_id>', methods=['DELETE']
)
@jwt_required()
def remove_slot_assignment(slot_id, user_id):
    claims = get_jwt()
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    slot, error = check_slot_access(slot_id, user.id, is_admin=_is_admin(claims))
    if error:
        return _error_response(error)

    if not user_can_manage_ministry(
        user.id, slot.schedule.ministry_id, is_admin=_is_admin(claims)
    ):
        return jsonify(message='Forbidden'), 403

    result = service_remove_slot_assignment(slot_id, user_id)
    if result.get('error'):
        return _error_response(result)
    return jsonify(**result), 200


@schedules_blueprint.route('/assignments/<int:assignment_id>', methods=['PATCH'])
@jwt_required()
def update_assignment(assignment_id):
    user = _current_user()
    if not user:
        return jsonify(message='User not found'), 404

    data = request.json or {}
    result = service_update_assignment_status(
        assignment_id,
        user.id,
        data.get('status'),
    )
    if result.get('error'):
        return _error_response(result)
    return jsonify(**result), 200
