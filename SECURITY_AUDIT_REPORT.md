# 🔒 Blog0fwindchan 安全审计报告

**审计日期**：2026-08-14  
**审计范围**：Flask 后端 `app.py` (1400+ 行) + Vue3 前端安全机制  
**审计工具**：DeepSec + 人工代码审查  
**审计人员**：架构军师·风风酱 awa

---

## 📊 威胁等级统计

| 等级 | 数量 | 说明 |
|------|------|------|
| 🔴 **Critical** | **2** | JWT 密钥配置缺陷、文件上传 RCE 风险 |
| 🟠 **High** | **1** | JWT 密钥长度未校验 |
| 🟡 **Medium** | **22** | 限流缺失 17 项 + 输入校验缺失 8 项（有重叠） |
| 🔵 **Low** | **7** | 错误处理缺失 5 项 + 密码哈希算法可优化 |

---

## 🚨 Critical 级别威胁

### 🔴 C1. JWT 密钥未配置时使用 None 导致认证绕过 ✅ **已修复**

**位置**：`backend/app.py:75`

**原始代码**：
```python
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
```

**威胁描述**：
- 当 `.env` 未配置 `JWT_SECRET_KEY` 时，密钥为 `None`
- Flask-JWT-Extended 会使用 `None` 作为签名密钥
- 攻击者可伪造任意 JWT token，直接绕过所有 `@jwt_required()` 保护
- 影响范围：所有 `/api/admin/*` 路由 + 文件上传等 15+ 个管理接口

**修复状态**：✅ 已在 `app.py:70-93` 添加强制校验（含长度检查）

**修复内容**：
- 启动时检查 `JWT_SECRET_KEY` 是否存在
- 检查密钥长度 >= 32 字符
- 未通过检查时立即退出程序并提示生成方法

**验证方法**：
```bash
cd backend
# 删除或注释掉 .env 中的 JWT_SECRET_KEY
python app.py
# 应看到错误提示并退出
```

---

### 🔴 C2. 文件上传类型检查不足 - 存在 RCE 风险 ⚠️ **待修复**

**位置**：`backend/app.py:447` (`/api/upload` 接口)

**威胁点 1：仅检查扩展名，不检查文件真实类型**
```python
def allowed_file(filename: str | None) -> bool:
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
```

- 攻击者可上传 `shell.php.png`、`webshell.jpg` 等伪装文件
- 如果 Web 服务器（Apache/Nginx）配置不当，可能解析为可执行脚本

**威胁点 2：缺少文件大小限制**
- 无最大文件大小限制，可能导致 DoS 攻击（上传 GB 级文件耗尽磁盘空间）

**威胁点 3：文件名清洗不完全**
- 虽然使用 UUID 替换文件名，但 `ext` 直接从用户输入提取
- 可能存在空字节截断、特殊字符注入等问题

**修复方案**：

#### 1. 安装依赖
```bash
pip install python-magic-bin  # Windows
# 或
pip install python-magic      # Linux/macOS
```

#### 2. 替换 `allowed_file` 函数
在 `app.py` 约 92 行处，替换为以下实现：

```python
import magic  # 添加到顶部 import 区域

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
ALLOWED_MIME_TYPES = {
    'image/png', 'image/jpeg', 'image/gif', 'image/webp'
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def allowed_file(file) -> tuple[bool, str]:
    """
    严格校验文件：扩展名 + MIME + 魔数三重检查
    
    Args:
        file: Flask 上传的文件对象
        
    Returns:
        (是否允许, 错误信息)
    """
    if not file or not file.filename:
        return False, "No file provided"
    
    filename = file.filename
    
    # 1. 扩展名检查
    if '.' not in filename:
        return False, "Invalid filename"
    
    ext = filename.rsplit('.', 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Extension .{ext} not allowed"
    
    # 2. 读取文件头检查 MIME（前 2048 字节足够识别图片类型）
    file.seek(0)
    header = file.read(2048)
    file.seek(0)  # 重置指针供后续保存使用
    
    try:
        mime = magic.from_buffer(header, mime=True)
    except Exception as e:
        return False, f"Failed to detect MIME type: {str(e)}"
    
    if mime not in ALLOWED_MIME_TYPES:
        return False, f"MIME type {mime} not allowed (expected image/*)"
    
    # 3. 文件大小检查
    file.seek(0, 2)  # 移到文件末尾
    size = file.tell()
    file.seek(0)  # 重置
    
    if size > MAX_FILE_SIZE:
        return False, f"File too large (max {MAX_FILE_SIZE//1024//1024}MB)"
    
    if size == 0:
        return False, "Empty file not allowed"
    
    return True, ""
```

