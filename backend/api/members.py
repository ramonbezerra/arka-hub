from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, db
from datetime import date

members_blueprint = Blueprint('members', __name__)

@members_blueprint.route('/profile', methods=['GET'])
@jwt_required()
def get_member_info():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404

    return jsonify({
        'username': user.username,
        'email': user.email,
        'full_name': user.full_name,
        'phone': user.phone,
        'date_of_birth': user.date_of_birth,
        'cpf': user.cpf,
        'gender': user.gender
    }), 200