from datetime import date
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    full_name = db.Column(db.String(120), nullable=False, default='')
    phone = db.Column(db.String(20), nullable=False, default='')
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    date_of_birth = db.Column(db.Date, nullable=False, default=date.today())
    cpf = db.Column(db.String(11), nullable=True)
    discriminator = db.Column('type', db.String(50), nullable=False, server_default='user')
    gender = db.Column(db.String(10), nullable=False, default='')
    role = db.Column(db.String(50), nullable=False, default='user')
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    last_login = db.Column(db.DateTime, nullable=True)

    __mapper_args__ = {
        'polymorphic_on': discriminator,
        'polymorphic_identity': 'user'
    }

    __table_args__ = (
        db.UniqueConstraint('cpf', name='uq_user_cpf'),
    )

class Member(User):
    service_preferences = db.Column(db.String(255), nullable=True, default='')

    __mapper_args__ = {
        'polymorphic_identity': 'member'
    }

class Address(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(100), nullable=False)
    country = db.Column(db.String(100), nullable=False)
    postal_code = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    user = db.relationship('User', backref=db.backref('addresses', lazy=True))