import os
from flask_sqlalchemy import SQLAlchemy
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager

# 数据库实例
db = SQLAlchemy()

# JWT 实例
jwt = JWTManager()

# 限流器实例
# 针对只读接口放开，用全局 5000/hour 作为底线兜底
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["50000 per day", "5000 per hour"],
    storage_uri="memory://"
)