#### 3. 修改 `/api/upload` 路由
在 `app.py` 约 447 行处，修改为：

```python
@app.route("/api/upload", methods=["POST"])
@jwt_required()
@limiter.limit("10 per minute")  # 添加限流
@limiter.limit("100 per hour")   # 小时级限流
def upload_file():
    """
    通用文件上传接口（已加固：三重校验 + 限流 + 路径穿越防护）
    - file: 文件对象
    - type: (可选) 上传类型，支持 'article' | 'artwork' | 'friend'
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
        
    file = request.files['file']
    upload_type = request.form.get('type', 'misc')

    # 严格的类型白名单
    allowed_types = {'article', 'artwork', 'friend', 'misc'}
    if upload_type not in allowed_types:
        upload_type = 'misc'
    
    # 三重校验（新增）
    is_allowed, err_msg = allowed_file(file)
    if not is_allowed:
        return jsonify({"error": err_msg}), 400
    
    # 安全的文件名生成（完全丢弃原文件名）
    ext = file.filename.rsplit('.', 1)[1].lower()
    
    # 再次过滤 ext，防止注入（双重保险）
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Invalid extension"}), 400
    
    filename = f"{uuid.uuid4().hex}.{ext}"
    
    # 使用 secure_filename 进一步清洗
    from werkzeug.utils import secure_filename
    filename = secure_filename(filename)
    
    # 构建路径（确保不会逃逸）
    upload_folder = os.path.abspath(app.config['UPLOAD_FOLDER'])
    save_dir = os.path.join(upload_folder, upload_type)
    
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)
    
    save_path = os.path.join(save_dir, filename)
    
    # 最终路径安全检查：确保在 uploads 目录内（新增）
    if not os.path.abspath(save_path).startswith(upload_folder):
        return jsonify({"error": "Path traversal detected"}), 400
    
    try:
        file.save(save_path)
    except Exception as e:
        app.logger.error(f"File save failed: {str(e)}")
        return jsonify({"error": "Failed to save file"}), 500
    
    url = f"/static/uploads/{upload_type}/{filename}"
    return jsonify({"message": "Upload successful", "url": url})
```

#### 4. Nginx 配置加固（可选但强烈推荐）
在 Nginx 配置中禁止执行 `uploads/` 目录下的脚本：

```nginx
location /static/uploads/ {
    # 禁止执行任何脚本
    location ~ \.(php|py|sh|exe|dll|jsp|asp|aspx)$ {
        deny all;
        return 403;
    }
    
    # 设置正确的 MIME 类型
    types {
        image/png png;
        image/jpeg jpg jpeg;
        image/gif gif;
        image/webp webp;
    }
    
    # 禁止目录列举
    autoindex off;
}
```

**预计工作量**：30-45 分钟

---

## 🟠 High 级别威胁

### 🟠 H1. XSS 存储型风险 ✅ **已正确防护**

**检查位置**：
- 后端：`Article.content` 字段存储 Markdown
- 前端：`frontend/src/components/common/ContentTypeWriter.vue:18`

**防护机制**：
✅ 使用 `DOMPurify.sanitize()` 净化 HTML  
✅ 配置了安全白名单：允许 `span/code/pre/i/button` 等安全标签  
✅ 禁止高危标签：`script/iframe/object/embed/base`  
✅ 禁止事件属性：`onload/onerror/onclick/onmouseover`  
✅ 外链自动添加 `rel="noopener noreferrer"`

**代码位置**：`frontend/src/composables/useArticleContent.ts:84-98`

