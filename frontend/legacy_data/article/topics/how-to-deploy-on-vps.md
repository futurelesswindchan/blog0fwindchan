# 3. 进阶之路：如何将你的博客部署到云服务器（2026 安全加固版）

> **声明**：本教程面向有一定 Linux 命令行基础的朋友。
> **前置要求**：你已经完成了上一篇的"装修"，并把代码 **Push** 到了你自己的 GitHub 仓库。
> **系统环境**：教程基于 **Ubuntu 24.04 LTS**，其他版本请自行适配。

---

## 零、前言：从"本地玩具"到"线上产品"

恭喜你！能读到这里，说明你已经在本地拥有了一个独一无二的博客。

这篇教程将手把手带你完成从"本地"到"线上"的蜕变。我们将使用 **Nginx** 作为反向代理， **Gunicorn** 作为后端服务，将你的博客部署到一台真正的云服务器（VPS）上！

与旧版教程不同，这一版加入了**完整的安全加固流程**——SSH 密钥认证、防火墙、内核漏洞缓解等。因为在真实的互联网上，你的服务器从上线的那一秒起就会被扫描器盯上。安全不是可选项，是必修课！

**最终目标：** 输入你的域名，全世界都能安全地访问你的博客！

---

## 一、准备工作

在开始之前，请确保你拥有：

1. 一台 **Linux 云服务器**（推荐 Ubuntu 24.04 LTS）。
2. 服务器的 **公网 IP 地址**。
3. **root 账户密码**（初始登录用，之后会禁用）。
4. （推荐）一个域名，并使用 **Cloudflare** 进行 DNS 代理。

---

## 二、第一步：服务器初始化与安全加固

### 1. 连接服务器

打开终端，使用 SSH 连接：

```bash
ssh root@[你的服务器IP]
```

### 2. 更新系统

```bash
apt update && apt upgrade -y
```

### 3. 创建普通用户（安全第一！）

**永远不要直接用 root 跑程序！**

```bash
adduser [你的用户名]           # 创建用户，按提示设置密码
usermod -aG sudo [你的用户名]  # 赋予管理员权限
```

### 4. 配置 SSH 密钥登录（极其重要！）

密码登录容易被暴力破解或被恶意软件窃取。密钥登录则像一把独一无二的钥匙，只有你手里有。

**在你的【本地电脑】上操作：**

```bash
ssh-keygen -t ed25519 -C "[任意备注名]"
```

一路回车即可（也可以设置一个 passphrase 作为二次保护）。

**然后将公钥传到服务器：**

Linux/Mac 用户：

```bash
ssh-copy-id [你的用户名]@[你的服务器IP]
```

Windows 用户（没有 `ssh-copy-id`）：

```bash
# 先在本地查看公钥内容
cat ~/.ssh/id_ed25519.pub
# 复制输出的那一整行
```

然后在服务器上（root 终端）执行：

```bash
mkdir -p /home/[你的用户名]/.ssh
nano /home/[你的用户名]/.ssh/authorized_keys
# 粘贴公钥内容，保存退出（Ctrl+O 回车，Ctrl+X）

chown -R [你的用户名]:[你的用户名] /home/[你的用户名]/.ssh
chmod 700 /home/[你的用户名]/.ssh
chmod 600 /home/[你的用户名]/.ssh/authorized_keys
```

**验证密钥登录：** 在本地新开一个终端窗口：

```bash
ssh [你的用户名]@[你的服务器IP]
```

如果不需要输入密码就登进去了，说明配置成功！

### 5. 锁死大门：禁用密码登录 & 禁止 root 远程登录

> ⚠️ **确认密钥登录成功后再执行这一步！** 否则会把自己锁在外面！

