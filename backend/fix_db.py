# backend\fix_db.py
from app import app, db
from sqlalchemy import text

with app.app_context():
    db.create_all()
    print("✅ 缺失的新数据表检查/创建完成！")

    inspector = db.session.execute(text("PRAGMA table_info(article)")).fetchall()
    
    # 提取所有的列名（在返回的元组中，索引 1 的位置是列名）
    existing_columns = [row[1] for row in inspector]

    if 'collection_id' not in existing_columns:
        print("🛠️ 发现 article 表缺少 collection_id 列，正在进行无损平滑升级...")
        try:
            db.session.execute(
                text("ALTER TABLE article ADD COLUMN collection_id INTEGER REFERENCES collection(id)")
            )
            db.session.commit()
            print("✨ article 表无损升级成功！旧数据毫发无伤awa！")
        except Exception as e:
            db.session.rollback()
            print(f"❌ 升级遇到了小麻烦: {e}")
    else:
        print("👌 article 表已经包含 collection_id，是最新的啦，无需修改！")

    print("🎉 数据库结构平滑升级脚本执行完毕！")