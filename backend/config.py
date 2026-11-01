import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
from dotenv import load_dotenv

load_dotenv(os.path.join(BASE_DIR, '.env'))


def _database_uri():
    uri = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{os.path.join(BASE_DIR, 'minebrief_dev.db')}"
    )
    if uri.startswith('postgres://'):
        uri = uri.replace('postgres://', 'postgresql://', 1)
    if uri.startswith('postgresql://'):
        uri = uri.replace('postgresql://', 'postgresql+psycopg://', 1)
        if 'sslmode=' not in uri:
            uri += '&sslmode=require' if '?' in uri else '?sslmode=require'
    return uri


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20MB
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    SUPABASE_URL = os.environ.get('SUPABASE_URL', '').rstrip('/')
    SUPABASE_PUBLISHABLE_KEY = os.environ.get('SUPABASE_PUBLISHABLE_KEY', '')
    STORAGE_BUCKET = os.environ.get('SUPABASE_STORAGE_BUCKET', 'minebrief-attachments')
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    GEMINI_MODEL = os.environ.get('GEMINI_MODEL', 'gemini-3.8-flash')
    AUTH_REQUIRED = False
    AUTO_CREATE_SCHEMA = False
    ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'webp', 'mp3', 'wav', 'm4a'}
    ALLOWED_MIME_TYPES = {
        'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
        'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'
    }

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = _database_uri()
    AUTH_REQUIRED = bool(os.environ.get('SUPABASE_URL'))
    AUTO_CREATE_SCHEMA = os.environ.get(
        'AUTO_CREATE_SCHEMA',
        str(_database_uri().startswith('sqlite:'))
    ).lower() == 'true'
    SQLALCHEMY_ENGINE_OPTIONS = (
        {'pool_pre_ping': True, 'pool_size': 5, 'max_overflow': 10, 'pool_timeout': 30}
        if _database_uri().startswith('postgresql+psycopg://')
        else {}
    )

class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'tests', 'test_uploads')
    AUTO_CREATE_SCHEMA = True

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = _database_uri()
    AUTH_REQUIRED = True
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_size': 5,
        'max_overflow': 10,
        'pool_timeout': 30,
    }

    @classmethod
    def validate(cls):
        missing = [
            name for name, value in (
                ('SECRET_KEY', cls.SECRET_KEY),
                ('SUPABASE_URL', cls.SUPABASE_URL),
                ('SUPABASE_PUBLISHABLE_KEY', cls.SUPABASE_PUBLISHABLE_KEY),
                ('DATABASE_URL', os.environ.get('DATABASE_URL')),
            ) if not value
        ]
        if missing:
            raise RuntimeError(
                'Missing required production environment variables: '
                + ', '.join(missing)
            )
        if not cls.SQLALCHEMY_DATABASE_URI.startswith('postgresql+psycopg://'):
            raise RuntimeError('Production DATABASE_URL must use PostgreSQL via psycopg.')

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