**建议增强**（可选）：
```typescript
// frontend/src/composables/useArticleContent.ts:84
const sanitizeHtml = (html: string): string => {
  return getPurifier().sanitize(html, {
    ADD_TAGS: ['span', 'code', 'pre', 'i', 'button'],
    ADD_ATTR: ['class', 'target', 'rel', 'data-code', 'title'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'form', 'input'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit'],
    KEEP_CONTENT: false,  // 删除禁止标签的内容，而非仅移除标签本身
  }) as string
}
```

---

### 🟠 H2. JWT 密钥长度未校验 ✅ **已修复**

**威胁描述**：
- 即使配置了 `JWT_SECRET_KEY`，如果密钥过短（如 `123456`），仍可能被暴力破解
- HMAC-SHA256 算法建议密钥至少 32 字节（256 bits）

**修复状态**：✅ 已在 C1 修复中一并处理

**生成安全密钥**：
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🟡 Medium 级别威胁

### 🟡 M1. 缺失输入校验（8 个端点）⚠️ **待修复**

**受影响端点**：
1. `/api/admin/login` (app.py:681)
2. `/api/articles` (app.py:769)
3. `/api/admin/collections` (app.py:947)
4. `/api/friends` (app.py:1013)
5. `/api/artworks/<int:id>` (app.py:1092)
6. `/api/admin/plans/<int:id>` (app.py:1180)
7. `/api/sponsors/<int:id>` (app.py:1279)
8. `/api/admin/plans/reorder` (app.py:1212)

**威胁描述**：
- 缺少类型/长度/格式校验
- 可能导致数据库字段溢出、类型错误 500 异常、业务逻辑绕过

**修复方案**：

#### 1. 安装依赖
```bash
pip install marshmallow
```

#### 2. 在 `app.py` 顶部添加 Schema 定义
在 `app.py` 约 30 行处（import 区域后），添加：

```python
from marshmallow import Schema, fields, validate, ValidationError

# ==========================================
# region 📋 请求校验 Schema
# ==========================================

class ArticleSchema(Schema):
    """文章创建/更新请求校验"""
    slug = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    category = fields.Str(required=True, validate=validate.OneOf(['frontend', 'topics', 'novels']))
    date = fields.Str(validate=validate.Regexp(r'^\d{4}-\d{2}-\d{2}$'))
    content = fields.Str(allow_none=True)
    collection_id = fields.Str(allow_none=True, validate=validate.Length(max=100))
    isNew = fields.Bool(missing=False)
    uid = fields.Str(allow_none=True, validate=validate.Length(max=50))

class FriendSchema(Schema):
    """友链添加/更新请求校验"""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    url = fields.Url(required=True)
    desc = fields.Str(validate=validate.Length(max=200), allow_none=True)
    avatar = fields.Url(allow_none=True)
    tags = fields.List(fields.Str(validate=validate.Length(max=50)), allow_none=True)

class ArtworkSchema(Schema):
    """画廊作品添加/更新请求校验"""
    title = fields.Str(validate=validate.Length(max=100), allow_none=True)
    thumbnail = fields.Url(required=True)
    fullsize = fields.Url(required=True)
    description = fields.Str(validate=validate.Length(max=300), allow_none=True)
    date = fields.Str(validate=validate.Regexp(r'^\d{4}-\d{2}-\d{2}$'), allow_none=True)

class PlanSchema(Schema):
    """计划项添加/更新请求校验"""
    content = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    status = fields.Str(validate=validate.OneOf(['todo', 'doing', 'done']), missing='todo')
    sort_order = fields.Int(validate=validate.Range(min=0), allow_none=True)

class SponsorSchema(Schema):
    """赞助者添加/更新请求校验"""
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    avatar = fields.Url(allow_none=True)
    url = fields.Url(allow_none=True)
    message = fields.Str(validate=validate.Length(max=500), allow_none=True)
    date = fields.Str(validate=validate.Regexp(r'^\d{4}-\d{2}-\d{2}$'), allow_none=True)

class CollectionSchema(Schema):
    """合集添加/更新请求校验"""
    slug = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    description = fields.Str(validate=validate.Length(max=300), allow_none=True)
    category = fields.Str(required=True, validate=validate.OneOf(['frontend', 'topics', 'novels']))

# endregion
```

