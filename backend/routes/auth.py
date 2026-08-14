from typing import Any, Optional, cast
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, get_jwt_identity
from models import User
from extensions import limiter

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/admin/login", methods=["POST"])
@limiter.limit("5 per minute")
def admin_login():
    data: dict[str, Any] = request.json or {}
    username = data.get("username")
    password = data.get("password")

    user = cast(Optional[User], User.query.filter_by(username=username).first())

    if user and password and user.check_password(password):
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        return jsonify(access_token=access_token, refresh_token=refresh_token)

    return jsonify({"msg": "错误的用户名或密码"}), 401

@auth_bp.route("/admin/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify(access_token=new_access_token)

@auth_bp.route("/admin/verify", methods=["GET"])
@jwt_required()
def verify_token():
    return jsonify({"valid": True})