```bash
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

从此以后，只有持有你私钥的人才能登录这台服务器。

### 6. 配置防火墙

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 7. 缓解内核提权漏洞（CVE-2026-31431）

```bash
echo "install algif_aead /bin/false" | sudo tee /etc/modprobe.d/disable-algif.conf
sudo rmmod algif_aead 2>/dev/null
```

> 这对绝大多数业务没有任何影响，但能防止攻击者利用内核漏洞提权为 root。

---

## 三、第二步：安装基础环境

**以下操作均使用你的普通用户（非 root）进行。**

### 1. 安装基础工具

```bash
sudo apt install -y git python3 python3-pip python3-venv
```

### 2. 安装 Node.js（构建 Vue3 需要）

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 验证版本（确保 v22+）
node -v
npm -v
```

### 3. 安装 Nginx（使用官方源获取最新安全版本）

> ⚠️ Ubuntu 自带的 Nginx 版本通常较旧，可能存在已知漏洞。强烈建议使用 Nginx 官方源。

```bash
curl -fsSL https://nginx.org/keys/nginx_signing.key | sudo gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" | sudo tee /etc/apt/sources.list.d/nginx.list

sudo apt update && sudo apt install -y nginx

# 验证版本（确保 >= 1.30.1）
nginx -v
```

> **Nginx 官方包 vs Ubuntu 自带包的区别：**

```
- 配置文件放在 `/etc/nginx/conf.d/`（没有 `sites-available/sites-enabled` 目录）
- 没有自带 `proxy_params` 文件，需要手动创建
- 运行用户是 `nginx` 而不是 `www-data`
```

**创建 proxy_params 文件：**

```bash
sudo tee /etc/nginx/proxy_params << 'EOF'
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
EOF
```

**解决 Socket 权限问题（关键！）：**

```bash
sudo usermod -aG www-data nginx
```

---

## 四、第三步：代码部署与构建

### 1. 拉取代码

```bash
cd ~
git clone https://github.com/[你的GitHub用户名]/[你的仓库名].git
cd [项目文件夹名]
```

### 2. 前端构建（Vue3）

```bash
cd frontend
npm install
npm run build
```

构建完成后， `frontend` 目录下会生成一个 `dist` 文件夹，这就是我们要发布的网站。

### 3. 后端环境（Flask）

```bash
cd ../backend

# 创建并激活虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
pip install gunicorn

# 配置环境变量
nano .env
```

`.env` 文件内容：

```properties
FLASK_DEBUG=False
JWT_SECRET_KEY=[用键盘随机敲一串足够长且复杂的字符]
CORS_ORIGINS=https://[你的域名]
```

> 如果你还没有域名， `CORS_ORIGINS` 先填 `http://[你的服务器IP]`，之后绑定域名时再改。

```bash
# 创建管理员账号
flask create-admin

# （可选）迁移示例数据
python init_db.py
```

---

## 五、第四步：配置后台服务（Systemd）

我们需要让后端程序在后台持续运行，并开机自启。

```bash
sudo nano /etc/systemd/system/blog.service
```

写入以下内容（注意替换占位符）：

```properties
[Unit]
Description=Gunicorn instance for Blog
After=network.target

[Service]
User=[你的用户名]
Group=www-data
WorkingDirectory=/home/[你的用户名]/[项目文件夹名]/backend
Environment="PATH=/home/[你的用户名]/[项目文件夹名]/backend/venv/bin"
ExecStart=/home/[你的用户名]/[项目文件夹名]/backend/venv/bin/gunicorn --workers 3 --bind unix:blog.sock -m 007 app:app

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl start blog
sudo systemctl enable blog
sudo systemctl status blog  # 看到绿色的 active (running) 就成功了！
```

---

## 六、第五步：配置 Nginx 反向代理

### 方案 A：纯 HTTP（无域名 / 测试用）

```bash
sudo nano /etc/nginx/conf.d/blog.conf
```

