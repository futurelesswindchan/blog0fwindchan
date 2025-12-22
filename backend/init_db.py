"""
注意：此脚本会删除 `Article`, `Category`, `Friend`, `Artwork` 以及 `User` 中的所有记录。
主要用于从 legacy_data (原静态文件) 迁移到数据库的场景。
"""
import os
import json
import shutil
from typing import Any, Dict
from app import app, db, Category, Article, Friend, Artwork
from sqlalchemy import text


# ==========================================
# region 配置项
# ==========================================

# 1. 源数据目录：指向 legacy_data 
SOURCE_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend/legacy_data")

# 2. 后端静态资源目录 (目标目录)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# endregion


# ==========================================
# region 清理旧数据
# ==========================================
def clear_data() -> None:
    """在执行迁移前，清空已有表数据以避免重复导入。"""
    print("🧹 正在清空现有表...")
    # SQLite 某些版本需要关闭外键约束才能清空关联表
    db.session.execute(text("PRAGMA foreign_keys=OFF;"))
    db.session.query(Article).delete()
    db.session.query(Category).delete()
    db.session.query(Friend).delete()
    db.session.query(Artwork).delete()
    db.session.commit()
    print("✅ 表已清空。")
# endregion


# ==========================================
# region 静态资源迁移
# ==========================================
def copy_static_files() -> None:
    """将 legacy_data 下的图片资源复制到 backend/static 目录下。"""
    print("\n🚚 开始迁移静态资源图片...")

    # 需要迁移的子目录
    sub_dirs = ["friends", "artwork"]

    for sub in sub_dirs:
        src_path = os.path.join(SOURCE_DIR, sub)
        dst_path = os.path.join(STATIC_DIR, sub)

        if os.path.exists(src_path):
            try:
                # dirs_exist_ok=True 允许覆盖
                shutil.copytree(src_path, dst_path, dirs_exist_ok=True)
                print(f"   -> 已复制目录: {sub} 到 backend/static/{sub}")
            except Exception as e:
                print(f"   ❌ 复制目录 {sub} 失败: {e}")
        else:
            print(f"   ⚠️ 源目录不存在，跳过: {sub}")
    
    # 确保 uploads 目录存在
    uploads_dir = os.path.join(STATIC_DIR, "uploads")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
        print("   -> 已创建 uploads 目录")

    print("✅ 静态资源迁移完成。")
# endregion


# ==========================================
# region 迁移函数定义
# ==========================================

def migrate_friends() -> None:
    print("\n📦 开始迁移友链...")
    json_path = os.path.join(SOURCE_DIR, "friends", "index.json")
    if not os.path.exists(json_path):
        print(f"❌ 文件未找到：{json_path}")
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data: Dict[str, Any] = json.load(f)

        for item in data.get("friends", []):
            avatar = item.get("avatar", "")
            # 路径修正：如果原路径是 /friends/xxx，改为 /static/friends/xxx
            # 这样前端请求 /static/... 时，Nginx 可以直接映射到 backend/static
            if avatar and not avatar.startswith("/static"):
                 # 移除开头的 / (如果有)
                clean_path = avatar.lstrip("/")
                avatar = f"/static/{clean_path}"

            friend = Friend(
                name=item.get("name"),
                desc=item.get("desc"),
                url=item.get("url"),
                avatar=avatar,
                tags=item.get("tags", []),
            )
            db.session.add(friend)
            print(f"   -> 已添加友链：{item.get('name')}")

        db.session.commit()
        print("✅ 友链迁移完成。")
    except Exception as e:
        print(f"❌ 迁移友链时出错：{e}")
        db.session.rollback()


def migrate_artworks() -> None:
    print("\n📦 开始迁移插画...")
    json_path = os.path.join(SOURCE_DIR, "artwork", "index.json")
    if not os.path.exists(json_path):
        print(f"❌ 文件未找到：{json_path}")
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data: Dict[str, Any] = json.load(f)

        for item in data.get("artworks", []):
            thumb = item.get("thumbnail", "")
            full = item.get("fullsize", "")

            # 路径修正
            if thumb and not thumb.startswith("/static"):
                thumb = f"/static/{thumb.lstrip('/')}"
            
            if full and not full.startswith("/static"):
                full = f"/static/{full.lstrip('/')}"

            artwork = Artwork(
                title=item.get("title"),
                thumbnail=thumb,
                fullsize=full,
                description=item.get("description"),
                date=item.get("date"),
            )
            db.session.add(artwork)
            print(f"   -> 已添加插画：{item.get('title')}")

        db.session.commit()
        print("✅ 插画迁移完成。")
    except Exception as e:
        print(f"❌ 迁移插画时出错：{e}")
        db.session.rollback()


def migrate_articles() -> None:
    CATEGORY_MAP: Dict[str, str] = {
        "frontend": "技术手记",
        "topics": "奇思妙想",
        "novels": "幻想物语",
        "tools": "工具箱",
    }
    print("\n📦 开始迁移文章与分类...")
    json_path = os.path.join(SOURCE_DIR, "article", "index.json")
    if not os.path.exists(json_path):
        print(f"❌ 文件未找到：{json_path}")
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data: Dict[str, Any] = json.load(f)

        for category_slug, articles_list in data.items():
            if not isinstance(articles_list, list): continue

            category_name = CATEGORY_MAP.get(category_slug, category_slug.capitalize())
            category = db.session.execute(db.select(Category).filter_by(slug=category_slug)).scalar_one_or_none()

            if not category:
                category = Category(slug=category_slug, name=category_name or "")
                db.session.add(category)
                db.session.commit()
                print(f"   + 创建分类：[{category_name}] ({category_slug})")

            for item in articles_list:
                article_slug = item.get("id")
                content_path = item.get("content")
                md_content = ""

                if content_path:
                    # 读取 markdown 文件
                    md_fs_path = os.path.join(SOURCE_DIR, content_path.lstrip("/"))
                    if os.path.exists(md_fs_path):
                        with open(md_fs_path, "r", encoding="utf-8") as md_file:
                            md_content = md_file.read()
                    else:
                        print(f"     ⚠️ Markdown 文件缺失: {md_fs_path}")

                article = Article(
                    slug=article_slug or "",
                    uid=item.get("uid"),
                    title=item.get("title") or "",
                    date=item.get("date") or "",
                    content=md_content,
                    category_id=category.id,
                )
                db.session.add(article)
                print(f"     -> 已添加文章：{item.get('title')}")

        db.session.commit()
        print("✅ 文章与分类迁移完成。")
    except Exception as e:
        print(f"❌ 迁移文章时出错：{e}")
        db.session.rollback()


# ==========================================
# region 主执行入口
# ==========================================

if __name__ == "__main__":
    print(f"📂 数据源目录 (Legacy Data)：{os.path.abspath(SOURCE_DIR)}")
    if not os.path.exists(SOURCE_DIR):
        print("❌ 错误：未找到 legacy_data 目录！")
        exit(1)

    with app.app_context():
        print("🔨 正在创建数据库表（如不存在）...")
        db.create_all()

        print("🚀 开始全量迁移...")
        clear_data()       
        copy_static_files()
        migrate_friends()  
        migrate_artworks() 
        migrate_articles() 

        print("\n✨ 迁移全部完成！现在 backend/static 目录应包含所有图片资源。")
# endregion
