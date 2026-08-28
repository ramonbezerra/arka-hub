from datetime import date, datetime
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

class Ministry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=False, default='')
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    memberships = db.relationship(
        'MinistryMembership',
        back_populates='ministry',
        lazy=True,
        cascade='all, delete-orphan',
    )

class MinistryMembership(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ministry_id = db.Column(db.Integer, db.ForeignKey('ministry.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='volunteer')
    joined_at = db.Column(db.DateTime, server_default=db.func.now())

    ministry = db.relationship('Ministry', back_populates='memberships')
    user = db.relationship('User', backref=db.backref('ministry_memberships', lazy=True))

    __table_args__ = (
        db.UniqueConstraint('ministry_id', 'user_id', name='uq_ministry_membership'),
    )

class ServiceSchedule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ministry_id = db.Column(db.Integer, db.ForeignKey('ministry.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='draft')
    created_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    ministry = db.relationship('Ministry', backref=db.backref('schedules', lazy=True))
    created_by = db.relationship('User', backref=db.backref('created_schedules', lazy=True))
    slots = db.relationship(
        'ScheduleSlot',
        back_populates='schedule',
        lazy=True,
        cascade='all, delete-orphan',
        order_by='ScheduleSlot.starts_at',
    )

class ScheduleSlot(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    schedule_id = db.Column(db.Integer, db.ForeignKey('service_schedule.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    role_label = db.Column(db.String(100), nullable=False, default='')
    starts_at = db.Column(db.DateTime, nullable=False)
    ends_at = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200), nullable=False, default='')
    notes = db.Column(db.Text, nullable=False, default='')
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    schedule = db.relationship('ServiceSchedule', back_populates='slots')
    assignments = db.relationship(
        'SlotAssignment',
        back_populates='slot',
        lazy=True,
        cascade='all, delete-orphan',
    )

class SlotAssignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slot_id = db.Column(db.Integer, db.ForeignKey('schedule_slot.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='assigned')
    assigned_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    slot = db.relationship('ScheduleSlot', back_populates='assignments')
    user = db.relationship('User', backref=db.backref('slot_assignments', lazy=True))

    __table_args__ = (
        db.UniqueConstraint('slot_id', 'user_id', name='uq_slot_assignment'),
    )
