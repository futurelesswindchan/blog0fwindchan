from flask import Blueprint
from .public import public_bp
from .auth import auth_bp
from .admin import admin_bp
from .assets import assets_bp

def register_routes(app):
    """注册所有蓝图"""
    # 基础健康检查
    @app.route("/")
    def hello() -> str:
        return "Hello! Blog Backend is running."

    # 注册蓝图分组
    app.register_blueprint(public_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api')
    app.register_blueprint(assets_bp, url_prefix='/api')
