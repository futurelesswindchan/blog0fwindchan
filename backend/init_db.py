"""
注意：此脚本会删除 `Article`, `Category`, `Friend`, `Artwork` 以及 `User` 中的所有记录。
在生产环境请谨慎使用；此脚本主要用于从静态 public 文件迁移到数据库的场景。
"""
import os
import json
import shutil  # 用于文件复制
from typing import Any, Dict
from app import app, db, Category, Article, Friend, Artwork
from sqlalchemy import text


# ==========================================
# region 配置项
# ==========================================

# 静态文件根目录 (相对于 backend 目录的路径)
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "public")

# 后端静态资源目录
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

# endregion


# ==========================================
# region 清理旧数据
# ==========================================
def clear_data() -> None:
    """在执行迁移前，清空已有表数据以避免重复导入。"""
    print("🧹 正在清空现有表...")
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
    """将 public 目录下的图片资源复制到 backend/static 目录下。"""
    print("\n🚚 开始迁移静态资源图片...")

    # 需要迁移的子目录
    sub_dirs = ["friends", "artwork"]

    for sub in sub_dirs:
        src_path = os.path.join(PUBLIC_DIR, sub)
        dst_path = os.path.join(STATIC_DIR, sub)

        if os.path.exists(src_path):
            # dirs_exist_ok=True 允许目标目录已存在，会覆盖同名文件
            # 注意：这需要 Python 3.8+
            try:
                shutil.copytree(src_path, dst_path, dirs_exist_ok=True)
                print(f"   -> 已复制目录: {sub}")
            except Exception as e:
                print(f"   ❌ 复制目录 {sub} 失败: {e}")
        else:
            print(f"   ⚠️ 源目录不存在，跳过: {sub}")
    
    # 确保 uploads 目录存在，为后续上传做准备
    uploads_dir = os.path.join(STATIC_DIR, "uploads")
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
        print("   -> 已创建 uploads 目录")

    print("✅ 静态资源迁移完成。")
# endregion


# ==========================================
# region 迁移函数定义 (保持原有逻辑，稍作路径修正)
# ==========================================

def migrate_friends() -> None:
    print("\n📦 开始迁移友链...")
    json_path = os.path.join(PUBLIC_DIR, "friends", "index.json")
    if not os.path.exists(json_path):
        print(f"❌ 文件未找到：{json_path}")
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data: Dict[str, Any] = json.load(f)

        for item in data.get("friends", []):
            # 修正：如果原来的路径是 /friends/xxx.jpg，现在后端托管在 static 下
            # Flask 默认 static 路由就是 /static/xxx
            # 但为了兼容，我们先把路径调整为 /static/friends/... 
            # 或者，前端如果配置了代理，保持原样也可以。
            # 这里为了稳妥，我们假设前端会直接访问 /static/...
            
            avatar = item.get("avatar", "")
            if avatar and avatar.startswith("/friends/"):
                avatar = "/static" + avatar

            friend = Friend(
                name=item.get("name"),
                desc=item.get("desc"),
                url=item.get("url"),
                avatar=avatar, # 使用修正后的路径
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
    json_path = os.path.join(PUBLIC_DIR, "artwork", "index.json")
    if not os.path.exists(json_path):
        print(f"❌ 文件未找到：{json_path}")
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data: Dict[str, Any] = json.load(f)

        for item in data.get("artworks", []):
            # 修正路径
            thumb = item.get("thumbnail", "")
            if thumb and thumb.startswith("/artwork/"):
                thumb = "/static" + thumb
            
            full = item.get("fullsize", "")
            if full and full.startswith("/artwork/"):
                full = "/static" + full

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
    # 映射：分类 slug -> 分类显示名称
    CATEGORY_MAP: Dict[str, str] = {
        "frontend": "技术手记",
        "topics": "奇思妙想",
        "novels": "幻想物语",
        "tools": "工具箱",
    }
    print("\n📦 开始迁移文章与分类...")
    json_path = os.path.join(PUBLIC_DIR, "article", "index.json")
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
                    md_fs_path = os.path.join(PUBLIC_DIR, content_path.lstrip("/"))
                    if os.path.exists(md_fs_path):
                        with open(md_fs_path, "r", encoding="utf-8") as md_file:
                            md_content = md_file.read()

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
    print(f"📂 Public 目录路径：{os.path.abspath(PUBLIC_DIR)}")
    if not os.path.exists(PUBLIC_DIR):
        print("❌ 错误：未找到 public 目录！请检查 PUBLIC_DIR 路径。")
        exit(1)

    with app.app_context():
        print("🔨 正在创建数据库表（如不存在）...")
        db.create_all()

        print("🚀 开始全量迁移...")
        clear_data()       # 1. 清空旧数据
        copy_static_files()# 2. 迁移图片文件
        migrate_friends()  # 3. 迁移友链数据
        migrate_artworks() # 4. 迁移插画数据
        migrate_articles() # 5. 迁移文章数据

        print("\n✨ 迁移全部完成！")
# endregion
