from datetime import date
import bcrypt
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate

from models import db, User

from api.routes import api_blueprint
from auth.routes import auth_blueprint

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Set a strong secret key
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'  # Use your database URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable track modifications to save resources

jwt = JWTManager(app)  # Initialize JWTManager with your app

db.init_app(app)  # Initialize SQLAlchemy with your app

CORS(app)

migrate = Migrate(app, db)  # Initialize Flask-Migrate with your app and db
migrate.init_app(app, db)

app.register_blueprint(api_blueprint, url_prefix='/api')
app.register_blueprint(auth_blueprint, url_prefix='/auth')

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