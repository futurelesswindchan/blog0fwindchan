from typing import Any, Dict, List, Optional, cast
from datetime import datetime

from sqlalchemy import JSON, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db

class User(db.Model):
    """管理员用户模型"""
    def __init__(self, username: str):
        self.username = username

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class Category(db.Model):
    """文章分类表"""
    def __init__(self, slug: str, name: str):
        self.slug = slug
        self.name = name

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)

    articles: Mapped[List["Article"]] = cast(
        Mapped[List["Article"]], db.relationship("Article", backref="category", lazy=True)
    )


class Collection(db.Model):
    """连载合集模型"""
    def __init__(self, slug: str, name: str, category_id: int, description: Optional[str] = None):
        self.slug = slug
        self.name = name
        self.category_id = category_id
        self.description = description

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"), nullable=False)
    articles: Mapped[List["Article"]] = cast(
        Mapped[List["Article"]], db.relationship("Article", backref="collection", lazy=True, order_by="Article.date.asc()")
    )

    def to_dict_simple(self) -> Dict[str, Any]:
        return {
            "id": self.slug, 
            "name": self.name, 
            "description": self.description,
            "article_count": len(self.articles)
        }


class Article(db.Model):
    """文章模型"""
    def __init__(self, slug: str, title: str, date: str, content: Optional[str], category_id: int, uid: Optional[str] = None, collection_id: Optional[int] = None):
        self.slug = slug
        self.title = title
        self.date = date
        self.content = content
        self.category_id = category_id
        self.uid = uid
        self.collection_id = collection_id

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    uid: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"), nullable=False)
    collection_id: Mapped[Optional[int]] = mapped_column(ForeignKey("collection.id"), nullable=True)

    def to_dict_simple(self) -> Dict[str, Any]:
        return {
            "id": self.slug,
            "uid": self.uid,
            "title": self.title,
            "date": self.date,
            "collection_id": self.collection_id
        }


class Friend(db.Model):
    """友链模型"""
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
    
class Sponsor(db.Model):
    """投喂感谢模型"""
    def __init__(self, name: str, avatar: Optional[str] = None, url: Optional[str] = None, message: Optional[str] = None, date: Optional[str] = None):
        self.name = name
        self.avatar = avatar
        self.url = url
        self.message = message
        self.date = date or datetime.now().strftime("%Y-%m-%d")

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    date: Mapped[Optional[str]] = mapped_column(String(20), nullable=False)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "avatar": self.avatar,
            "url": self.url,
            "message": self.message,
            "date": self.date
        }

class Artwork(db.Model):
    """画廊作品模型"""
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
    
class Contribution(db.Model):
    """每日贡献度（活跃度）模型"""
    def __init__(self, date: str, count: int = 1):
        self.date = date
        self.count = count

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    date: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    count: Mapped[int] = mapped_column(Integer, default=0)

    def to_dict(self) -> Dict[str, Any]:
        return {"date": self.date, "count": self.count}

class Plan(db.Model):
    """近期计划 / 待办模型"""
    def __init__(self, content: str, status: str = 'todo', sort_order: int = 0):
        self.content = content
        self.status = status
        self.sort_order = sort_order
        self.update_date = datetime.now().strftime("%Y-%m-%d")

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    content: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default='todo')
    update_date: Mapped[str] = mapped_column(String(20), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "content": self.content,
            "status": self.status,
            "update_date": self.update_date,
            "sort_order": self.sort_order
        }