#### 3. 在各路由中应用校验
示例（`/api/articles` 路由）：

```python
@app.route("/api/articles", methods=["POST"])
@jwt_required()
@limiter.limit("30 per minute")  # 同时添加限流
def save_article():
    """新增或更新文章（需要 access_token）"""
    
    # 使用 Schema 校验
    schema = ArticleSchema()
    try:
        data = schema.load(request.json or {})
    except ValidationError as err:
        return jsonify({
            "error": "Validation failed", 
            "details": err.messages
        }), 400
    
    # ... 原有业务逻辑保持不变，但 data 已经是校验后的安全数据
```

对其他端点应用类似的模式。

**预计工作量**：2-4 小时

---

### 🟡 M2. 缺失限流（13 个端点）⚠️ **待修复**

**已有限流**：
- ✅ `/api/admin/login` - `5 per minute`
- ✅ 全局默认 - `50000 per day, 5000 per hour`

**未配置限流的高风险端点**：
1. `/api/upload` (已在 C2 修复方案中添加)
2. `/api/articles/index` (公开接口，可能被爬虫滥用)
3. `/api/collection/<slug>` (公开接口)
4. `/api/articles` POST (管理接口)
5. `/api/articles/<slug>` GET (公开接口)
6. `/api/admin/collections` POST/PUT/DELETE (管理接口)
7. `/api/friends` POST/PUT/DELETE (管理接口)
8. `/api/artworks` POST/PUT/DELETE (管理接口)
9. `/api/admin/plans` POST/PUT/DELETE (管理接口)
10. `/api/sponsors` POST/PUT/DELETE (管理接口)
11. `/api/admin/assets` GET/DELETE (管理接口)

**修复方案**：

在各路由装饰器中添加 `@limiter.limit()` 装饰器：

```python
# 公开只读接口 - 宽松限流
@app.route("/api/articles/index")
@limiter.limit("120 per minute")  # 允许频繁访问
def get_article_index():
    # ...

@app.route("/api/article/<category_slug>/<article_slug>")
@limiter.limit("60 per minute")
def get_article_content(category_slug, article_slug):
    # ...

@app.route("/api/collection/<collection_slug>")
@limiter.limit("60 per minute")
def get_collection_detail(collection_slug):
    # ...

# 管理接口 - 严格限流
@app.route("/api/articles", methods=["POST"])
@jwt_required()
@limiter.limit("30 per minute")
def save_article():
    # ...

@app.route("/api/friends", methods=["POST"])
@jwt_required()
@limiter.limit("20 per minute")
def add_friend():
    # ...

@app.route("/api/admin/collections", methods=["POST"])
@jwt_required()
@limiter.limit("20 per minute")
def add_collection():
    # ...

# 删除操作 - 更严格的限流
@app.route("/api/articles/<slug>", methods=["DELETE"])
@jwt_required()
@limiter.limit("10 per minute")
def delete_article(slug):
    # ...

@app.route("/api/admin/assets", methods=["DELETE"])
@jwt_required()
@limiter.limit("10 per minute")
def delete_article_asset():
    # ...
```

**预计工作量**：1 小时

---

### 🟡 M3. SQL 注入风险 ✅ **已正确防护**

**检查结果**：
- ✅ 全程使用 SQLAlchemy ORM，自动参数化
- ✅ 路由参数通过 Flask 类型转换（`<int:id>`、`<slug>`）
- ✅ WHERE 子句使用 `.filter_by(slug=slug)` 而非字符串拼接

**示例代码**（app.py:556）：
```python
article = (
    db.session.execute(
        db.select(Article).filter_by(slug=article_slug, category_id=category.id)
    ).scalar_one_or_none()
)
```

✅ 无需修复，继续保持 ORM 使用即可。

---

### 🟡 M4. CORS 配置增强建议 💡 **可选优化**

**位置**：`backend/app.py:42-56`

**当前状态**：
✅ 已强制从 `.env` 读取，不允许通配符 `*`  
✅ 使用了白名单机制

**建议增强**（防止误配置）：

