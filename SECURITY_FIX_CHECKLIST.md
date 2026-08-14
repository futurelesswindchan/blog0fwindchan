# 🚀 安全修复执行清单

> **快速参考**：按优先级逐项修复，每项完成后打勾 ✅

---

## ✅ 已完成

- [x] **C1 - JWT 密钥强制校验** (`app.py:70-93`)
  - 启动时检查 JWT_SECRET_KEY 是否存在
  - 检查密钥长度 >= 32 字符
  - 未通过时退出并提示生成方法

---

## 🔴 Critical - 本周内必修

### C2. 文件上传加固 ⏰ 预计 45 分钟

**安装依赖**
```bash
cd backend
pip install python-magic-bin  # Windows
# 或 pip install python-magic  # Linux/macOS
```

**修改文件**
1. 📝 `backend/app.py` 约 92 行 - 替换 `allowed_file` 函数
   - 参考：`SECURITY_AUDIT_REPORT.md` 第 92 行
   - 添加：MIME 类型检查、文件大小限制、魔数验证

2. 📝 `backend/app.py` 约 447 行 - 修改 `/api/upload` 路由
   - 参考：`SECURITY_AUDIT_REPORT.md` 第 150 行
   - 添加：限流装饰器、三重校验、路径穿越防护

3. 🔧 Nginx 配置（可选但推荐）
   ```nginx
   location /static/uploads/ {
       location ~ \.(php|py|sh|exe|dll)$ {
           deny all;
       }
   }
   ```

**验证**
```bash
# 尝试上传非图片文件，应被拒绝
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.txt"
```

---

## 🟡 Medium - 下周完成

### M1. 添加输入校验 ⏰ 预计 3 小时

**安装依赖**
```bash
pip install marshmallow
```

**修改文件**
1. 📝 `backend/app.py` 约 30 行 - 添加 Schema 定义
   - 复制：`SECURITY_AUDIT_REPORT.md` 第 502-565 行
   - 包含：ArticleSchema, FriendSchema, ArtworkSchema 等

2. 📝 修改 8 个路由（每个约 5 分钟）
   - `/api/articles` POST (L769)
   - `/api/admin/login` POST (L681)
   - `/api/admin/collections` POST (L947)
   - `/api/friends` POST (L1013)
   - `/api/artworks/<int:id>` PUT (L1092)
   - `/api/admin/plans/<int:id>` PUT (L1180)
   - `/api/sponsors/<int:id>` PUT (L1279)
   - `/api/admin/plans/reorder` PUT (L1212)

**示例代码**
```python
@app.route("/api/articles", methods=["POST"])
@jwt_required()
@limiter.limit("30 per minute")
def save_article():
    schema = ArticleSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return jsonify({"error": "Validation failed", "details": err.messages}), 400
    # ... 原有逻辑
```

---

### M2. 添加限流保护 ⏰ 预计 1 小时

**修改文件**
📝 `backend/app.py` - 为以下路由添加 `@limiter.limit()` 装饰器

**公开接口（宽松）**
```python
@app.route("/api/articles/index")
@limiter.limit("120 per minute")
def get_article_index():

@app.route("/api/article/<category_slug>/<article_slug>")
@limiter.limit("60 per minute")
def get_article_content():

@app.route("/api/collection/<collection_slug>")
@limiter.limit("60 per minute")
def get_collection_detail():
```

**管理接口（中等）**
```python
@app.route("/api/articles", methods=["POST"])
@limiter.limit("30 per minute")

@app.route("/api/friends", methods=["POST"])
@limiter.limit("20 per minute")

@app.route("/api/admin/collections", methods=["POST"])
@limiter.limit("20 per minute")
```

**删除操作（严格）**
```python
@app.route("/api/articles/<slug>", methods=["DELETE"])
@limiter.limit("10 per minute")

@app.route("/api/admin/assets", methods=["DELETE"])
@limiter.limit("10 per minute")
```

---

## 🔵 Low - 有空时优化

### L1. 全局异常处理 ⏰ 预计 30 分钟

**修改文件**
📝 `backend/app.py` 末尾（`if __name__ == "__main__":` 之前）

复制以下代码：
```python
# ==========================================
# region 🛡️ 全局异常处理器
# ==========================================

@app.errorhandler(Exception)
def handle_exception(e):
    app.logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
    return jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred."
    }), 500

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(400)
def bad_request(e):
    return jsonify({"error": "Bad request", "message": str(e)}), 400

@app.errorhandler(ValidationError)
def validation_error(e):
    return jsonify({"error": "Validation failed", "details": e.messages}), 400

# endregion
```

---

### L2. 密码哈希升级 ⏰ 预计 30 分钟

**选项 1：scrypt（无需额外依赖）**
```python
# backend/app.py L125
def set_password(self, password: str) -> None:
    self.password_hash = generate_password_hash(
        password,
        method='scrypt:32768:8:1',
        salt_length=16
    )
```

**选项 2：argon2（推荐）**
```bash
pip install argon2-cffi
```
```python
from argon2 import PasswordHasher
ph = PasswordHasher()

def set_password(self, password: str) -> None:
    self.password_hash = ph.hash(password)

def check_password(self, password: str) -> bool:
    try:
        ph.verify(self.password_hash, password)
        if ph.check_needs_rehash(self.password_hash):
            self.password_hash = ph.hash(password)
            db.session.commit()
        return True
    except:
        return False
```

---

## 💡 可选增强

### M4. CORS 配置加固 ⏰ 预计 15 分钟

📝 `backend/app.py` 约 56 行
- 参考：`SECURITY_AUDIT_REPORT.md` 第 880 行
- 添加通配符检查、格式验证

### M5. 文件删除权限校验 ⏰ 预计 1 小时

仅当需要多管理员支持时：
- 添加 Asset 模型
- 记录上传者 ID
- 删除时校验所有权

---

## 🎯 今日任务建议

**上午（2 小时）**
1. ✅ 已完成：JWT 密钥校验
2. ⚠️ 修复 C2：文件上传加固（45 分钟）
3. ☕️ 测试验证（30 分钟）

**下午（3 小时）**
1. ⚠️ 修复 M1：添加输入校验（2 小时）
2. ⚠️ 修复 M2：添加限流保护（1 小时）

**本周内**
1. 💡 修复 L1：全局异常处理（30 分钟）
2. 💡 修复 M4：CORS 加固（15 分钟）

---

## ✅ 验证清单

修复完成后，逐项测试：

### JWT 密钥校验
```bash
# 删除 .env 中的 JWT_SECRET_KEY
python app.py
# 应立即退出并显示错误提示
```

### 文件上传
```bash
# 测试上传非图片
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.txt"
# 应返回 400 错误

# 测试上传正常图片
curl -X POST http://localhost:5000/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@image.png"
# 应返回 200 成功
```

### 输入校验
```bash
# 测试非法输入
curl -X POST http://localhost:5000/api/articles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "", "slug": "test"}'
# 应返回 400 校验错误
```

### 限流
```bash
# 快速连续请求 20 次
for i in {1..20}; do
  curl http://localhost:5000/api/articles/index
done
# 应在第 121 次后返回 429 Too Many Requests
```

---

## 📞 需要帮助？

- 📖 详细代码示例：查看 `SECURITY_AUDIT_REPORT.md`
- 🐛 遇到问题：在项目 Issues 中提问
- 💬 快速咨询：@架构军师·风风酱

---

**最后更新**：2026-08-14  
**预计总工作量**：Critical 45分钟 + Medium 4小时 + Low 1小时 = **约 6 小时**
