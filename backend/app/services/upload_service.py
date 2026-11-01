from app.models.base import db
from app.models.attachment import Attachment
from app.utils.file_utils import validate_and_save_file

def handle_file_upload(file_storage, report_id=None, workspace_id=None, uploader_id=None):
    """
    Validate, safely store file, and record in attachments database table.
    """
    saved_meta = validate_and_save_file(file_storage)

    attachment = Attachment(
        workspace_id=workspace_id,
        uploader_id=uploader_id,
        report_id=report_id,
        filename=saved_meta['filename'],
        original_name=saved_meta['original_name'],
        file_type=saved_meta['file_type'],
        file_size=saved_meta['file_size'],
        mime_type=saved_meta['mime_type']
    )
    db.session.add(attachment)
    db.session.commit()

    return attachment.to_dict()
