import os
import uuid

from typing import Any, Dict, List, Optional, cast

from datetime import datetime, timedelta

from dotenv import load_dotenv  # 用于加载 .env 文件到环境变量

from flask import Flask, Response, jsonify, make_response, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy

from werkzeug.security import (
    check_password_hash,
    generate_password_hash,
)

from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    jwt_required,
)

from sqlalchemy import JSON, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column


# ==========================================
# region 🌏环境,应用初始化
# ==========================================

# 将项目根目录下的 .env 文件加载到环境变量（如果存在）
load_dotenv()

# 创建 Flask 应用实例
app = Flask(__name__)

# 开启跨域支持（允许来自前端的跨域请求）
CORS(app)

# 配置数据库连接（此处使用 SQLite 文件数据库 blog.db）
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///blog.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# JWT（JSON Web Token）相关配置
# - 密钥从环境变量 `JWT_SECRET_KEY` 读取（建议在生产环境设置该变量）
# - Access Token 过期设置为 1 小时，Refresh Token 过期设置为 30 天
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)

# 配置上传文件夹
# 存放在 backend/static/uploads 下
UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

# 确保上传目录存在
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 初始化扩展：JWT 管理器与 SQLAlchemy ORM
jwt = JWTManager(app)
db = SQLAlchemy(app)

# 辅助函数：检查文件扩展名
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
# endregion


# ==========================================
# region 📐数据库模型设计
# ==========================================


class User(db.Model):
    """
    管理员用户模型（用于后台管理员登录）

    字段说明：
    - id: 自增主键
    - username: 管理员用户名（唯一）
    - password_hash: 存储经过哈希处理的密码（不可逆）
    """

    # 为了防止报类型错误`没有名为“username”的参数`等，我们需要一个 __init__ 方法
    # 虽然 SQLAlchemy 会自动生成构造函数，但显式定义有助于类型检查和代码可读性
    def __init__(self, username: str):
        self.username = username


    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)

    def set_password(self, password: str) -> None:
        """使用 werkzeug 的 `generate_password_hash` 生成密码哈希并保存。"""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        """使用 `check_password_hash` 验证明文密码是否匹配已保存的哈希。"""
        return check_password_hash(self.password_hash, password)


class Category(db.Model):
    """
    文章分类表（例如：frontend、novels、topics 等）

    字段说明：
    - id: 自增主键
    - slug: 分类的短标识（用于路由/URL）
    - name: 分类展示名称
    - articles: 关联的文章列表（SQLAlchemy 关系）
    """

    # 依然是为了防止报类型错误，我们需要一个 __init__ 方法
    # 虽然 SQLAlchemy 会自动生成构造函数，但显式定义有助于类型检查和代码可读性
    def __init__(self, slug: str, name: str):
        self.slug = slug
        self.name = name

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)

    # `articles` 是与 Article 的一对多关系（Article.category_id -> Category.id）
    articles: Mapped[List["Article"]] = cast(
        Mapped[List["Article"]], db.relationship("Article", backref="category", lazy=True)
    )


class Article(db.Model):
    """
    存储文章相关字段的模型。

    字段说明：
    - slug: 文章在 URL/索引中的唯一标识（例如 `how-to-add-color`）
    - uid: 内部短 ID（用于编辑器生成的唯一标识，非必需）
    - title: 文章标题
    - date: 文章日期（字符串形式，例如 '2024-01-01'）
    - content: 文章正文内容（Markdown/HTML 原始文本）
    - category_id: 外键，指向 `Category.id`
    """

    # 依然是为了防止报类型错误，我们需要一个 __init__ 方法
    # 虽然 SQLAlchemy 会自动生成构造函数，但显式定义有助于类型检查和代码可读性
    def __init__(self, slug: str, title: str, date: str, content: Optional[str], category_id: int, uid: Optional[str] = None):
        self.slug = slug
        self.title = title
        self.date = date
        self.content = content
        self.category_id = category_id
        self.uid = uid

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    uid: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"), nullable=False)

    def to_dict_simple(self) -> Dict[str, Any]:
        """简化的字典表示，适用于文章索引展示。"""
        return {"id": self.slug, "uid": self.uid, "title": self.title, "date": self.date}


