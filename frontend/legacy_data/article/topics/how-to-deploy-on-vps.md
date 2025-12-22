# 4. 日常维护：如何更新与照顾你线上的博客

> **目标读者**：已经成功部署了博客，并想知道如何更新线上网站内容和代码的朋友们。

---

## 零、前言：网站是需要“浇水施肥”的！

恭喜你，你的博客已经在云端稳定运行了！

但是，当你以后在本地写了新功能，或者换了个新 Logo，怎么把它同步到线上的服务器呢？

这篇教程就是你的“网站园丁手册”。

---

## 一、我有新代码了！- 标准更新流程

这个流程的核心思想是：**本地修改 -> 推送 GitHub -> 服务器拉取 -> 重启服务**。

### 第 1 步：本地修改与推送 (Local)

在你的电脑上修改完代码后，记得三连击：

```bash
git add .
git commit -m "更新了某个功能"
git push origin main
```

**确保 GitHub 上已经是最新代码，再进行下一步。**

### 第 2 步：服务器拉取代码 (Server)

登录你的服务器：

```bash
ssh 你的用户名@你的IP
cd ~/你的项目文件夹
git pull origin main
```

### 第 3 步：更新前端 (Server)

如果你修改了 `frontend/` 下的 Vue 文件、CSS 或图片，需要重新打包：

```bash
cd frontend   # <--- 关键：进入前端目录
npm install   # (可选) 如果没加新依赖可以跳过
npm run build # 重新构建 dist 目录
```

构建完成后，记得重启 Nginx（或者如果你只是替换了静态文件，通常不需要重启，但为了保险起见）：

```bash
sudo systemctl restart nginx
```

### 第 4 步：更新后端 (Server)

如果你修改了 `backend/` 下的 Python 代码：

```bash
cd ../backend # 如果你刚才在 frontend，记得切回来
# 或者直接 cd ~/你的项目文件夹/backend

# 重启后端服务
sudo systemctl restart blog
```

_后端代码必须重启服务才会生效！_

---

## 二、“救命！网站挂了！” - 简单排错

如果更新后网站打不开（502 Bad Gateway），通常是后端报错了。

**1. 检查服务状态**

```bash
sudo systemctl status blog
```

如果是红色的 `failed`，说明启动失败。

**2. 查看报错日志**
这是最管用的招数！它会告诉你具体错在哪一行。

```bash
# 查看最后 50 行后端日志
sudo journalctl -u blog -n 50 --no-pager
```

根据日志里的 `Traceback` 提示，在本地修复代码，然后重新走一遍 **第 1 步** 到 **第 4 步** 的流程。

---

祝你的博客稳定运行，内容常新！( •̀ ω •́ )✧

> 没有未来的小风酱 敬上

````

---

### 3. `how-to-deploy-on-vps.md`

主要修改了 **前端构建** 步骤（增加 `cd frontend`）和 **Nginx 配置**（`root` 路径更新为 `frontend/dist`）。

```markdown
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
````

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
cd frontend   # <--- 关键：进入前端目录

npm install   # 安装依赖
npm run build # 打包构建
```

构建完成后，`frontend` 目录下会生成一个 `dist` 文件夹，这就是我们要发布的网站。

### 3. 后端环境 (Flask)

```bash
cd ../backend # 返回上级并进入 backend 目录

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
# 注意：工作目录现在是 backend 子目录
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

**复制并修改**以下内容。

**⚠️ 注意**：`root` 路径现在多了一层 `/frontend`！

```nginx
server {
    listen 80;
    server_name 123.45.67.89; # 换成你的 IP 或域名

    # 1. 前端静态页面 (注意这里指向 frontend/dist)
    root /home/wind/blog0fwindchan/frontend/dist;
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
