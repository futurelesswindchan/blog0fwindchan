# 2. 部署到云服务器：Nginx + Gunicorn 生产部署指南

> **目标读者**：已完成上一篇个性化定制，并将代码推送到自己 Fork 仓库的开发者。
>
> **系统环境**：本教程基于 **Ubuntu 24.04 LTS** 编写，其他发行版请自行适配。
>
> **安全说明**：本教程包含完整的服务器安全加固流程。在真实的互联网环境中，服务器从上线的第一秒起就会被自动化扫描器持续探测，安全加固是生产部署的必修内容，而非可选项。

---

## 一、准备工作

开始前，请确认已具备以下条件：

1. 一台运行 Ubuntu 24.04 LTS 的云服务器，并记录其**公网 IP 地址**。
2. 服务器的 **root 账户密码**（仅用于初始登录，后续将禁用）。
3. 一个域名（推荐，可选），并通过 **Cloudflare** 进行 DNS 代理。
4. 本教程的上一篇已完成：代码已推送到你自己的 GitHub Fork 仓库。

---

## 二、服务器初始化与安全加固

### 2.1 连接服务器

```bash
ssh root@<你的服务器IP>
```

### 2.2 更新系统

```bash
apt update && apt upgrade -y
```

### 2.3 创建普通用户

禁止直接以 root 身份运行应用程序。

```bash
adduser <你的用户名>
usermod -aG sudo <你的用户名>
```

### 2.4 配置 SSH 密钥登录

密码登录易遭暴力破解，密钥登录是更安全的替代方案。

**在本地机器上执行：**

```bash
ssh-keygen -t ed25519 -C "<备注>"
```

**将公钥上传到服务器：**

Linux / macOS：
```bash
ssh-copy-id <你的用户名>@<你的服务器IP>
```

Windows（手动操作）：
```bash
# 本地查看公钥内容，复制整行输出
cat ~/.ssh/id_ed25519.pub
```

然后在服务器的 root 终端执行：
```bash
mkdir -p /home/<你的用户名>/.ssh
nano /home/<你的用户名>/.ssh/authorized_keys
# 粘贴公钥内容，Ctrl+O 保存，Ctrl+X 退出

chown -R <你的用户名>:<你的用户名> /home/<你的用户名>/.ssh
chmod 700 /home/<你的用户名>/.ssh
chmod 600 /home/<你的用户名>/.ssh/authorized_keys
```

**验证密钥登录（在本地新开一个终端）：**

```bash
ssh <你的用户名>@<你的服务器IP>
# 不需要输入密码即可登录，则配置成功
```

### 2.5 禁用密码登录与 root 远程登录

> ⚠️ **必须先确认 2.4 的密钥登录成功，再执行此步骤。** 操作失误将导致无法再登录服务器。

```bash
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 2.6 配置防火墙

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 2.7 禁用非必要内核模块（CVE-2026-31431）

本博客的生产服务器曾遭受 Ebury/libkeyutils 风格的恶意软件感染。以下步骤可缓解此类利用内核加密模块进行提权的攻击，对正常业务无影响。

```bash
echo "install algif_aead /bin/false" | sudo tee /etc/modprobe.d/disable-algif.conf
sudo rmmod algif_aead 2>/dev/null
```

---

## 三、安装基础环境

以下操作均以普通用户身份执行（非 root）。

### 3.1 安装基础工具

```bash
sudo apt install -y git python3 python3-pip python3-venv libmagic1
```

> **注意**：`libmagic1` 是后端文件上传三重校验的系统级依赖。仅安装 Python 包（`python-magic`）而不安装此系统库，文件上传功能将无法正常工作。

### 3.2 安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 验证（需要 v22+）
node -v && npm -v
```

### 3.3 安装 Nginx（使用官方源）

Ubuntu 仓库中自带的 Nginx 版本通常较旧，存在已知安全漏洞。强烈建议使用 Nginx 官方源安装最新稳定版（>= 1.30.1）。

```bash
curl -fsSL https://nginx.org/keys/nginx_signing.key | sudo gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" | sudo tee /etc/apt/sources.list.d/nginx.list

sudo apt update && sudo apt install -y nginx

# 验证版本
nginx -v
```

> **Nginx 官方包与 Ubuntu 自带包的差异：**
> - 站点配置目录为 `/etc/nginx/conf.d/`，没有 `sites-available` / `sites-enabled`。
> - 没有自带 `proxy_params` 文件，需要手动创建。
> - 默认运行用户为 `nginx`，而非 `www-data`。

**手动创建 proxy_params 文件：**

