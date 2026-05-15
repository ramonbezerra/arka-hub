from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from services.members_service import (
    list_members as service_list_members,
    enroll_member as service_enroll_member,
    get_member as service_get_member,
    update_member as service_update_member,
    get_member_profile as service_get_member_profile,
    update_member_info as service_update_member_info,
)

members_blueprint = Blueprint('members', __name__)

@members_blueprint.route('/', methods=['GET'])
@jwt_required()
def list_members():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify(message="Admins only"), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    if page < 1:
        page = 1
    if per_page < 1 or per_page > 100:
        per_page = 10

    show_inactive = request.args.get('show_inactive', 'false').lower() == 'true'
    search = request.args.get('search', '', type=str)
    filters = {
        'username': request.args.get('username', '', type=str),
        'fullname': request.args.get('fullname', '', type=str),
        'email': request.args.get('email', '', type=str),
        'phone': request.args.get('phone', '', type=str),
        'cpf': request.args.get('cpf', '', type=str),
        'gender': request.args.get('gender', '', type=str),
        'servicePreferences': request.args.get('servicePreferences', '', type=str),
        'status': request.args.get('status', '', type=str)
    }

    result = service_list_members(page=page, per_page=per_page, show_inactive=show_inactive, search=search, filters=filters)
    return jsonify(**result), 200

@members_blueprint.route('/', methods=['POST'])
@jwt_required()
def enroll_member():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify(message="Admins only"), 403

    data = request.json
    result = service_enroll_member(
        username=data.get('username'),
        email=data.get('email'),
        password=data.get('password'),
        fullname=data.get('fullname', ''),
        phone=data.get('phone', ''),
        cpf=data.get('cpf'),
        gender=data.get('gender', ''),
        service_preferences=data.get('servicePreferences'),
        address_data={
            'address': data.get('address'),
            'city': data.get('city'),
            'state': data.get('state'),
            'country': data.get('country'),
            'postalCode': data.get('postalCode')
        }
    )

    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 400)
    return jsonify(message=result['message']), 201

@members_blueprint.route('/<username>', methods=['GET'])
@jwt_required()
def get_member(username):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify(message="Admins only"), 403

    result = service_get_member(username)
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 404)
    return jsonify(result), 200

@members_blueprint.route('/<username>', methods=['PATCH'])
@jwt_required()
def update_member(username):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify(message="Admins only"), 403

    data = request.json
    result = service_update_member(username, data)
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 404)
    return jsonify(message=result['message']), 200

@members_blueprint.route('/profile', methods=['GET'])
@jwt_required()
def get_member_profile():
    current_username = get_jwt_identity()
    result = service_get_member_profile(current_username)
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 404)
    return jsonify(result), 200

@members_blueprint.route('/profile', methods=['PATCH'])
@jwt_required()
def update_member_info():
    current_username = get_jwt_identity()
    data = request.json
    result = service_update_member_info(current_username, data)
    if result.get('error'):
        return jsonify(message=result['error']), result.get('code', 404)
    return jsonify(message=result['message']), 200
