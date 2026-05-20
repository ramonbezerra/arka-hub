import os
from datetime import date
import bcrypt
from flask import Flask, request
from flask_babel import Babel
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from api.members import members_blueprint
from api.users import users_blueprint
from auth.routes import auth_blueprint
from config import config_by_name
from models import User, db

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'default')

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    def get_locale_func():
        return (
            request.accept_languages.best_match(app.config['BABEL_SUPPORTED_LOCALES'])
            or app.config['BABEL_DEFAULT_LOCALE']
        )

    app.config['BABEL_LOCALE_SELECTOR'] = get_locale_func
    Babel(app)
    JWTManager(app)

    @app.before_request
    def handle_preflight():
        if request.method == 'OPTIONS':
            response = app.make_default_options_response()
            response.headers.add('Access-Control-Allow-Origin', '*')
            response.headers.add(
                'Access-Control-Allow-Methods',
                'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            )
            response.headers.add(
                'Access-Control-Allow-Headers', 'Content-Type, Authorization'
            )
            response.headers.add('Access-Control-Max-Age', '3600')
            return response, 200

    db.init_app(app)

    CORS(
        app,
        resources={
            r'/api/*': {
                'origins': '*',
                'methods': ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                'allow_headers': ['Content-Type', 'Authorization'],
                'expose_headers': ['Content-Type'],
                'max_age': 3600,
                'send_wildcard': True,
            }
        },
        supports_credentials=False,
        automatic_options=True,
    )

    migrate = Migrate(app, db)
    migrate.init_app(app, db)

    app.register_blueprint(users_blueprint, url_prefix='/api/users')
    app.register_blueprint(members_blueprint, url_prefix='/api/members')
    app.register_blueprint(auth_blueprint, url_prefix='/api/auth')

    return app

def seed_admin_user():
    if User.query.filter_by(username='admin').first():
        return
    hashed_password = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt())
    user = User(
        username='admin',
        password=hashed_password,
        email='admin@example.com',
        role='admin',
        full_name='Admin User',
        phone='1234567890',
        date_of_birth=date(1990, 1, 1),
        cpf='12345678910',
        gender='other',
    )
    db.session.add(user)
    db.session.commit()

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_admin_user()
    app.run(debug=True)
