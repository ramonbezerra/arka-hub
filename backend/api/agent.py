from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt
from agent.members_agent import process_enrollment_request

agent_blueprint = Blueprint('agent', __name__)

@agent_blueprint.route('/enroll', methods=['POST'])
@jwt_required()
def enroll_via_agent():
    """
    Enroll a new member using natural language prompt.
    Expects: {"prompt": "natural language description of member to enroll"}
    """
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify(message="Admins only"), 403

    data = request.json
    prompt = data.get('prompt')
    
    if not prompt:
        return jsonify(message="prompt field is required"), 400
    
    # Process enrollment via agent
    result = process_enrollment_request(prompt)
    
    status_code = 201 if result['success'] else 400
    return jsonify(result), status_code
