from datetime import date
import bcrypt
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import Member, Address, db

members_blueprint = Blueprint('members', __name__)

@members_blueprint.route('/', methods=['GET'])
@jwt_required()
def list_members():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify(message="Admins only"), 403

    members = Member.query.order_by(Member.full_name).all()
    data = [{
        'username': member.username,
        'fullname': member.full_name,
        'email': member.email,
        'phone': member.phone,
        'cpf': member.cpf,
        'gender': member.gender,
        'dateOfBirth': member.date_of_birth.isoformat() if member.date_of_birth else None,
        'servicePreferences': member.service_preferences.split(',') if member.service_preferences else [],
        'isActive': member.is_active
    } for member in members]
    return jsonify(members=data), 200

@members_blueprint.route('/', methods=['POST'])
@jwt_required()
def enroll_member():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify(message="Admins only"), 403

    data = request.json
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if not username or not email or not password:
        return jsonify(message="username, email and password are required"), 400

    if Member.query.filter_by(username=username).first() or Member.query.filter_by(email=email).first():
        return jsonify(message="Member with that username or email already exists"), 409

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    member = Member(
        username=username,
        email=email,
        password=hashed_password,
        role='member',
        full_name=data.get('fullname', ''),
        phone=data.get('phone', ''),
        cpf=data.get('cpf'),
        gender=data.get('gender', ''),
        service_preferences=','.join(data.get('servicePreferences', [])) if isinstance(data.get('servicePreferences'), list) else data.get('servicePreferences', '')
    )
    db.session.add(member)
    db.session.flush()

    if data.get('address') and data.get('city') and data.get('state') and data.get('country') and data.get('postalCode'):
        address = Address(
            user_id=member.id,
            address=data.get('address'),
            city=data.get('city'),
            state=data.get('state'),
            country=data.get('country'),
            postal_code=data.get('postalCode')
        )
        db.session.add(address)

    db.session.commit()
    return jsonify(message="Member enrolled successfully"), 201

@members_blueprint.route('/profile', methods=['GET'])
@jwt_required()
def get_member_profile():
    current_username = get_jwt_identity()
    member = Member.query.filter_by(username=current_username).first()
    if not member:
        return jsonify(message="Member not found"), 404

    address = member.addresses[0] if member.addresses else None
    return jsonify({
        'username': member.username,
        'fullname': member.full_name,
        'email': member.email,
        'phone': member.phone,
        'dateOfBirth': member.date_of_birth.isoformat() if member.date_of_birth else None,
        'cpf': member.cpf,
        'servicePreferences': member.service_preferences.split(',') if member.service_preferences else [],
        'gender': member.gender,
        'address': address.address if address else None,
        'city': address.city if address else None,
        'state': address.state if address else None,
        'country': address.country if address else None,
        'postalCode': address.postal_code if address else None
    }), 200

@members_blueprint.route('/profile', methods=['PATCH'])
@jwt_required()
def update_member_info():
    current_username = get_jwt_identity()
    member = Member.query.filter_by(username=current_username).first()
    if not member:
        return jsonify(message="Member not found"), 404

    data = request.json
    member.full_name = data.get('fullname', member.full_name)
    member.email = data.get('email', member.email)
    member.phone = data.get('phone', member.phone)

    date_of_birth = data.get('dateOfBirth')
    if date_of_birth:
        member.date_of_birth = date.fromisoformat(date_of_birth) if isinstance(date_of_birth, str) else date_of_birth

    member.cpf = data.get('cpf', member.cpf)
    service_preferences = data.get('servicePreferences')
    if service_preferences is not None:
        if isinstance(service_preferences, list):
            member.service_preferences = ','.join(service_preferences)
        else:
            member.service_preferences = service_preferences
    member.gender = data.get('gender', member.gender)

    if not member.addresses:
        new_address = Address(user_id=member.id)
        db.session.add(new_address)
        member.addresses.append(new_address)

    member.addresses[0].address = data.get('address') if member.addresses else None
    member.addresses[0].city = data.get('city') if member.addresses else None
    member.addresses[0].state = data.get('state') if member.addresses else None
    member.addresses[0].country = data.get('country') if member.addresses else None
    member.addresses[0].postal_code = data.get('postalCode') if member.addresses else None

    db.session.commit()
    return jsonify(message="Member profile updated successfully"), 200