```nginx
server {
    listen 80;
    server_name [你的IP或域名];

    root /home/[你的用户名]/[项目文件夹名]/frontend/dist;
    index index.html;

    location /static/ {
        alias /home/[你的用户名]/[项目文件夹名]/backend/static/;
        expires 30d;
    }

    location /api {
        include proxy_params;
        proxy_pass http://unix:/home/[你的用户名]/[项目文件夹名]/backend/blog.sock;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 方案 B：HTTPS + Cloudflare 源站证书（推荐！）

如果你使用 Cloudflare 代理（SSL 模式设为"完全（严格）"），可以使用 Cloudflare 免费的源站证书（有效期长达 15 年，无需续期）。

1. 在 Cloudflare 面板 → SSL/TLS → 源服务器 → 创建证书
2. 将证书和私钥保存到服务器：

```bash
sudo mkdir -p /etc/nginx/ssl
sudo nano /etc/nginx/ssl/cloudflare-origin.pem   # 粘贴证书内容
sudo nano /etc/nginx/ssl/cloudflare-origin.key   # 粘贴私钥内容
sudo chmod 600 /etc/nginx/ssl/cloudflare-origin.key
```

3. Nginx 配置：

```bash
sudo nano /etc/nginx/conf.d/blog.conf
```

```nginx
server {
    listen 80;
    server_name [你的域名];
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name [你的域名];

    ssl_certificate /etc/nginx/ssl/cloudflare-origin.pem;
    ssl_certificate_key /etc/nginx/ssl/cloudflare-origin.key;

    root /home/[你的用户名]/[项目文件夹名]/frontend/dist;
    index index.html;

    location /static/ {
        alias /home/[你的用户名]/[项目文件夹名]/backend/static/;
        expires 30d;
    }

    location /api {
        include proxy_params;
        proxy_pass http://unix:/home/[你的用户名]/[项目文件夹名]/backend/blog.sock;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 激活配置

```bash
# 确保 Nginx 能访问你的 home 目录
sudo chmod 755 /home/[你的用户名]

# 删除默认配置（避免冲突）
sudo rm -f /etc/nginx/conf.d/default.conf

# 测试并重载
sudo nginx -t
sudo systemctl restart nginx
```

---

## 七、大功告成！

现在，打开浏览器，输入你的域名（或服务器 IP）。
如果一切顺利，你应该能看到那个**你亲手装修过**的博客首页了！🎉

---

## 附录：安全加固清单

部署完成后，请确认以下事项全部打勾：

- [ ] SSH 密钥登录已配置
- [ ] 密码登录已禁用
- [ ] Root 远程登录已禁用
- [ ] 防火墙已开启（仅开放 22/80/443）
- [ ] Nginx 版本 >= 1.30.1
- [ ] algif_aead 内核模块已禁用
- [ ] `.env` 中 `FLASK_DEBUG=False`
- [ ] `JWT_SECRET_KEY` 足够复杂
- [ ] `CORS_ORIGINS` 设置为你的实际域名

---

## 附录：常见问题

**Q: 访问网站显示 502 Bad Gateway？**
A: 通常是 Nginx 连不上 Gunicorn 的 socket。检查：

```bash
# 确认 blog 服务在运行
sudo systemctl status blog

# 确认 socket 文件存在
ls -la ~/[项目文件夹名]/backend/blog.sock

# 确认 nginx 用户在 www-data 组中
groups nginx
# 如果没有，执行：sudo usermod -aG www-data nginx && sudo systemctl restart nginx
```

**Q: API 返回 CORS 错误？**
A: 检查 `.env` 中的 `CORS_ORIGINS` 是否与你实际访问的域名完全一致（包括 `https://` 前缀），修改后重启服务： `sudo systemctl restart blog`

**Q: 使用 Nginx 官方源后找不到** `sites-available`\*\* 目录？\*\*
A: Nginx 官方包使用 `/etc/nginx/conf.d/` 目录存放站点配置，直接在里面创建 `.conf` 文件即可，不需要软链接。

---

> 没有未来的小风酱 敬上  
> 2026.05 安全加固版
