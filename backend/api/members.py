from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from services.members_service import (
    list_members,
    enroll_member,
    get_member,
    update_member,
    get_member_profile,
    update_member_info
)

members_blueprint = Blueprint('members', __name__)

@members_blueprint.route('/', methods=['GET'])
@jwt_required()
def list_members_route():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify(message="Admins only"), 403

    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    show_inactive = request.args.get('show_inactive', 'false').lower() == 'true'

    result = list_members(page=page, per_page=per_page, show_inactive=show_inactive)
    return jsonify(**result), 200

@members_blueprint.route('/', methods=['POST'])
@jwt_required()
def enroll_member_route():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify(message="Admins only"), 403

    data = request.json
    address_data = {
        'address': data.get('address'),
        'city': data.get('city'),
        'state': data.get('state'),
        'country': data.get('country'),
        'postalCode': data.get('postalCode')
    }

    result = enroll_member(
        username=data.get('username'),
        email=data.get('email'),
        password=data.get('password'),
        fullname=data.get('fullname', ''),
        phone=data.get('phone', ''),
        cpf=data.get('cpf'),
        gender=data.get('gender', ''),
        service_preferences=data.get('servicePreferences'),
        address_data=address_data
    )

    if 'error' in result:
        return jsonify(message=result['error']), result['code']
    
    return jsonify(message=result['message']), 201

@members_blueprint.route('/<username>', methods=['GET'])
@jwt_required()
def get_member_route(username):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify(message="Admins only"), 403

    result = get_member(username)
    
    if 'error' in result:
        return jsonify(message=result['error']), result['code']
    
    return jsonify(**result), 200

@members_blueprint.route('/<username>', methods=['PATCH'])
@jwt_required()
def update_member_route(username):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify(message="Admins only"), 403

    data = request.json
    result = update_member(username, data)

    if 'error' in result:
        return jsonify(message=result['error']), result['code']
    
    return jsonify(message=result['message']), 200

@members_blueprint.route('/profile', methods=['GET'])
@jwt_required()
def get_member_profile_route():
    current_username = get_jwt_identity()
    result = get_member_profile(current_username)
    
    if 'error' in result:
        return jsonify(message=result['error']), result['code']
    
    return jsonify(**result), 200

@members_blueprint.route('/profile', methods=['PATCH'])
@jwt_required()
def update_member_info_route():
    current_username = get_jwt_identity()
    data = request.json
    result = update_member_info(current_username, data)

    if 'error' in result:
        return jsonify(message=result['error']), result['code']
    
    return jsonify(message=result['message']), 200
