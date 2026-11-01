import os
import uuid
import mimetypes
from werkzeug.utils import secure_filename
from flask import current_app

DEFAULT_ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png', 'webp', 'mp3', 'wav', 'm4a'}
DEFAULT_ALLOWED_MIME_TYPES = {
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/x-wav'
}

# Ensure common audio types are recognized in mimetypes
mimetypes.add_type('audio/x-m4a', '.m4a')
mimetypes.add_type('audio/mp4', '.m4a')
mimetypes.add_type('audio/mpeg', '.mp3')
mimetypes.add_type('audio/wav', '.wav')
mimetypes.add_type('image/webp', '.webp')

def has_path_traversal(filename: str) -> bool:
    """Check if filename contains path traversal sequences."""
    if not filename:
        return True
    if '..' in filename or '/' in filename or '\\' in filename:
        return True
    return False

def get_file_extension(filename: str) -> str:
    """Extract lowercase file extension without dot."""
    if not filename or '.' not in filename:
        return ''
    return filename.rsplit('.', 1)[1].lower()

def is_allowed_extension(filename: str, allowed_extensions=None) -> bool:
    """Check if file has an allowed extension."""
    if allowed_extensions is None:
        allowed_extensions = (
            current_app.config.get('ALLOWED_EXTENSIONS', DEFAULT_ALLOWED_EXTENSIONS)
            if current_app else DEFAULT_ALLOWED_EXTENSIONS
        )
    ext = get_file_extension(filename)
    return bool(ext and ext in allowed_extensions)

def get_mime_type(filename: str, fallback_header_type: str = None) -> str:
    """Detect MIME type using python's mimetypes standard module."""
    guessed_type, _ = mimetypes.guess_type(filename)
    if guessed_type:
        return guessed_type.lower()
    if fallback_header_type:
        return fallback_header_type.lower()
    return 'application/octet-stream'

def is_allowed_mime_type(mime_type: str, allowed_mime_types=None) -> bool:
    """Validate MIME type against allowed list."""
    if not mime_type:
        return False
    if allowed_mime_types is None:
        allowed_mime_types = (
            current_app.config.get('ALLOWED_MIME_TYPES', DEFAULT_ALLOWED_MIME_TYPES)
            if current_app else DEFAULT_ALLOWED_MIME_TYPES
        )
    return mime_type.lower() in allowed_mime_types

def determine_category(mime_type: str, extension: str) -> str:
    """Categorize file into pdf, image, or audio."""
    if extension == 'pdf' or 'pdf' in mime_type:
        return 'pdf'
    if extension in {'jpg', 'jpeg', 'png', 'webp'} or mime_type.startswith('image/'):
        return 'image'
    if extension in {'mp3', 'wav', 'm4a'} or mime_type.startswith('audio/'):
        return 'audio'
    return 'other'

def generate_safe_filename(original_filename: str) -> str:
    """Generate a UUID-based safe filename preserving the original extension."""
    ext = get_file_extension(original_filename)
    unique_id = uuid.uuid4().hex
    return f"{unique_id}.{ext}" if ext else unique_id

def validate_and_save_file(file_storage, upload_folder=None, max_size=None):
    """
    Validate and save uploaded file securely.
    Returns dict with file metadata or raises ValueError.
    """
    if not file_storage or not file_storage.filename:
        raise ValueError("No file provided or filename is empty.")

    original_name = file_storage.filename

    # Path traversal check
    if has_path_traversal(original_name):
        raise ValueError("Invalid filename: path traversal characters detected.")

    # Extension check
    if not is_allowed_extension(original_name):
        raise ValueError(f"File extension not allowed for: {original_name}")

    # MIME type detection & check
    detected_mime = get_mime_type(original_name, file_storage.content_type)
    if not is_allowed_mime_type(detected_mime):
        raise ValueError(f"MIME type '{detected_mime}' is not allowed.")

    # Size check
    file_storage.seek(0, os.SEEK_END)
    file_size = file_storage.tell()
    file_storage.seek(0)

    if max_size is None:
        max_size = (
            current_app.config.get('MAX_CONTENT_LENGTH', 20 * 1024 * 1024)
            if current_app else 20 * 1024 * 1024
        )

    if file_size > max_size:
        raise ValueError(f"File size exceeds maximum allowed size ({max_size} bytes).")

    if upload_folder is None:
        upload_folder = current_app.config['UPLOAD_FOLDER'] if current_app else 'uploads'

    os.makedirs(upload_folder, exist_ok=True)

    safe_name = generate_safe_filename(original_name)
    destination_path = os.path.join(upload_folder, safe_name)

    file_storage.save(destination_path)

    ext = get_file_extension(original_name)
    file_type = determine_category(detected_mime, ext)

    return {
        'filename': safe_name,
        'original_name': original_name,
        'file_type': file_type,
        'file_size': file_size,
        'mime_type': detected_mime,
        'file_path': destination_path
    }
