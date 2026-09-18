import os
from sqlalchemy.pool import StaticPool

class Config:
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    BABEL_DEFAULT_LOCALE = os.environ.get('BABEL_DEFAULT_LOCALE', 'en')
    BABEL_SUPPORTED_LOCALES = os.environ.get('BABEL_SUPPORTED_LOCALES', 'en,pt').split(',')

class DevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 'postgresql+psycopg2://arka:arkapass@db:5432/arkahub'
    )

class ProductionConfig(Config):
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    POSTGRES_USER = os.environ.get('POSTGRES_USER')
    POSTGRES_DB = os.environ.get('POSTGRES_DB')
    DB_PASSWORD = os.environ.get('DB_PASSWORD')
    DATABASE_SERVER = os.environ.get('DATABASE_SERVER')

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f'postgresql+psycopg2://{POSTGRES_USER}:{DB_PASSWORD}@'
        f'{DATABASE_SERVER}:5432/{POSTGRES_DB}'
        f'?sslmode=verify-full&sslrootcert=./global-bundle.pem'
    )

class TestingConfig(Config):
    TESTING = True
    JWT_SECRET_KEY = 'test-secret-key'
    SQLALCHEMY_DATABASE_URI = 'sqlite://'
    SQLALCHEMY_ENGINE_OPTIONS = {
        'poolclass': StaticPool,
        'connect_args': {'check_same_thread': False},
    }

config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig,
}
