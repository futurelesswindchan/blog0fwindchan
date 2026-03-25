# backend\fix_db.py
from app import app, db

with app.app_context():
    # create_all 只会创建目前数据库里缺失的表，不会覆盖已有数据哦！
    db.create_all()
    print("数据库表结构更新成功！")