class Friend(db.Model):
    """
    友链（Friend）模型：用于展示站点友链列表。

    字段说明：
    - id: 自增主键
    - name: 友链名称
    - desc: 友链描述
    - url: 友链网址
    - avatar: 友链头像 URL
    - tags 使用 JSON 字段保存字符串数组（例如 ['dev', 'blog']）
    """

    # 依然是为了防止报类型错误，我们需要一个 __init__ 方法
    # 虽然 SQLAlchemy 会自动生成构造函数，但显式定义有助于类型检查和代码可读性
    def __init__(self, name: str, desc: Optional[str], url: Optional[str], avatar: Optional[str], tags: Optional[List[str]]):
        self.name = name
        self.desc = desc
        self.url = url
        self.avatar = avatar
        self.tags = tags

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    desc: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    avatar: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    tags: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "name": self.name,
            "desc": self.desc,
            "url": self.url,
            "avatar": self.avatar,
            "tags": self.tags,
        }


class Artwork(db.Model):
    """
    插画 / 作品模型，用于前端展示个人插画或作品集。

    字段说明：
    - id: 自增主键
    - title: 作品标题
    - thumbnail: 缩略图 URL
    - fullsize: 全尺寸图片 URL
    - description: 作品描述
    - date: 作品创作日期（字符串形式）
    """

    # 依然是为了防止报类型错误，我们需要一个 __init__ 方法
    # 虽然 SQLAlchemy 会自动生成构造函数，但显式定义有助于类型检查和代码可读性
    def __init__(self, title: Optional[str], thumbnail: Optional[str], fullsize: Optional[str], description: Optional[str], date: Optional[str]):
        self.title = title
        self.thumbnail = thumbnail
        self.fullsize = fullsize
        self.description = description
        self.date = date

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    thumbnail: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    fullsize: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    date: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": str(self.id),
            "title": self.title,
            "thumbnail": self.thumbnail,
            "fullsize": self.fullsize,
            "description": self.description,
            "date": self.date,
        }
# endregion 


# ==========================================
# region 📤文件上传接口
# ==========================================

