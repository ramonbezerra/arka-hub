from datetime import datetime, timezone
from flask import Blueprint, jsonify
from sqlalchemy import text

health_blueprint = Blueprint('health', __name__)


@health_blueprint.route('', methods=['GET'])
def liveness():
    """Liveness probe — process is up and serving."""
    return jsonify(
        status='ok',
        service='arka-hub-backend',
        timestamp=datetime.now(timezone.utc).isoformat(),
    ), 200


@health_blueprint.route('/ready', methods=['GET'])
def readiness():
    """Readiness probe — process is up and the database is reachable."""
    from models import db

    try:
        db.session.execute(text('SELECT 1'))
    except Exception as exc:
        return jsonify(
            status='error',
            service='arka-hub-backend',
            database='unreachable',
            error=str(exc),
            timestamp=datetime.now(timezone.utc).isoformat(),
        ), 503

    return jsonify(
        status='ok',
        service='arka-hub-backend',
        database='ok',
        timestamp=datetime.now(timezone.utc).isoformat(),
    ), 200
