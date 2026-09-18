import os
from pathlib import Path
from urllib.parse import quote_plus

from sqlalchemy.pool import StaticPool

BASE_DIR = Path(__file__).resolve().parent
RDS_CERT = BASE_DIR / "us-east-1-bundle.pem"

class Config:
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    BABEL_DEFAULT_LOCALE = "en"
    BABEL_SUPPORTED_LOCALES = ["en", "pt"]

class DevelopmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg2://arka:arkapass@db:5432/arkahub",
    )

class ProductionConfig(Config):
    DB_PASSWORD = os.environ.get("DB_PASSWORD")

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "postgresql+psycopg2://postgres:"
        f"{quote_plus(DB_PASSWORD or 'arkapass')}"
        "@arka-hub-db.c05gams08but.us-east-1.rds.amazonaws.com:5432/postgres",
    )

    SQLALCHEMY_ENGINE_OPTIONS = {
        "connect_args": {
            "sslmode": "verify-full",
            "sslrootcert": str(RDS_CERT),
        }
    }

class TestingConfig(Config):
    TESTING = True
    JWT_SECRET_KEY = "test-secret-key"
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SQLALCHEMY_ENGINE_OPTIONS = {
        "poolclass": StaticPool,
        "connect_args": {"check_same_thread": False},
    }

config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": ProductionConfig,
}