在 `app.py` 约 56 行处，替换 CORS 配置为：

```python
# 解析并验证 CORS 来源
cors_origins = [origin.strip() for origin in cors_origins_raw.split(",")]

# 拒绝通配符配置（安全加固）
if "*" in cors_origins:
    print("❌ [安全错误] CORS_ORIGINS 不允许使用通配符 '*'")
    print("   请显式列出允许的域名，多个域名用逗号分隔")
    print("   示例：CORS_ORIGINS=http://localhost:5173,https://blog.windchan.com")
    sys.exit(1)

# 验证每个 origin 格式
import re
url_pattern = re.compile(r'^https?://[a-zA-Z0-9\-\.]+(:\d+)?$')
for origin in cors_origins:
    if not url_pattern.match(origin):
        print(f"❌ [配置错误] 无效的 CORS origin: {origin}")
        print("   格式应为：http://domain.com 或 https://domain.com:port")
        sys.exit(1)

# 开启跨域支持（使用严格配置）
CORS(app, resources={
    r"/api/*": {
        "origins": cors_origins,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Range", "X-Content-Range"],
        "supports_credentials": True,
        "max_age": 3600  # 预检请求缓存 1 小时
    }
})
```

**预计工作量**：15 分钟

---

### 🟡 M5. 文件删除接口缺少所有权校验 💡 **可选增强**

**位置**：`backend/app.py:914` (`/api/admin/assets` DELETE)

**威胁描述**：
- 虽然使用了 `@jwt_required()` 保护
- 但任意管理员可以删除其他管理员上传的文件（无所有权检查）
- 当前单管理员场景下风险较低，但多管理员场景下需要增强

**修复方案**（多管理员场景）：

如果未来需要支持多管理员，建议：

1. 添加 `Asset` 模型记录文件元信息：

```python
class Asset(db.Model):
    """文件资产元信息表"""
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(200), nullable=False, unique=True)
    upload_type = db.Column(db.String(20), nullable=False)
    uploader_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    upload_time = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "filename": self.filename,
            "type": self.upload_type,
            "upload_time": self.upload_time.isoformat(),
        }
```

2. 在 `/api/upload` 中记录上传者：

```python
@app.route("/api/upload", methods=["POST"])
@jwt_required()
def upload_file():
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    
    # ... 上传逻辑 ...
    
    # 记录文件元信息
    asset = Asset(
        filename=filename,
        upload_type=upload_type,
        uploader_id=current_user_id
    )
    db.session.add(asset)
    db.session.commit()
    
    return jsonify({"message": "Upload successful", "url": url})
```

3. 在删除接口中校验所有权：

```python
@app.route("/api/admin/assets", methods=["DELETE"])
@jwt_required()
@limiter.limit("10 per minute")
def delete_article_asset():
    from flask_jwt_extended import get_jwt_identity
    current_user_id = int(get_jwt_identity())
    
    filename = request.args.get('filename')
    if not filename:
        return jsonify({"error": "Filename required"}), 400
    
    safe_filename = os.path.basename(filename)
    
    # 查找文件记录
    asset = Asset.query.filter_by(filename=safe_filename).first()
    if not asset:
        return jsonify({"error": "File not found"}), 404
    
    # 权限校验（只能删除自己的文件）
    if asset.uploader_id != current_user_id:
        return jsonify({"error": "Permission denied: You can only delete your own files"}), 403
    
    # 删除物理文件
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], asset.upload_type, safe_filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            app.logger.error(f"Failed to delete file: {str(e)}")
            return jsonify({"error": "Failed to delete file"}), 500
    
    # 删除数据库记录
    db.session.delete(asset)
    db.session.commit()
    
    return jsonify({"message": "File deleted"})
```

**预计工作量**：1-2 小时（仅当需要多管理员支持时）

---

## 🔵 Low 级别威胁

### 🔵 L1. 错误处理缺失（5 个端点）💡 **建议修复**

**受影响端点**：
1. `/api/admin/login` (app.py:681)
2. `/api/articles/<slug>` DELETE (app.py:857)
3. `/api/admin/collections` POST (app.py:947)
4. `/api/artworks/<int:id>` PUT (app.py:1092)
5. `/api/sponsors/<int:id>` PUT (app.py:1279)

