from datetime import date
import bcrypt
from flask import Flask, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_babel import Babel, get_locale

from models import db, User

from api.users import users_blueprint
from api.members import members_blueprint
from auth.routes import auth_blueprint

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Set a strong secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'  # Use your database URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable track modifications to save resources
app.config['BABEL_DEFAULT_LOCALE'] = 'en'
app.config['BABEL_SUPPORTED_LOCALES'] = ['en', 'pt']

babel = Babel(app)

def get_locale_func():
    return request.accept_languages.best_match(app.config['BABEL_SUPPORTED_LOCALES']) or app.config['BABEL_DEFAULT_LOCALE']

app.config['BABEL_LOCALE_SELECTOR'] = get_locale_func

jwt = JWTManager(app)  # Initialize JWTManager with your app

# Handle preflight requests - skip JWT verification for OPTIONS
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")
        response.headers.add("Access-Control-Max-Age", "3600")
        return response, 200

db.init_app(app)  # Initialize SQLAlchemy with your app

# Configure CORS with explicit settings to handle preflight requests
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type"],
            "max_age": 3600,
            "send_wildcard": True
        }
    },
    supports_credentials=False,
    automatic_options=True
)

migrate = Migrate(app, db)  # Initialize Flask-Migrate with your app and db
migrate.init_app(app, db)

app.register_blueprint(users_blueprint, url_prefix='/api/users')
app.register_blueprint(members_blueprint, url_prefix='/api/members')
app.register_blueprint(auth_blueprint, url_prefix='/api/auth')

with app.app_context():
    # Create an admin user if it doesn't exist
    if not User.query.filter_by(username='admin').first():
        hashed_password = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt())
        user = User(username='admin', password=hashed_password, email='admin@example.com', role='admin',
                    full_name='Admin User', phone='1234567890', date_of_birth=date(1990, 1, 1), cpf='12345678910',
                    gender='other')
        db.session.add(user)
        db.session.commit()

if __name__ == "__main__":
    app.run(debug=True)