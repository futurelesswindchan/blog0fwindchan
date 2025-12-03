import os
import json
from app import app, db, Category, Article, Friend, Artwork
from sqlalchemy import text

# ==========================================
# 配置项
# ==========================================

# 静态文件根目录 (相对于 backend 目录的路径)
# 如果目录结构是 project/backend 和 project/public
# 那么 PUBLIC_DIR 就应该是 ../public
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')

# ==========================================
# 🧹 清理旧数据
# ==========================================
def clear_data():
    """执行迁移前，先清空现有表，防止重复数据"""
    print("🧹 Clearing existing tables...")
    # 关闭外键约束以允许随意删除
    db.session.execute(text('PRAGMA foreign_keys=OFF;'))
    
    db.session.query(Article).delete()
    db.session.query(Category).delete()
    db.session.query(Friend).delete()
    db.session.query(Artwork).delete()
    
    db.session.commit()
    print("✅ Tables cleared.")

# ==========================================
# 迁移函数定义
# ==========================================

def migrate_friends():
    """迁移友链数据"""
    print("\n📦 Migrating Friends...")
    json_path = os.path.join(PUBLIC_DIR, 'friends', 'index.json')
    
    if not os.path.exists(json_path):
        print(f"❌ File not found: {json_path}")
        return

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for item in data.get('friends', []):
            friend = Friend(
                # id 是默认自增的主键，不需要手动设置
                name=item.get('name'),
                desc=item.get('desc'),
                url=item.get('url'),
                avatar=item.get('avatar'),
                tags=item.get('tags', [])  # 直接存 list，JSON 类型会自动处理
            )
            db.session.add(friend)
            print(f"   -> Added friend: {item.get('name')}")
            
        db.session.commit()
        print("✅ Friends migration complete.")
        
    except Exception as e:
        print(f"❌ Error during friends migration: {e}")
        db.session.rollback()

def migrate_artworks():
    """迁移插画数据"""
    print("\n📦 Migrating Artworks...")
    json_path = os.path.join(PUBLIC_DIR, 'artwork', 'index.json')
    
    if not os.path.exists(json_path):
        print(f"❌ File not found: {json_path}")
        return

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for item in data.get('artworks', []):
            artwork = Artwork(
                title=item.get('title'),
                thumbnail=item.get('thumbnail'),
                fullsize=item.get('fullsize'),
                description=item.get('description'),
                date=item.get('date')
            )
            db.session.add(artwork)
            print(f"   -> Added artwork: {item.get('title')}")
            
        db.session.commit()
        print("✅ Artworks migration complete.")
        
    except Exception as e:
        print(f"❌ Error during artworks migration: {e}")
        db.session.rollback()

def migrate_articles():
    """迁移文章和分类数据"""
    # ⚠️ 这里有一个重要映射:
    # JSON 中的 key (如 "frontend") -> Category 去
    # JSON 中的 "title" (如 "技术手记") -> Category 的 name
    # 需要在这里手动定义一个映射关系
    
    CATEGORY_MAP = {
        'frontend': '技术手记',
        'topics': '奇思妙想',
        'novels': '幻想物语',
        'tools': '工具箱' # 如果有的话
        # ... 在这里添加其他分类的映射
    }

    print("\n📦 Migrating Articles & Categories...")
    json_path = os.path.join(PUBLIC_DIR, 'article', 'index.json')
    
    if not os.path.exists(json_path):
        print(f"❌ File not found: {json_path}")
        return

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # 遍历 JSON 的顶层 keys (即分类 slug)
        for category_slug, articles_list in data.items():
            if not isinstance(articles_list, list):
                continue
                
            # 1. 创建或获取分类 (Category)
            category_name = CATEGORY_MAP.get(category_slug, category_slug.capitalize())
            
            category = db.session.execute(
                db.select(Category).filter_by(slug=category_slug)
            ).scalar_one_or_none()
            
            if not category:
                category = Category(slug=category_slug, name=category_name)
                db.session.add(category)
                db.session.commit() # 先提交以获取 category.id
                print(f"   + Created Category: [{category_name}] ({category_slug})")
            else:
                print(f"   = Found Category: [{category_name}] ({category_slug})")

            # 2. 遍历该分类下的文章 (Article)
            for item in articles_list:
                article_slug = item.get('id')      # JSON 里的 "id" 对应我们的 slug
                article_uid = item.get('uid')
                article_title = item.get('title')
                article_date = item.get('date')
                content_path = item.get('content') # 例如 "/article/frontend/filename.md"

                # 读取 Markdown 文件内容
                # 注意 content_path 开头有 /，需要去掉才能用 os.path.join
                md_fs_path = os.path.join(PUBLIC_DIR, content_path.lstrip('/'))
                
                md_content = ""
                if os.path.exists(md_fs_path):
                    with open(md_fs_path, 'r', encoding='utf-8') as md_file:
                        md_content = md_file.read()
                else:
                    print(f"     ⚠️ Markdown file not found: {md_fs_path}")
                    # 可以根据需要在这里决定是否跳过该文章，或者插入空内容

                # 创建文章对象
                article = Article(
                    slug=article_slug,
                    uid=article_uid,
                    title=article_title,
                    date=article_date,
                    content=md_content, # 存入读取到的 Markdown 内容
                    category=category   # 关联前面创建的分类对象
                )
                db.session.add(article)
                print(f"     -> Added Article: {article_title} (Length: {len(md_content)})")

        db.session.commit()
        print("✅ Articles & Categories migration complete.")
        
    except Exception as e:
        print(f"❌ Error during articles migration: {e}")
        print(f"   Path was: {json_path if 'json_path' in locals() else 'unknown'}")
        db.session.rollback()


# ==========================================
# 主执行入口
# ==========================================

if __name__ == '__main__':
    # 检查路径是否正确
    print(f"📂 Public directory path set to: {os.path.abspath(PUBLIC_DIR)}")
    if not os.path.exists(PUBLIC_DIR):
        print("❌ ERROR: Public directory not found! Please check the PUBLIC_DIR path.")
        exit(1)

    with app.app_context():
        # 🟢 【新增】确保数据库表结构已创建
        print("🔨 Creating database tables if not exist...")
        db.create_all() 

        print("🚀 Starting database migration...")
        clear_data()      # 1. 清空旧数据
        migrate_friends() # 2. 迁移友链
        migrate_artworks()# 3. 迁移插画
        migrate_articles()# 4. 迁移文章
        print("\n✨ All migrations finished successfully!")

