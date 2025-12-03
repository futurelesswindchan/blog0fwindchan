import os
import uuid
from typing import List, Optional, Dict, Any
from flask import Flask, jsonify, Response, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Integer, Text, ForeignKey, JSON
from datetime import datetime, timedelta
from dotenv import load_dotenv # 用于加载 .env 文件
from werkzeug.security import generate_password_hash, check_password_hash # 用于密码哈希
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required, JWTManager

# 加载 .env 文件里的环境变量
load_dotenv()

# 初始化 Flask App
app = Flask(__name__)

# --- 配置 ---
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///blog.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# --- ✨ JWT 配置 ---
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY') # 从 .env 文件读取密钥
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1) # Access Token 1小时过期
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30) # Refresh Token 30天过期

# 初始化 JWTManager 和 SQLAlchemy
jwt = JWTManager(app)
db = SQLAlchemy(app)

# ==========================================
# 📐 数据库模型设计
# ==========================================

# --- User 模型 ---
class User(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)

    def set_password(self, password):
        """创建哈希密码"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """检查哈希密码"""
        return check_password_hash(self.password_hash, password)

# 1. 文章分类表
class Category(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    articles: Mapped[List["Article"]] = db.relationship(backref='category', lazy=True)

# 2. 文章表
class Article(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    uid: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey('category.id'), nullable=False)
    def to_dict_simple(self) -> Dict[str, Any]:
        return {"id": self.slug, "uid": self.uid, "title": self.title, "date": self.date}

# 3. 友链表
class Friend(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    desc: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    avatar: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    tags: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    def to_dict(self) -> Dict[str, Any]:
        return {"id": str(self.id), "name": self.name, "desc": self.desc, "url": self.url, "avatar": self.avatar, "tags": self.tags}

# 4. 插画/作品表
class Artwork(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    thumbnail: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    fullsize: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    def to_dict(self) -> Dict[str, Any]:
        return {"id": str(self.id), "title": self.title, "thumbnail": self.thumbnail, "fullsize": self.fullsize, "description": self.description, "date": self.date}


# ==========================================
# 🚀 公开 API 接口
# ==========================================
@app.route('/')
def hello() -> str:
    return "Hello! Blog Backend is running."

@app.route('/api/articles/index')
def get_article_index() -> Response:
    data: Dict[str, List[Dict[str, Any]]] = {}
    categories: List[Category] = db.session.execute(db.select(Category)).scalars().all()
    for cat in categories:
        articles: List[Article] = db.session.execute(db.select(Article).filter_by(category_id=cat.id)).scalars().all()
        data[cat.slug] = [a.to_dict_simple() for a in articles]
    return jsonify(data)

@app.route('/api/article/<category_slug>/<article_slug>')
def get_article_content(category_slug: str, article_slug: str) -> Response:
    category = db.session.execute(db.select(Category).filter_by(slug=category_slug)).scalar_one_or_none()
    if not category: return jsonify({"error": "Category not found"}), 404
    article = db.session.execute(db.select(Article).filter_by(slug=article_slug, category_id=category.id)).scalar_one_or_none()
    if not article: return jsonify({"error": "Article not found"}), 404
    return jsonify({"id": article.slug, "title": article.title, "date": article.date, "content": article.content})

@app.route('/api/friends')
def get_friends() -> Response:
    friends = db.session.execute(db.select(Friend)).scalars().all()
    return jsonify({"friends": [f.to_dict() for f in friends]})

@app.route('/api/artworks')
def get_artworks() -> Response:
    works = db.session.execute(db.select(Artwork)).scalars().all()
    return jsonify({"artworks": [w.to_dict() for w in works]})

# ==========================================
# 🔐 认证与管理接口
# ==========================================

# --- 1. 登录接口 ---
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.json or {}
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        # 密码正确，生成 access 和 refresh token
        access_token = create_access_token(identity=str(user.id))  # 要用str(user.id)，不然报错422，Subject must be a string
        refresh_token = create_refresh_token(identity=str(user.id))
        return jsonify(access_token=access_token, refresh_token=refresh_token)
    
    return jsonify({"msg": "错误的用户名或密码"}), 401

# --- 2. Token 刷新接口 ---
@app.route('/api/admin/refresh', methods=['POST'])
@jwt_required(refresh=True) # 这个装饰器表示需要一个 refresh_token
def refresh():
    from flask_jwt_extended import get_jwt_identity
    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify(access_token=new_access_token)

# --- 3. 新增/更新文章 (增加 @jwt_required) ---
@app.route('/api/articles', methods=['POST'])
@jwt_required() # 默认保护，需要 access_token
def save_article():
    data = request.json or {}
    # ... (这个接口的内部逻辑保持不变，但是现在受 JWT 保护了)
    is_new = data.get('isNew', False)
    if not data.get('title') or not data.get('slug') or not data.get('category'):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        category = Category.query.filter_by(slug=data['category']).first()
        if not category: return jsonify({"error": "Invalid category"}), 400

        if is_new:
            if Article.query.filter_by(slug=data['slug']).first():
                return jsonify({"error": "Slug already exists"}), 400
            article = Article( slug=data['slug'], title=data['title'], date=data.get('date', datetime.now().strftime('%Y-%m-%d')), content=data.get('content', ''), category_id=category.id, uid=str(uuid.uuid4())[:8] )
            db.session.add(article)
        else:
            article = Article.query.filter_by(slug=data['slug']).first()
            if not article: return jsonify({"error": "Article not found"}), 404
            article.title, article.date, article.content, article.category_id = data['title'], data.get('date', article.date), data.get('content', ''), category.id
        db.session.commit()
        return jsonify({"message": "Article saved successfully", "id": article.slug})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# --- 4. 删除文章 (增加 @jwt_required) ---
@app.route('/api/articles/<slug>', methods=['DELETE'])
@jwt_required()
def delete_article(slug):
    article = Article.query.filter_by(slug=slug).first()
    if article:
        db.session.delete(article)
        db.session.commit()
        return jsonify({"message": "Deleted"})
    return jsonify({"error": "Not found"}), 404

# ==========================================
# 🛠️ 命令行工具
# ==========================================

# --- 新增: 创建管理员用户的命令行工具 ---
@app.cli.command("create-admin")
def create_admin():
    """创建一个管理员账户"""
    from getpass import getpass
    import sys

    username = input("请输入管理员用户名 (例如 admin): ")
    password = getpass("请输入密码: ") 
    password2 = getpass("请再次输入密码: ")

    if password != password2:
        print("两次密码不一致！")
        sys.exit(1)
        
    user = User.query.filter_by(username=username).first()
    if user:
        print(f"用户 '{username}' 已存在。")
        sys.exit(1)

    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()
    print(f"管理员 '{username}' 创建成功！")

# ... (main 函数保持不变)
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)

