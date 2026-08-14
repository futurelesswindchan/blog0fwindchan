import os
import sys
from datetime import timedelta
from getpass import getpass

from typing import cast
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from marshmallow import ValidationError
from werkzeug.middleware.proxy_fix import ProxyFix

# Import extensions explicitly
from extensions import db, jwt, limiter
from models import User, Category
from routes import register_routes

def create_app():
    load_dotenv()
    
    cors_origins_raw = os.getenv("CORS_ORIGINS")
    if not cors_origins_raw:
        print("❌ [呜哇！致命错误] 没有找到 CORS_ORIGINS 环境变量！")
        sys.exit(1)
    
    app = Flask(__name__)
    
    # == 应用 Nginx 反向代理信任修正 ==
    # 信任前方的 1 层 Nginx，使得 get_remote_address 取到真实的客户端 IP，防止全局限流误伤！
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    cors_origins = cors_origins_raw.split(",")
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})
    
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///blog.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret or len(jwt_secret) < 32:
        print("❌ [呜哇！安全错误] JWT_SECRET_KEY 缺失或不足 32 字符！")
        print("请运行：python -c \"import secrets; print(secrets.token_hex(32))\" 并填入 .env 中。")
        sys.exit(1)
        
    app.config["JWT_SECRET_KEY"] = jwt_secret
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
    
    upload_folder = os.path.join(app.root_path, 'static', 'uploads')
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    app.config['UPLOAD_FOLDER'] = upload_folder

    # 注册扩展
    db.init_app(app)
    jwt.init_app(app)
    limiter.init_app(app)

    # 注册路由
    register_routes(app)

    # 注册错误处理
    register_error_handlers(app)

    # 注册 CLI 命令
    register_cli_commands(app)

    return app


def register_error_handlers(app):
    @app.errorhandler(Exception)
    def handle_exception(e):
        app.logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request"}), 400

    @app.errorhandler(ValidationError)
    def validation_error(e):
        return jsonify({"error": "Validation failed", "details": e.messages}), 400

    @app.errorhandler(413)
    def request_entity_too_large(e):
        return jsonify({"error": "File too large"}), 413


def register_cli_commands(app):
    import click
    from flask.cli import AppGroup

    db_cli = AppGroup('db')
    admin_cli = AppGroup('admin')

    @db_cli.command("init")
    def init_db_cmd():
        """命令行工具：初始化数据库表并注入默认分类。"""
        db.create_all()
        default_categories = [
            ("frontend", "技术手记"),
            ("topics", "奇怪杂谈"),
            ("novels", "幻想物语")
        ]
        for slug, name in default_categories:
            if not Category.query.filter_by(slug=slug).first():
                new_cat = Category(slug=slug, name=name)
                db.session.add(new_cat)
        db.session.commit()
        print("✅ 数据库基础初始化完成！")

    @db_cli.command("fix")
    def fix_db_cmd():
        """检查并尝试修复表结构（由原来 fix_db.py 迁移而来）"""
        from sqlalchemy import text
        db.create_all()
        inspector = db.session.execute(text("PRAGMA table_info(article)")).fetchall()
        existing_columns = [row[1] for row in inspector]
        if 'collection_id' not in existing_columns:
            db.session.execute(text("ALTER TABLE article ADD COLUMN collection_id INTEGER REFERENCES collection(id)"))
            db.session.commit()
            print("✨ article 表平滑升级成功！旧数据毫发无伤awa！")
        else:
            print("👌 article 表已是最新的结构！")

    @admin_cli.command("create")
    def create_admin():
        """创建管理员账户（由老 app.py 迁移而来）。"""
        db.create_all()
        username = input("请输入管理员用户名 (例如 admin): ")
        password = getpass("请输入密码: ") 
        password2 = getpass("请再次输入密码: ")
        if password != password2:
            print("两次密码不一致！")
            sys.exit(1)
        if User.query.filter_by(username=username).first():
            print(f"用户 '{username}' 已存在。")
            sys.exit(1)
        new_user = User(username=username)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        print(f"管理员 '{username}' 创建成功！")

    @admin_cli.command("reset-pw")
    def reset_pw():
        """重置指定管理员的密码。"""
        username = input("请输入要重置密码的管理员用户名: ")
        user = User.query.filter_by(username=username).first()
        if not user:
            print("❌ 用户不存在！")
            sys.exit(1)
        password = getpass("请输入新密码: ")
        user.set_password(password)
        db.session.commit()
        print("🌟 密码重置成功！")

    app.cli.add_command(db_cli)
    app.cli.add_command(admin_cli)

# --- 生成全局 app 备用 ---
app = create_app()

if __name__ == "__main__":
    is_debug = os.getenv("FLASK_DEBUG", "False").lower() in ["true", "1", "t"]
    run_port = int(os.getenv("FLASK_PORT", 5000))
    app.run(debug=is_debug, port=run_port, host="0.0.0.0")
