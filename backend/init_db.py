"""
注意：此脚本会删除 `Article`, `Category`, `Friend`, `Artwork` 中的所有记录。
在生产环境请谨慎使用；此脚本主要用于从静态 public 文件迁移到数据库的场景。
"""
import os
import json
from typing import Any, Dict, Optional
from app import app, db, Category, Article, Friend, Artwork
from sqlalchemy import text


# ==========================================
# 配置项
# ==========================================

# 静态文件根目录 (相对于 backend 目录的路径)
# 如果目录结构是 project/backend 和 project/public
# 那么 PUBLIC_DIR 就应该是 ../public
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "public")


# ==========================================
# 🧹 清理旧数据
# ==========================================
def clear_data() -> None:
    """在执行迁移前，清空已有表数据以避免重复导入。

    注意：此函数会删除 `Article`, `Category`, `Friend`, `Artwork` 中的所有记录。
    在生产环境请谨慎使用；此脚本主要用于从静态 public 文件迁移到数据库的场景。
    """

    print("🧹 正在清空现有表...")

    # 关闭 SQLite 外键约束以便安全删除所有记录
    db.session.execute(text("PRAGMA foreign_keys=OFF;"))

    db.session.query(Article).delete()
    db.session.query(Category).delete()
    db.session.query(Friend).delete()
    db.session.query(Artwork).delete()

    db.session.commit()

    print("✅ 表已清空。")


# ==========================================
# 迁移函数定义
# ==========================================


def migrate_friends() -> None:
    """从 `public/friends/index.json` 读取友链数据并写入数据库。"""

    print("\n📦 开始迁移友链...")

    json_path = os.path.join(PUBLIC_DIR, "friends", "index.json")

    if not os.path.exists(json_path):
        print(f"❌ 文件未找到：{json_path}")
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data: Dict[str, Any] = json.load(f)

        for item in data.get("friends", []):
            friend = Friend(
                # id 是自增主键，由数据库自动分配
                name=item.get("name"),
                desc=item.get("desc"),
                url=item.get("url"),
                avatar=item.get("avatar"),
                tags=item.get("tags", []),  # JSON 列会保存列表
            )

            db.session.add(friend)
            print(f"   -> 已添加友链：{item.get('name')}")

        db.session.commit()
        print("✅ 友链迁移完成。")

    except Exception as e:  # 捕获迁移过程中任意异常并回滚
        print(f"❌ 迁移友链时出错：{e}")
        db.session.rollback()


def migrate_artworks() -> None:
    """从 `public/artwork/index.json` 读取插画/作品数据并写入数据库。"""

    print("\n📦 开始迁移插画...")

    json_path = os.path.join(PUBLIC_DIR, "artwork", "index.json")

    if not os.path.exists(json_path):
        print(f"❌ 文件未找到：{json_path}")
        return

    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data: Dict[str, Any] = json.load(f)

        for item in data.get("artworks", []):
            artwork = Artwork(
                title=item.get("title"),
                thumbnail=item.get("thumbnail"),
                fullsize=item.get("fullsize"),
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
    """迁移文章与分类。

    说明：
    - public/article/index.json 的格式为顶层 key 为分类 slug，value 为文章列表。
    - 需将分类 slug 映射为展示名称（可通过 CATEGORY_MAP 自定义）。
    """

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

        # 遍历 JSON 的顶层 keys（即分类 slug）
        for category_slug, articles_list in data.items():
            if not isinstance(articles_list, list):
                continue

            # 1) 创建或获取分类（Category）
            category_name = CATEGORY_MAP.get(category_slug, category_slug.capitalize())

            category = (
                db.session.execute(db.select(Category).filter_by(slug=category_slug)).scalar_one_or_none()
            )

            if not category:
                category = Category(slug=category_slug, name=category_name or "")
                db.session.add(category)
                # 提交以便获取 category.id（用于外键关联）
                db.session.commit()
                print(f"   + 创建分类：[{category_name}] ({category_slug})")
            else:
                print(f"   = 已存在分类：[{category_name}] ({category_slug})")

            # 2) 遍历该分类下的文章（Article）并导入
            for item in articles_list:
                # 接收可能为 None 的字段，为避免类型错误，在构造 Article 前提供合理的默认值
                article_slug: Optional[str] = item.get("id")
                article_uid: Optional[str] = item.get("uid")
                article_title: Optional[str] = item.get("title")
                article_date: Optional[str] = item.get("date")
                content_path: Optional[str] = item.get("content")  # 例："/article/frontend/filename.md"

                # 读取 Markdown 文件内容（若 content_path 缺失或文件不存在，则使用空字符串）
                md_content = ""

                if content_path:
                    md_fs_path = os.path.join(PUBLIC_DIR, content_path.lstrip("/"))
                    if os.path.exists(md_fs_path):
                        with open(md_fs_path, "r", encoding="utf-8") as md_file:
                            md_content = md_file.read()
                    else:
                        print(f"     ⚠️ 未找到 Markdown 文件：{md_fs_path}")


                # 若关键字段缺失，使用空字符串作为回退值并输出警告（避免静态类型检查错误）
                if not article_slug:
                    print(f"     ⚠️ 文章缺少 slug，分类 {category_slug}：title={article_title}")
                if not article_title:
                    print(f"     ⚠️ 文章缺少标题，slug={article_slug}")
                if not article_date:
                    print(f"     ⚠️ 文章缺少日期，slug={article_slug}")

                # 创建文章对象并保存（确保传入 str 类型）
                article = Article(
                    slug=article_slug or "",
                    uid=article_uid,
                    title=article_title or "",
                    date=article_date or "",
                    content=md_content,
                    category_id=category.id,
                )

                db.session.add(article)
                print(f"     -> 已添加文章：{article_title}（长度：{len(md_content)}）")

        db.session.commit()
        print("✅ 文章与分类迁移完成。")

    except Exception as e:
        print(f"❌ 迁移文章时出错：{e}")
        print(f"   路径为：{json_path if 'json_path' in locals() else 'unknown'}")
        db.session.rollback()


# ==========================================
# 主执行入口
# ==========================================


if __name__ == "__main__":
    # 检查 public 目录是否存在
    print(f"📂 Public 目录路径：{os.path.abspath(PUBLIC_DIR)}")
    if not os.path.exists(PUBLIC_DIR):
        print("❌ 错误：未找到 public 目录！请检查 PUBLIC_DIR 路径。")
        exit(1)

    with app.app_context():
        # 确保数据库表已创建
        print("🔨 正在创建数据库表（如不存在）...")
        db.create_all()

        print("🚀 开始数据库迁移...")
        clear_data()       # 1. 清空旧数据
        migrate_friends()  # 2. 迁移友链
        migrate_artworks() # 3. 迁移插画
        migrate_articles() # 4. 迁移文章

        print("\n✨ 迁移全部完成！")

