import os
import uuid
from typing import cast

import magic
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required
from werkzeug.utils import secure_filename

from extensions import limiter

assets_bp = Blueprint("assets", __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_MIME_TYPES = {'image/png', 'image/jpeg', 'image/gif', 'image/webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(file) -> tuple[bool, str]:
    if not file or not file.filename:
        return False, "No file provided"
    
    filename = file.filename
    if '.' not in filename:
        return False, "Invalid filename"
    
    ext = filename.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Extension .{ext} not allowed"
    
    file.seek(0)
    header = file.read(2048)
    file.seek(0)
    
    try:
        mime = magic.from_buffer(header, mime=True)
    except Exception as e:
        current_app.logger.error(f"MIME detection failed: {str(e)}")
        return False, "Failed to detect file type"
    
    if mime not in ALLOWED_MIME_TYPES:
        return False, f"MIME type {mime} not allowed"
    
    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    
    if size > MAX_FILE_SIZE:
        return False, f"File too large (max {MAX_FILE_SIZE//1024//1024}MB)"
    if size == 0:
        return False, "Empty file not allowed"
    
    return True, ""


@assets_bp.route("/upload", methods=["POST"])
@jwt_required()
@limiter.limit("10 per minute")
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    upload_type = request.form.get('type', 'misc')

    if not file or file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    is_allowed, err_msg = allowed_file(file)
    if not is_allowed:
        return jsonify({"error": err_msg}), 400
    
    allowed_types = {'article', 'artwork', 'friend', 'misc'}
    if upload_type not in allowed_types:
        upload_type = 'misc'
        
    upload_folder = cast(str, current_app.config['UPLOAD_FOLDER'])
    save_dir = os.path.join(upload_folder, upload_type)
    
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    # file.filename 在此处已经过 allowed_file 校验，必然包含 '.'，断言非 None 供类型检查器理解
    raw_filename: str = file.filename  # type: ignore[assignment]
    ext = raw_filename.rsplit('.', 1)[1].lower()
    filename = secure_filename(f"{uuid.uuid4().hex}.{ext}")
    
    save_path = os.path.join(save_dir, filename)
    upload_folder_abs = os.path.abspath(upload_folder)
    save_path_abs = os.path.abspath(save_path)
    
    if not save_path_abs.startswith(upload_folder_abs):
        return jsonify({"error": "Path traversal detected"}), 400
    
    try:
        file.save(save_path_abs)
    except Exception as e:
        current_app.logger.error(f"File save failed: {str(e)}")
        return jsonify({"error": "Failed to save file"}), 500

    url = f"/static/uploads/{upload_type}/{filename}"
    return jsonify({"message": "Upload successful", "url": url})
