from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
)
from models import User, Member, db
import bcrypt

def _check_password(raw_password, stored_hash):
    if raw_password is None or stored_hash is None:
        return False

    if isinstance(raw_password, str):
        raw_password = raw_password.encode('utf-8')

    if isinstance(stored_hash, str):
        stored_hash = stored_hash.encode('utf-8')

    try:
        return bcrypt.checkpw(raw_password, stored_hash)
    except ValueError:
        return False


auth_blueprint = Blueprint('auth', __name__)

@auth_blueprint.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    role = data.get('role', 'user')

    if User.query.filter_by(username=username).first():
        return jsonify(message="User already exists"), 409

    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user_class = Member if role != 'admin' else User
    db.session.add(user_class(email=email, username=username, password=hashed_password, role=role))
    db.session.commit()

    return jsonify(message="User registered successfully"), 201

@auth_blueprint.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.is_active and _check_password(password, user.password):
        access_token = create_access_token(identity=username, additional_claims={"role": user.role, "is_active": user.is_active})
        refresh_token = create_refresh_token(identity=username, additional_claims={"role": user.role, "is_active": user.is_active})

        user.last_login = db.func.now()
        db.session.commit()

        return jsonify(access_token=access_token, refresh_token=refresh_token), 200
    else:
        if not user:
            return jsonify(message="User not found"), 404

        if not user.is_active:
            return jsonify(message="User is inactive"), 401

        if not _check_password(password, user.password):
            return jsonify(message="Invalid username or password"), 401

@auth_blueprint.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh_token():
    current_user = get_jwt_identity()
    user = User.query.filter_by(username=current_user).first()

    if not user:
        return jsonify(message="User not found"), 404

    if not user.is_active:
        return jsonify(message="User is inactive"), 401

    access_token = create_access_token(
        identity=current_user,
        additional_claims={"role": user.role, "is_active": user.is_active},
    )
    refresh_token = create_refresh_token(
        identity=current_user,
        additional_claims={"role": user.role, "is_active": user.is_active},
    )

    return jsonify(access_token=access_token, refresh_token=refresh_token), 200


@auth_blueprint.route('/change-password', methods=['PATCH'])
@jwt_required()
def change_password():
    current_user = get_jwt_identity()
    data = request.json
    old_password = data.get('old_password')
    new_password = data.get('new_password')

    user = User.query.filter_by(username=current_user).first()

    if user and _check_password(old_password, user.password):
        user.password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        db.session.commit()
        return jsonify(message="Password changed successfully"), 200
    else:
        return jsonify(message="Invalid old password"), 401