@app.route("/api/upload", methods=["POST"])
@jwt_required()
def upload_file():
    """
    通用文件上传接口。
    - file: 文件对象
    - type: (可选) 上传类型，支持 'article' | 'artwork' | 'friend'
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    # 获取上传类型，默认为 'misc' (杂项)
    upload_type = request.form.get('type', 'misc')

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        # 1. 确定存储子目录
        # 为了安全，只允许特定的子目录名
        allowed_types = {'article', 'artwork', 'friend', 'misc'}
        if upload_type not in allowed_types:
            upload_type = 'misc'
            
        # 2. 构建保存路径: static/uploads/<type>/
        save_dir = os.path.join(app.config['UPLOAD_FOLDER'], upload_type)
        
        # 确保目录存在
        if not os.path.exists(save_dir):
            os.makedirs(save_dir)

        # 3. 生成文件名
        if file.filename is not None:
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{uuid.uuid4().hex}.{ext}"
        
            # 4. 保存文件
            save_path = os.path.join(save_dir, filename)
            file.save(save_path)
    
            # 5. 返回 URL
            # URL 格式: /static/uploads/<type>/<filename>
            url = f"/static/uploads/{upload_type}/{filename}"
    
            return jsonify({"message": "Upload successful", "url": url})
        else:
            return jsonify({"message": "Upload failed, filename is none."})
    
    return jsonify({"error": "File type not allowed"}), 400

# endregion


# ==========================================
# region 🚀公开 API 接口
# ==========================================

@app.route("/")
def hello() -> str:
    """基础健康检查路由：用于确认后端服务运行中。"""
    return "Hello! Blog Backend is running."


@app.route("/api/articles/index")
def get_article_index() -> Response:
    """
    获取文章索引：按分类返回文章的简化信息（slug/title/date/uid）。

    返回结构示例：
    {
        "frontend": [{"id": "xxx", "title": "...", "date": "..."}, ...],
        "novels": [...]
    }
    """

    data: Dict[str, List[Dict[str, Any]]] = {}

    # 查询所有分类
    categories: List[Category] = cast(
        List[Category], db.session.execute(db.select(Category)).scalars().all()
    )

    # 对每个分类查询该分类下所有文章并转换为简化字典
    for cat in categories:
        articles: List[Article] = cast(
            List[Article],
            db.session.execute(db.select(Article).filter_by(category_id=cat.id)).scalars().all(),
        )

        data[cat.slug] = [a.to_dict_simple() for a in articles]

    return jsonify(data)


@app.route("/api/article/<category_slug>/<article_slug>")
def get_article_content(category_slug: str, article_slug: str) -> Response:
    """
    获取指定分类下的文章内容。

    - `category_slug`: 分类标识（URL 中的部分）
    - `article_slug`: 文章标识（URL 中的部分）
    """

    category = (
        db.session.execute(db.select(Category).filter_by(slug=category_slug)).scalar_one_or_none()
    )

    if not category:
        return make_response(jsonify({"error": "Category not found"}), 404)

    article = (
        db.session.execute(
            db.select(Article).filter_by(slug=article_slug, category_id=category.id)
        ).scalar_one_or_none()
    )

    if not article:
        return make_response(jsonify({"error": "Article not found"}), 404)

    return jsonify(
        {
            "id": article.slug,
            "title": article.title,
            "date": article.date,
            "content": article.content,
        }
    )


@app.route("/api/friends")
def get_friends() -> Response:
    """返回站点友链列表（friends）。"""

    friends = db.session.execute(db.select(Friend)).scalars().all()
    return jsonify({"friends": [f.to_dict() for f in friends]})


@app.route("/api/artworks")
def get_artworks() -> Response:
    """返回插画 / 作品集。"""

    works = db.session.execute(db.select(Artwork)).scalars().all()
    return jsonify({"artworks": [w.to_dict() for w in works]})
# endregion


# ==========================================
# region 🔐认证与管理接口
# ==========================================

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    """
    管理员登录接口：验证用户名与密码，成功则返回 `access_token` 和 `refresh_token`。
    - 请求体 JSON 需包含 `username` 和 `password`。
    """

    data = request.json or {}
    username = data.get("username")
    password = data.get("password")

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        # 注意：flask-jwt-extended 的 identity 建议使用字符串，所以这里使用 str(user.id)，不然报错422咧awa
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return jsonify(access_token=access_token, refresh_token=refresh_token)

    return jsonify({"msg": "错误的用户名或密码"}), 401


@app.route("/api/admin/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """
    使用 refresh_token 刷新并返回新的 access_token。
    该接口受 `@jwt_required(refresh=True)` 保护，客户端需在 Authorization 标头中提供 refresh token。
    """

    from flask_jwt_extended import get_jwt_identity

    current_user_id = get_jwt_identity()
    new_access_token = create_access_token(identity=current_user_id)

    return jsonify(access_token=new_access_token)
# endregion


# ==========================================
# region 🛠️命令行工具
# ==========================================

@app.cli.command("create-admin")
def create_admin():
    """命令行工具：创建管理员账户。"""
    
    # --- 注意这里啦！ ---
    # 在执行任何数据库操作之前，先确保所有表都已创建。
    # 这让 create-admin 命令变得自给自足，不再依赖于是否先运行了 python app.py
    print("确保数据库表已创建...")
    db.create_all()
    print("完成。")

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


# ==========================================
# region ✒️文章管理接口
# ==========================================

@app.route("/api/articles", methods=["POST"])
@jwt_required()
def save_article():
    """
    新增或更新文章（需要 access_token）。

    请求体 JSON 字段（常见）：
    - isNew: 是否为新建文章（True/False）
    - slug, title, category: 必填字段
    - date, content: 可选
    """

    data = request.json or {}
    is_new = data.get("isNew", False)

    # 初始化默认分类数据
    init_default_data()

    # 必填校验
    if not data.get("title") or not data.get("slug") or not data.get("category"):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # 根据前端传入的 category slug 查询分类
        category = Category.query.filter_by(slug=data["category"]).first()
        if not category:
            return jsonify({"error": "Invalid category"}), 400

        if is_new:
            # 新增文章，先检查 slug 是否重复
            if Article.query.filter_by(slug=data["slug"]).first():
                return jsonify({"error": "Slug already exists"}), 400

            article = Article(
                slug=data["slug"],
                title=data["title"],
                date=data.get("date", datetime.now().strftime("%Y-%m-%d")),
                content=data.get("content", ""),
                category_id=category.id,
                uid=str(uuid.uuid4())[:8],
            )

            db.session.add(article)

        else:
            # 更新已有文章
            article = Article.query.filter_by(slug=data["slug"]).first()
            if not article:
                return jsonify({"error": "Article not found"}), 404

            article.title = data["title"]
            article.date = data.get("date", article.date)
            article.content = data.get("content", "")
            article.category_id = category.id

        db.session.commit()

        return jsonify({"message": "Article saved successfully", "id": article.slug})

    except Exception as e:
        # 出错时回滚事务并返回 500
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/api/articles/<slug>", methods=["DELETE"])
@jwt_required()
def delete_article(slug: str):
    """删除文章（需要 access_token）。"""

    article = Article.query.filter_by(slug=slug).first()
    if article:
        db.session.delete(article)
        db.session.commit()
        return jsonify({"message": "Deleted"})

    return jsonify({"error": "Not found"}), 404


@app.route("/api/admin/assets", methods=["GET"])
@jwt_required()
def get_article_assets():
    """
    获取文章专用素材库图片列表。
    扫描 static/uploads/article 目录下的所有图片，按修改时间倒序排列。
    """
    # 目标目录
    assets_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'article')
    
    # 如果目录不存在，返回空列表
    if not os.path.exists(assets_dir):
        return jsonify({"assets": []})
        
    assets = []
    
    # 遍历目录
    with os.scandir(assets_dir) as entries:
        for entry in entries:
            if entry.is_file() and allowed_file(entry.name):
                # 获取文件修改时间戳
                mtime = entry.stat().st_mtime
                # 构造 URL
                url = f"/static/uploads/article/{entry.name}"
                
                assets.append({
                    "name": entry.name,
                    "url": url,
                    "mtime": mtime,
                    # 格式化时间方便前端展示 (可选)
                    "date": datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M')
                })
    
    # 按时间倒序排序 (最新的在前面)
    assets.sort(key=lambda x: x['mtime'], reverse=True)
    
    return jsonify({"assets": assets})


@app.route("/api/admin/assets", methods=["DELETE"])
@jwt_required()
def delete_article_asset():
    """
    删除文章素材库中的图片。
    参数: filename (URL query param)
    """
    filename = request.args.get('filename')
    if not filename:
        return jsonify({"error": "Filename required"}), 400
    
    # 安全检查：只取文件名部分，防止目录遍历攻击 (../../)
    safe_filename = os.path.basename(filename)
    
    # 目标路径
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'article', safe_filename)
    
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            return jsonify({"message": "File deleted"})
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    return jsonify({"error": "File not found"}), 404

# endregion


# ==========================================
# region 🤝友链管理接口
# ==========================================

@app.route("/api/friends", methods=["POST"])
@jwt_required()
def add_friend():
    """添加友链（需要 access_token）。"""
    data = request.json or {}
    if not data.get("name") or not data.get("url"):
        return jsonify({"error": "Name and URL are required"}), 400
    
    new_friend = Friend(
        name=data["name"],
        desc=data.get("desc", ""),
        url=data["url"],
        avatar=data.get("avatar", ""),
        tags=data.get("tags", []) # 前端传数组过来
    )
    db.session.add(new_friend)
    db.session.commit()
    return jsonify({"message": "Friend added", "friend": new_friend.to_dict()})


@app.route("/api/friends/<int:id>", methods=["PUT"])
@jwt_required()
def update_friend(id):
    """更新友链（需要 access_token）。"""
    data = request.json or {}
    friend = db.session.get(Friend, id)
    if not friend:
        return jsonify({"error": "Friend not found"}), 404
    
    friend.name = data.get("name", friend.name)
    friend.desc = data.get("desc", friend.desc)
    friend.url = data.get("url", friend.url)
    friend.avatar = data.get("avatar", friend.avatar)
    friend.tags = data.get("tags", friend.tags)
    
    db.session.commit()
    return jsonify({"message": "Friend updated", "friend": friend.to_dict()})


@app.route("/api/friends/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_friend(id):
    """删除友链（需要 access_token）。"""
    friend = db.session.get(Friend, id)
    if not friend:
        return jsonify({"error": "Friend not found"}), 404
    
    db.session.delete(friend)
    db.session.commit()
    return jsonify({"message": "Friend deleted"})
# endregion


# ==========================================
# region 🎨画廊管理接口
# ==========================================

@app.route("/api/artworks", methods=["POST"])
@jwt_required()
def add_artwork():
    """添加插画 / 作品（需要 access_token）。"""
    data = request.json or {}
    # 假设目前图片是填 URL 的形式
    if not data.get("thumbnail") or not data.get("fullsize"):
        return jsonify({"error": "Images are required"}), 400
        
    new_work = Artwork(
        title=data.get("title", "Untitled"),
        thumbnail=data["thumbnail"],
        fullsize=data["fullsize"],
        description=data.get("description", ""),
        date=data.get("date", datetime.now().strftime("%Y-%m-%d"))
    )
    db.session.add(new_work)
    db.session.commit()
    return jsonify({"message": "Artwork added", "artwork": new_work.to_dict()})


@app.route("/api/artworks/<int:id>", methods=["PUT"])
@jwt_required()
def update_artwork(id):
    """更新插画 / 作品（需要 access_token）。"""
    data = request.json or {}
    work = db.session.get(Artwork, id)
    if not work:
        return jsonify({"error": "Artwork not found"}), 404
        
    work.title = data.get("title", work.title)
    work.thumbnail = data.get("thumbnail", work.thumbnail)
    work.fullsize = data.get("fullsize", work.fullsize)
    work.description = data.get("description", work.description)
    work.date = data.get("date", work.date)
    
    db.session.commit()
    return jsonify({"message": "Artwork updated", "artwork": work.to_dict()})


@app.route("/api/artworks/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_artwork(id):
    """删除插画 / 作品（需要 access_token）。"""
    work = db.session.get(Artwork, id)
    if not work:
        return jsonify({"error": "Artwork not found"}), 404
        
    db.session.delete(work)
    db.session.commit()
    return jsonify({"message": "Artwork deleted"})
# endregion

# ==========================================
# region 🏁 启动逻辑与数据初始化
# ==========================================

def init_default_data():
    """初始化默认数据：确保分类存在"""
    # 这里定义博客需要的默认文章分类
    default_categories = [
        ("frontend", "技术手记"),
        ("topics", "奇怪杂谈"),
        ("novels", "幻想物语")
    ]
    
    for slug, name in default_categories:
        # 检查分类是否已存在
        cat = Category.query.filter_by(slug=slug).first()
        if not cat:
            print(f"🛠️ 正在初始化缺失的分类: {name} ({slug})...")
            new_cat = Category(slug=slug, name=name)
            db.session.add(new_cat)
    
    db.session.commit()

if __name__ == "__main__":
    with app.app_context():
        # 1. 创建表结构
        db.create_all()
        # 2. 初始化默认分类数据
        init_default_data()
        
    app.run(debug=True, port=5000)