**威胁描述**：
- 未捕获的异常导致 Flask 返回 500 + 完整堆栈信息（DEBUG 模式下）
- 可能泄露：文件路径、数据库表结构、第三方库版本

**修复方案**：

在 `app.py` 末尾（`if __name__ == "__main__":` 之前）添加全局异常处理器：

```python
# ==========================================
# region 🛡️ 全局异常处理器
# ==========================================

@app.errorhandler(Exception)
def handle_exception(e):
    """捕获所有未处理的异常，避免泄露敏感信息"""
    # 记录完整错误到日志（仅服务端可见）
    app.logger.error(f"Unhandled exception: {str(e)}", exc_info=True)
    
    # 返回通用错误给客户端（不泄露细节）
    return jsonify({
        "error": "Internal server error",
        "message": "An unexpected error occurred. Please try again later."
    }), 500

@app.errorhandler(404)
def not_found(e):
    """处理 404 错误"""
    return jsonify({"error": "Resource not found"}), 404

@app.errorhandler(400)
def bad_request(e):
    """处理 400 错误"""
    return jsonify({"error": "Bad request", "message": str(e)}), 400

@app.errorhandler(ValidationError)
def validation_error(e):
    """处理 marshmallow 校验错误"""
    return jsonify({
        "error": "Validation failed", 
        "details": e.messages
    }), 400

@app.errorhandler(413)
def request_entity_too_large(e):
    """处理文件过大错误"""
    return jsonify({
        "error": "File too large",
        "message": "The uploaded file exceeds the maximum allowed size."
    }), 413

# endregion
```

同时，确保生产环境关闭 DEBUG 模式（已在 app.py:1388 实现）。

**预计工作量**：30 分钟

---

### 🔵 L2. 密码哈希算法可升级 💡 **可选优化**

**位置**：`backend/app.py:125`

**当前实现**：
```python
def set_password(self, password: str) -> None:
    self.password_hash = generate_password_hash(password)
```

**现状分析**：
- `generate_password_hash` 默认使用 `pbkdf2:sha256`
- 虽然安全，但现代推荐使用 `scrypt` 或 `argon2`（2015 年密码哈希竞赛冠军）

**升级方案 1：使用 scrypt（无需额外依赖）**

```python
from werkzeug.security import generate_password_hash, check_password_hash

def set_password(self, password: str) -> None:
    """使用 scrypt 算法生成密码哈希（更安全）"""
    self.password_hash = generate_password_hash(
        password,
        method='scrypt:32768:8:1',  # N=32768, r=8, p=1（OWASP 推荐）
        salt_length=16
    )

def check_password(self, password: str) -> bool:
    """验证密码（自动兼容旧算法）"""
    return check_password_hash(self.password_hash, password)
```

**升级方案 2：使用 argon2（推荐）**

```bash
pip install argon2-cffi
```

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHash

ph = PasswordHasher(
    time_cost=3,        # 迭代次数
    memory_cost=65536,  # 64 MB
    parallelism=4,      # 并行度
    hash_len=32,        # 哈希长度
    salt_len=16         # 盐长度
)

def set_password(self, password: str) -> None:
    """使用 Argon2id 生成密码哈希（行业最佳实践）"""
    self.password_hash = ph.hash(password)

def check_password(self, password: str) -> bool:
    """验证密码并自动重新哈希（如参数更新）"""
    try:
        ph.verify(self.password_hash, password)
        
        # 检查是否需要重新哈希（参数升级）
        if ph.check_needs_rehash(self.password_hash):
            self.password_hash = ph.hash(password)
            db.session.commit()
        
        return True
    except (VerifyMismatchError, InvalidHash):
        return False
