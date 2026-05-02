from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, db
from datetime import date

users_blueprint = Blueprint('users', __name__)

@users_blueprint.route('/profile', methods=['GET'])
@jwt_required()
def get_user_info():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    if user:
        data = {
            "username": user.username,
            "role": user.role,
            "lastLogin": user.last_login,
            "createdAt": user.created_at,
            "updatedAt": user.updated_at,
            "fullname": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "dateOfBirth": user.date_of_birth,
            "cpf": user.cpf,
            "gender": user.gender,
            "address": user.addresses[0].address if user.addresses else None,
            "city": user.addresses[0].city if user.addresses else None,
            "state": user.addresses[0].state if user.addresses else None,
            "country": user.addresses[0].country if user.addresses else None,
            "postalCode": user.addresses[0].postal_code if user.addresses else None
        }
        return jsonify(data), 200
    return jsonify(message="User not found"), 404

@users_blueprint.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    
    if not user:
        return jsonify(message="User not found"), 404
    
    data = request.json
    user.full_name = data.get('fullname', user.full_name)
    user.email = data.get('email', user.email)
    user.phone = data.get('phone', user.phone)
    user.date_of_birth = date.fromisoformat(data.get('dateOfBirth', user.date_of_birth))
    user.cpf = data.get('cpf', user.cpf)
    user.gender = data.get('gender', user.gender)
    if not user.addresses:
        from models import Address
        new_address = Address(user_id=user.id)
        db.session.add(new_address)
        user.addresses.append(new_address)
    user.addresses[0].address = data.get('address') if user.addresses else None
    user.addresses[0].city = data.get('city') if user.addresses else None
    user.addresses[0].state = data.get('state') if user.addresses else None
    user.addresses[0].country = data.get('country') if user.addresses else None
    user.addresses[0].postal_code = data.get('postalCode') if user.addresses else None

    db.session.commit()
    return jsonify(message="Profile updated successfully"), 200

@users_blueprint.route('/admin', methods=['GET'])
@jwt_required()
def get_administrators_list():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    if user:
        admins = User.query.filter_by(role='admin').all()
        data = {"admins": [{
            "isActive": admin.is_active,
            "username": admin.username, 
            "email": admin.email, 
            "fullname": admin.full_name} for admin in admins]}
        return jsonify(data), 200
    return jsonify(message="User not found"), 404

@users_blueprint.route('/admin/<username>', methods=['PATCH'])
@jwt_required()
def enable_or_disable_admin(username):
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()
    if user:
        admin = User.query.filter_by(username=username).first()
        if admin:
            admin.is_active = not admin.is_active
            db.session.commit()
            return jsonify(message="Admin updated successfully"), 204
        return jsonify(message="Admin not found"), 404
    return jsonify(message="User not found"), 404