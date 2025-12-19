# 3. 进阶之路：如何将你的博客部署到云服务器

> **声明**：本教程面向有一定Linux命令行基础的朋友。  
> **前置要求**：你已经完成了上一篇的“装修”，并把代码 **Push** 到了你自己的 GitHub 仓库。  
> **系统环境**：教程基于 **Ubuntu 20.04/22.04 LTS**。

---

## 零、前言：从“本地玩具”到“线上产品”

恭喜你！能读到这里，说明你已经在本地拥有了一个独一无二的博客。

这篇教程将手把手带你完成从“本地”到“线上”的蜕变。我们将使用 **Nginx** 作为反向代理，**Gunicorn** 作为后端服务，将你的博客部署到一台真正的云服务器（VPS）上！

**最终目标：** 输入服务器的公网 IP，全世界都能访问你的博客！

---

## 一、准备工作

在开始之前，请确保你拥有：

1.  一台 **Linux 云服务器**（推荐 Ubuntu 系统）。
2.  服务器的 **公网 IP 地址**。
3.  **root 账户密码**。

---

## 二、第一步：服务器初始化

### 1. 连接服务器

打开终端（CMD/PowerShell），在以ROOT身份的情况下使用 SSH 连接：

```bash
ssh root@123.45.67.89  # 把 IP 换成你的
```

### 2. 创建普通用户（安全第一！）

**永远不要直接用 root 跑程序！** 我们创建一个名为 `wind` 的用户（你最好换成自己的名字，记得下文都要对应修改）。

```bash
adduser wind       # 创建用户，按提示设置密码
usermod -aG sudo wind  # 赋予管理员权限
su - wind          # 切换到新用户（之后的步骤都在这个用户下进行！）
```

### 3. 安装基础环境

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nginx git python3-venv python3-pip -y
```

### 4. 安装新版 Node.js (关键！)

构建 Vue3 项目需要较新的 Node 版本：

```bash
# 安装 Node.js v18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 检查版本（确保是 v18+）
node -v
```

---

## 三、第二步：代码部署与构建

### 1. 拉取代码

**注意：这里要 Clone 你自己的仓库！** 这样才能包含你上一篇教程里做的装修修改。

```bash
cd ~
# 把下面的链接换成你自己的 GitHub 仓库地址
git clone https://github.com/你的用户名/你的仓库名.git
cd 你的仓库文件夹名
```

### 2. 前端构建 (Vue3)

```bash
npm install   # 安装依赖
npm run build # 打包构建
```

构建完成后，根目录下会生成一个 `dist` 文件夹，这就是我们要发布的网站。

### 3. 后端环境 (Flask)

```bash
cd backend

# 创建并激活虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
pip install gunicorn  # 安装生产级服务器

# 初始化配置
nano .env

# 然后保存好 JWT_SECRET_KEY='这里用数字英文等写一个足够长且复杂的随机密钥因为这关系到博客安全' 并退出

export FLASK_APP=app.py

# 初始化数据库（会读取你修改过的 json 数据）
flask create-admin # 创建管理员
python init_db.py  # （可选） 迁移legacy_data下的示例数据
```

---

## 四、第三步：配置后台服务 (Systemd)

我们需要让后端程序在后台持续运行，并开机自启。

```bash
sudo nano /etc/systemd/system/blog.service
```

**复制并修改**以下内容（注意替换 `wind` 为你的用户名，`blog0fwindchan` 为你的项目文件夹名）：

```ini
[Unit]
Description=Gunicorn instance for Blog
After=network.target

[Service]
User=wind
Group=www-data
WorkingDirectory=/home/wind/blog0fwindchan/backend
Environment="PATH=/home/wind/blog0fwindchan/backend/venv/bin"
# 启动命令：绑定到 socket 文件，性能更高
ExecStart=/home/wind/blog0fwindchan/backend/venv/bin/gunicorn --workers 3 --bind unix:blog.sock -m 007 app:app

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl start blog
sudo systemctl enable blog
sudo systemctl status blog # 看到绿色的 active (running) 就成功了！
```

---

## 五、第四步：配置 Nginx 反向代理

Nginx 负责把用户的请求分发给前端页面或后端 API。

```bash
sudo nano /etc/nginx/sites-available/blog
```

**复制并修改**以下内容：

```nginx
server {
    listen 80;
    server_name 123.45.67.89; # 换成你的 IP 或域名

    # 1. 前端静态页面
    root /home/wind/blog0fwindchan/dist;
    index index.html;

    # 2. 静态资源/图片代理 (关键！确保图片能显示)
    location /static/ {
        alias /home/wind/blog0fwindchan/backend/static/;
        expires 30d;
    }

    # 3. API 转发给 Gunicorn
    location /api {
        include proxy_params;
        proxy_pass http://unix:/home/wind/blog0fwindchan/backend/blog.sock;
    }

    # 4. 前端路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

激活配置：

```bash
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled
sudo chmod 755 /home/wind # 赋予 Nginx 访问权限
sudo nginx -t             # 检查配置语法
sudo systemctl restart nginx
```

---

## 六、大功告成！

现在，打开浏览器，输入你的服务器 IP。  
如果一切顺利，你应该能看到那个**你亲手装修过**的博客首页了！🎉

**接下来怎么办？** 网站上线后，如何更新内容？如何修复 Bug？  
👉 **请看下一篇《日常维护：如何更新与照顾你线上的博客》**

---

> 没有未来的小风酱 敬上