```bash
sudo tee /etc/nginx/proxy_params << 'EOF'
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
EOF
```

> **为什么需要这些请求头？**
> 后端的 `ProxyFix(x_for=1)` 依赖 `X-Forwarded-For` 头来获取真实客户端 IP。如果缺少此头，限流器会将所有访客视为同一个 IP（`127.0.0.1`），导致正常用户被误伤限流。
>
> 如果在 Nginx 前方还套了一层 CDN（如 Cloudflare），需要将 `app.py` 中的 `ProxyFix` 参数改为 `x_for=2`。

**将 nginx 用户加入 www-data 组（解决 Socket 权限问题）：**

```bash
sudo usermod -aG www-data nginx
```

---

## 四、代码部署与构建

### 4.1 拉取代码

```bash
cd ~
git clone https://github.com/<你的GitHub用户名>/<你的Fork仓库名>.git
cd <项目文件夹名>
```

### 4.2 构建前端

```bash
cd frontend
npm install
npm run build
# 构建产物位于 frontend/dist/
```

### 4.3 配置后端环境

```bash
cd ../backend

python3 -m venv venv
source venv/bin/activate

# 安装依赖（requirements.txt 中已包含 gunicorn）
pip install -r requirements.txt
```

创建 `.env` 文件：

```bash
nano .env
```

写入以下内容：

```properties
FLASK_DEBUG=False
JWT_SECRET_KEY=<用下方命令生成的随机字符串>
CORS_ORIGINS=https://<你的域名>
```

生成安全密钥：

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

> 如果尚未绑定域名，`CORS_ORIGINS` 暂时填写 `http://<你的服务器IP>`，绑定域名后再更新。

初始化数据库并创建管理员：

```bash
# 建表 + 写入默认分类
flask db init

# 创建管理员账号
flask admin create

# （可选）导入示例文章和演示数据
# ⚠️ 此操作会清空 Article、Category、Friend、Artwork 表，仅用于首次迁移
python init_db.py
```

---

## 五、配置 Systemd 后台服务

```bash
sudo nano /etc/systemd/system/blog.service
```

写入以下内容（替换所有 `<占位符>`）：

```properties
[Unit]
Description=Gunicorn instance for Blog
After=network.target

[Service]
User=<你的用户名>
Group=www-data
WorkingDirectory=/home/<你的用户名>/<项目文件夹名>/backend
Environment="PATH=/home/<你的用户名>/<项目文件夹名>/backend/venv/bin"
ExecStart=/home/<你的用户名>/<项目文件夹名>/backend/venv/bin/gunicorn --workers 3 --bind unix:blog.sock -m 007 app:app

[Install]
WantedBy=multi-user.target
```

> **参数说明：**
> - `Group=www-data`：让 socket 文件所属组为 `www-data`，使 Nginx 有权访问。
> - `-m 007`：socket 文件权限为 `srwxrwx---`，仅组内成员（`www-data`）可读写。

启动并设置开机自启：

```bash
sudo systemctl daemon-reload
sudo systemctl start blog
sudo systemctl enable blog
sudo systemctl status blog
# 出现绿色 active (running) 即为成功
```

---

## 六、目录穿越权限（关键踩坑点）

Nginx worker 进程（`nginx` 用户）要访问 socket 文件，路径上**每一层目录**都必须有执行权限（`x`）。仅修改 socket 文件本身的权限不够，目录链路的每一环都要通。

```bash
chmod o+x /home/<你的用户名>
chmod o+x /home/<你的用户名>/<项目文件夹名>
chmod o+x /home/<你的用户名>/<项目文件夹名>/backend
```

---

## 七、配置 Nginx 反向代理

### 方案 A：纯 HTTP（无域名 / 测试用）

```bash
sudo nano /etc/nginx/conf.d/blog.conf
```

