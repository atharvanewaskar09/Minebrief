import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

from flask import Blueprint, current_app, g, request, jsonify, send_from_directory
from app.models.attachment import Attachment
from app.models.base import db
from app.models.shift_report import ShiftReport
from app.services.upload_service import handle_file_upload
from app.utils.file_utils import (
    determine_category,
    get_file_extension,
    is_allowed_extension,
    is_allowed_mime_type,
    has_path_traversal,
)

uploads_bp = Blueprint('uploads', __name__)

@uploads_bp.route('/uploads', methods=['POST'])
def upload_file():
    """
    Handle secure multipart file uploads.
    Validates MIME type, extension, size, path traversal.
    """
    if request.is_json:
        if not g.current_user or not g.current_user.supabase_user_id:
            return jsonify({'success': False, 'error': 'Authenticated upload is required.'}), 401
        data = request.get_json()
        report_id = data.get('report_id')
        report = ShiftReport.query.filter_by(
            id=report_id,
            workspace_id=g.workspace_id,
        ).first()
        if not report:
            return jsonify({'success': False, 'error': 'Report not found in this workspace.'}), 404
        object_path = data.get('storage_path', '')
        parts = object_path.split('/')
        if (
            len(parts) != 4
            or parts[0] != str(g.workspace_id)
            or parts[1] != g.current_user.supabase_user_id
            or parts[2] != str(report_id)
            or any(part in ('', '.', '..') for part in parts)
        ):
            return jsonify({'success': False, 'error': 'Invalid workspace attachment path.'}), 400
        original_name = data.get('original_name', '')
        mime_type = data.get('mime_type', '').lower()
        extension = get_file_extension(original_name)
        file_size = data.get('file_size')
        if (
            not original_name
            or has_path_traversal(original_name)
            or len(original_name) > 255
            or not is_allowed_extension(original_name)
            or not is_allowed_mime_type(mime_type)
            or not isinstance(file_size, int)
            or file_size <= 0
            or file_size > current_app.config['MAX_CONTENT_LENGTH']
        ):
            return jsonify({'success': False, 'error': 'Attachment metadata failed validation.'}), 400
        attachment = Attachment(
            workspace_id=g.workspace_id,
            uploader_id=g.current_user.supabase_user_id,
            storage_path=object_path,
            report_id=report.id,
            filename=parts[-1],
            original_name=original_name,
            file_type=determine_category(mime_type, extension),
            file_size=file_size,
            mime_type=mime_type,
        )
        db.session.add(attachment)
        db.session.commit()
        return jsonify({'success': True, 'data': attachment.to_dict()}), 201

    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': "No file part in request. Use 'file' form field."
        }), 400

    file_obj = request.files['file']
    if not file_obj or file_obj.filename == '':
        return jsonify({
            'success': False,
            'error': 'No selected file.'
        }), 400

    report_id = request.form.get('report_id', type=int)

    try:
        report = None
        if report_id is not None:
            report = ShiftReport.query.filter_by(
                id=report_id,
                workspace_id=g.workspace_id,
            ).first()
            if not report:
                return jsonify({
                    'success': False,
                    'error': 'Report not found in this workspace.',
                }), 404
        data = handle_file_upload(
            file_obj,
            report_id=report_id,
            workspace_id=g.workspace_id,
            uploader_id=g.current_user.supabase_user_id if g.current_user else None,
        )
        return jsonify({
            'success': True,
            'data': data
        }), 201
    except ValueError as ve:
        return jsonify({
            'success': False,
            'error': str(ve)
        }), 400
    except Exception:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Upload failed while storing the file or its metadata.'
        }), 500


@uploads_bp.route('/uploads/<int:attachment_id>/url', methods=['GET'])
def get_attachment_url(attachment_id):
    attachment = Attachment.query.filter_by(
        id=attachment_id,
        workspace_id=g.workspace_id,
    ).first()
    if not attachment:
        return jsonify({'success': False, 'error': 'Attachment not found.'}), 404

    if not attachment.storage_path:
        return jsonify({
            'success': True,
            'data': {'url': f"/api/uploads/{attachment.id}/file"},
        }), 200
    if not g.current_user or not g.access_token:
        return jsonify({'success': False, 'error': 'An authenticated user is required.'}), 401

    encoded_path = '/'.join(quote(part, safe='') for part in attachment.storage_path.split('/'))
    storage_url = (
        f"{current_app.config['SUPABASE_URL']}/storage/v1/object/sign/"
        f"{quote(current_app.config['STORAGE_BUCKET'], safe='')}/{encoded_path}"
    )
    storage_request = Request(
        storage_url,
        data=json.dumps({'expiresIn': 60}).encode('utf-8'),
        headers={
            'apikey': current_app.config['SUPABASE_PUBLISHABLE_KEY'],
            'Authorization': f'Bearer {g.access_token}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )
    try:
        with urlopen(storage_request, timeout=8) as response:
            result = json.loads(response.read())
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return jsonify({
            'success': False,
            'error': 'Unable to create an authorized attachment link.',
        }), 502

    signed_url = result.get('signedURL')
    if not signed_url:
        return jsonify({'success': False, 'error': 'Storage returned no signed link.'}), 502
    if not signed_url.startswith('http'):
        signed_url = f"{current_app.config['SUPABASE_URL']}/storage/v1{signed_url}"
    return jsonify({'success': True, 'data': {'url': signed_url}}), 200


@uploads_bp.route('/uploads/<int:attachment_id>/file', methods=['GET'])
def get_local_attachment(attachment_id):
    attachment = Attachment.query.filter_by(
        id=attachment_id,
        workspace_id=g.workspace_id,
        storage_path=None,
    ).first()
    if not attachment:
        return jsonify({'success': False, 'error': 'Attachment not found.'}), 404
    return send_from_directory(
        current_app.config['UPLOAD_FOLDER'],
        attachment.filename,
        as_attachment=False,
        download_name=attachment.original_name,
    )