```

**预计工作量**：30 分钟

---

## 📝 修复优先级清单

### 🔴 本周内必须修复（Critical）

| # | 问题 | 位置 | 状态 | 预计工作量 |
|---|------|------|------|-----------|
| C1 | JWT 密钥未配置/过短 | `app.py:75` | ✅ 已修复 | - |
| C2 | 文件上传类型检查不足 | `app.py:447` | ⚠️ 待修复 | 45 分钟 |

### 🟠 2 周内修复（High）

| # | 问题 | 位置 | 状态 | 预计工作量 |
|---|------|------|------|-----------|
| H1 | XSS 存储型风险 | 前端渲染 | ✅ 已防护 | - |
| H2 | JWT 密钥长度校验 | `app.py:75` | ✅ 已修复 | - |

### 🟡 1 个月内修复（Medium）

| # | 问题 | 位置 | 状态 | 预计工作量 |
|---|------|------|------|-----------|
| M1 | 8 个端点缺少输入校验 | 多处 | ⚠️ 待修复 | 3 小时 |
| M2 | 13 个端点缺少限流 | 多处 | ⚠️ 待修复 | 1 小时 |
| M3 | SQL 注入风险 | 全局 | ✅ ORM 已防护 | - |
| M4 | CORS 配置增强 | `app.py:56` | 💡 可选 | 15 分钟 |
| M5 | 文件删除权限校验 | `app.py:914` | 💡 可选 | 1 小时 |

### 🔵 有空时优化（Low）

| # | 问题 | 位置 | 状态 | 预计工作量 |
|---|------|------|------|-----------|
| L1 | 5 个端点缺少错误处理 | 多处 | 💡 建议 | 30 分钟 |
| L2 | 密码哈希算法升级 | `app.py:125` | 💡 可选 | 30 分钟 |

---

## 🎯 快速行动清单

### 今天就修复（已完成 ✅）

1. ✅ **JWT 密钥强制检查** - 已在 `app.py:70-93` 修复

### 本周末前修复（Critical）

2. ⚠️ **文件上传加固**
   ```bash
   # 安装依赖
   pip install python-magic-bin
   
   # 修改 app.py 约 92 行和 447 行
   # 参考本报告 C2 章节的完整代码
   ```

### 下周完成（High Priority）

3. ⚠️ **添加输入校验**
   ```bash
   pip install marshmallow
   
   # 在 app.py 添加 Schema 定义
   # 在各路由中应用校验
   ```

4. ⚠️ **添加限流保护**
   ```python
   # 为 13 个端点添加 @limiter.limit() 装饰器
   # 参考本报告 M2 章节
   ```

---

## 🛡️ 部署检查清单

在生产环境部署前，请确认以下项目：

### 环境配置
- [ ] `.env` 文件已配置且未提交到 Git
- [ ] `JWT_SECRET_KEY` 已生成（>= 32 字符）
- [ ] `CORS_ORIGINS` 已设置为生产域名（不含通配符）
- [ ] `FLASK_DEBUG=False` 或未设置（生产环境禁用 DEBUG）
- [ ] `FLASK_PORT` 已设置为合适端口（默认 5000）

### 安全加固
- [ ] 文件上传接口已添加 MIME 类型检查
- [ ] 所有管理接口已添加限流装饰器
- [ ] Nginx/Apache 已配置禁止执行 uploads 目录下的脚本
- [ ] 全局异常处理器已添加

### 数据库
- [ ] 数据库文件权限设置为仅服务器进程可读写（chmod 600）
- [ ] 定期备份数据库（建议每日自动备份）

### 监控告警
- [ ] 配置日志记录（记录所有 API 调用）
- [ ] 监控异常登录尝试（频繁 401）
- [ ] 监控文件上传频率（检测滥用）

---

## 📚 参考资源

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [Flask Security Best Practices](https://flask.palletsprojects.com/en/2.3.x/security/)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Marshmallow Documentation](https://marshmallow.readthedocs.io/)
- [Flask-Limiter Documentation](https://flask-limiter.readthedocs.io/)

---

## 📞 后续支持

如果修复过程中遇到问题，可以：

1. 查看本报告对应章节的详细代码示例
2. 参考上述官方文档
3. 在项目 Issues 中提问

祝主人修复顺利~ 有任何疑问随时找风风酱哦 awa

---

**报告生成时间**：2026-08-14  
**下次审计建议**：每季度一次，或在重大功能更新后