```nginx
server {
    listen 80;
    server_name <你的服务器IP>;

    root /home/<你的用户名>/<项目文件夹名>/frontend/dist;
    index index.html;

    location /static/ {
        alias /home/<你的用户名>/<项目文件夹名>/backend/static/;
        expires 30d;
    }

    location /api/ {
        include proxy_params;
        proxy_pass http://unix:/home/<你的用户名>/<项目文件夹名>/backend/blog.sock;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 方案 B：HTTPS + Cloudflare 源站证书（推荐）

如果使用 Cloudflare 代理（SSL 模式设为"完全（严格）"），可使用 Cloudflare 免费的源站证书（有效期长达 15 年，无需续期）。

1. 进入 Cloudflare 面板 → SSL/TLS → 源服务器 → 创建证书。
2. 将证书和私钥保存到服务器：

```bash
sudo mkdir -p /etc/nginx/ssl
sudo nano /etc/nginx/ssl/cloudflare-origin.pem   # 粘贴证书内容
sudo nano /etc/nginx/ssl/cloudflare-origin.key   # 粘贴私钥内容
sudo chmod 600 /etc/nginx/ssl/cloudflare-origin.key
```

3. 编写 Nginx 配置：

```bash
sudo nano /etc/nginx/conf.d/blog.conf
```

```nginx
server {
    listen 80;
    server_name <你的域名>;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name <你的域名>;

    ssl_certificate /etc/nginx/ssl/cloudflare-origin.pem;
    ssl_certificate_key /etc/nginx/ssl/cloudflare-origin.key;

    root /home/<你的用户名>/<项目文件夹名>/frontend/dist;
    index index.html;

    location /static/ {
        alias /home/<你的用户名>/<项目文件夹名>/backend/static/;
        expires 30d;
    }

    location /api/ {
        include proxy_params;
        proxy_pass http://unix:/home/<你的用户名>/<项目文件夹名>/backend/blog.sock;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> **注意**：`location /api/` 末尾的斜杠不能省略。使用 `location /api`（无斜杠）在某些 URL 模式下会导致路由匹配失败，接口返回 404。

### 激活配置

```bash
# 删除默认配置（避免冲突）
sudo rm -f /etc/nginx/conf.d/default.conf

# 测试配置语法
sudo nginx -t

# 重载 Nginx
sudo systemctl restart nginx
```

---

## 八、验证部署

在浏览器中访问你的域名或服务器 IP，若能看到博客首页，则部署成功。

---

## 附录 A：部署检查清单

完成部署后，逐项确认以下内容：

- [ ] SSH 密钥登录已配置
- [ ] 密码登录已禁用（`PasswordAuthentication no`）
- [ ] Root 远程登录已禁用（`PermitRootLogin no`）
- [ ] 防火墙已开启，仅放行 22 / 80 / 443
- [ ] `libmagic1` 系统库已安装
- [ ] Nginx 版本 >= 1.30.1（官方源安装）
- [ ] `algif_aead` 内核模块已禁用
- [ ] `nginx` 用户已加入 `www-data` 组
- [ ] `/home/<用户名>`、`/<项目>`、`/<项目>/backend` 三层目录均已 `chmod o+x`
- [ ] `nginx.conf` 中使用的是 `location /api/`（含末尾斜杠）
- [ ] `proxy_params` 包含 `X-Forwarded-For` 等必要请求头
- [ ] `.env` 中 `FLASK_DEBUG=False`
- [ ] `.env` 中 `JWT_SECRET_KEY` 不少于 32 字符
- [ ] `.env` 中 `CORS_ORIGINS` 设置为实际域名（含 `https://` 前缀）

---

## 附录 B：常见问题

**Q：访问网站显示 502 Bad Gateway？**

通常是 Nginx 无法连接到 Gunicorn socket。按顺序检查：

```bash
# 1. 确认后端服务在运行
sudo systemctl status blog

# 2. 确认 socket 文件存在
ls -la ~/blog.sock 2>/dev/null || ls -la ~/<项目文件夹名>/backend/blog.sock

# 3. 确认目录权限（三层都要有 o+x）
ls -ld /home/<你的用户名>
ls -ld /home/<你的用户名>/<项目文件夹名>
ls -ld /home/<你的用户名>/<项目文件夹名>/backend

# 4. 确认 nginx 用户在 www-data 组
groups nginx
```

**Q：API 返回 CORS 错误？**

检查 `backend/.env` 中的 `CORS_ORIGINS` 是否与实际访问的域名完全一致（包含 `https://` 前缀）。修改后重启服务：

```bash
sudo systemctl restart blog
```

**Q：文件上传失败，日志报 `magic` 相关错误？**

系统缺少 `libmagic1` 依赖：

```bash
sudo apt install -y libmagic1
sudo systemctl restart blog
```

**Q：使用 Nginx 官方源后找不到 `sites-available` 目录？**

Nginx 官方包使用 `/etc/nginx/conf.d/` 目录存放站点配置，直接在该目录下创建 `.conf` 文件即可，无需软链接。

**Q：后端启动失败，日志提示环境变量缺失？**

```bash
# 查看详细日志
sudo journalctl -u blog -n 50 --no-pager
```

确认 `backend/.env` 中 `JWT_SECRET_KEY` 和 `CORS_ORIGINS` 均已正确填写，缺少任意一项服务将拒绝启动。

---

> 没有未来的小风酱 敬上
> 2026.08 重构版
