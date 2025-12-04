# 进阶之路：如何将你的博客部署到云服务器

> 声明：本教程面向有一定命令行基础，并希望将博客部署到自己服务器的朋友。  
> 教程使用的命令基于 **Ubuntu/Debian** 系统，如果你的服务器是 CentOS 等其他 Linux 发行版，请将 `apt` 命令替换为对应的 `yum` 或 `dnf` 哦！

---

## 零、前言：从“我的电脑”到“云端世界”

恭喜你！能读到这里，说明你已经成功在自己的电脑上（也就是“本地”）运行起了风风博客并迁移了实例数据。

但现在，只有你自己能看到它。

想不想让你的朋友、同学，甚至全世界的网友都能随时随地访问你的博客？(✪ω✪)

这篇教程，就是手把手带你完成从“本地玩具”到“线上产品”的蜕变，将你的博客部署到一台真正的云服务器（VPS）上！

**我们的目标很简单：** 通过服务器的公网 IP 地址，就能访问到你的博客网站！

---

## 一、准备工作：你需要什么？

在开始之前，请确保你已经拥有：

1.  一台已经购买好的、装有 Linux 系统的云服务器 (VPS)。
2.  这台服务器的 **公网 IP 地址**、 **root 账户密码**。

> 本教程不会详细讲解如何购买 VPS 和域名，这些可以很容易地在搜索引擎找到教程。

---

## 二、第一步：登录并“打扫”你的新服务器

新拿到的服务器就像一个毛坯房，我们需要先把它打扫干净，做好安全措施。

### 1. 连接你的服务器

打开你电脑的终端（Windows 用户请使用 CMD、PowerShell 或 Windows Terminal），使用 SSH 命令连接服务器。

```bash
# 把 [你的服务器公网IP] 换成你自己的 IP 地址
ssh root@[你的服务器公网IP]
```

> 有需要请参考这篇微软官方文档：[在 Windows 上使用 SSH 客户端](https://learn.microsoft.com/zh-cn/windows-server/administration/openssh/openssh-overviewe)

连接过程中，如果提示 `Are you sure you want to continue connecting?`，输入 `yes` 回车。

然后输入你的 `root` 密码（注意：输入时屏幕上不会显示任何字符，这是Linux的安全设计），回车。

看到 `Welcome to...` 之类的欢迎语，你就成功进入服务器啦！

### 2. 安全第一！创建你自己的账户

**警告：** 直接使用 `root` 账户操作服务器是非常危险的！一不小心就会...把服务器搞挂掉！

我们必须创建一个属于自己的普通用户，并赋予它管理员权限。

```bash
# 1. 修改 root 账户的初始密码，设置一个更复杂的密码
passwd

# 2. 创建一个你自己的新用户，比如叫 a_cool_user
#    请把 a_cool_user 换成任何你喜欢的英文名，以后我们都用这个账户登录
adduser a_cool_user

# 3. 赋予这个新用户 sudo（临时管理员）权限
usermod -aG sudo a_cool_user
```

> **提示：** 在执行 `adduser` 时，系统会让你设置新密码，然后询问一些额外信息（如 Full Name），这些都可以直接按回车跳过。千万别照抄 `a_cool_user` 哦，除非你真的觉得这个名字很酷！( ´∀｀)

现在，**断开当前的 SSH 连接** (`exit`)，然后用你的**新账户**重新登录：

```bash
# 用你刚刚创建的用户名登录
ssh a_cool_user@[你的服务器公网IP]
```

从现在开始，我们所有的操作都在这个新账户下进行！

### 3. 给服务器“洗个澡”（更新软件）

```bash
# 更新系统软件列表
sudo apt update

# 将所有已安装的软件升级到最新版本
sudo apt upgrade -y
```

> 再提醒一次哦！ apt 是 Ubuntu/Debian 系统的包管理器，如果你用的是其他发行版，请使用对应的包管理命令，如 yum 或 dnf。

### 4. 安装我们的“生产工具”

```bash
# 一次性安装 Nginx(Web服务器), Git(代码管理), Python环境, Node.js和npm
sudo apt install nginx git python3-venv nodejs npm -y
```

---

## 三、第二步：把你的博客代码“搬”上服务器

### 1. 从 GitHub 克隆项目

```bash
# 如果有，则把 https://github.com/futurelesswindchan/blog0fwindchan.git 换成你自己的仓库地址
# 如果你想知道怎么把你在本地改好的，属于你的博客代码上传到 GitHub，可以参考我的另一篇教程哦！
git clone https://github.com/futurelesswindchan/blog0fwindchan.git

# 进入项目目录，比如仓库名叫 blog0fwindchan
cd blog0fwindchan
```

### 2. 构建前端静态文件

```bash
# 安装前端依赖（可能需要几分钟）
npm install

# 执行打包构建
npm run build
```

执行完毕后，项目根目录下会多出一个 `dist` 文件夹，这里面就是你博客的前端静态文件。

平时你在IDE里编辑的那些VUE文件，浏览器是看不到的，只有打包后的静态文件（就是dist里面啦）才能被浏览器识别。

### 3. 配置后端环境

```bash
# 1. 进入后端目录
cd backend

# 2. 创建并激活 Python 虚拟环境
python3 -m venv venv
source venv/bin/activate

# 3. 安装后端依赖
pip install -r requirements.txt

# 4. 【关键】创建生产环境的 .env 文件
#    我们用一个叫 nano 的编辑器来创建一个叫 .env 的新文件
nano .env

#    在打开的空文件中，粘贴下面这行内容，并把密钥改成你自己的！
#
#    JWT_SECRET_KEY='a-super-long-and-random-string-for-your-production-site'
#
#    不要完完全全照抄'a-super-long-and...'哦！这个密钥非常重要，它关系到你博客的安全性。
#    粘贴后，按 Ctrl+X，再按 Y，最后按 Enter 保存退出。

# 5. 【关键】创建线上管理员账户
#    首先，告诉 flask 我们的主程序是哪个
export FLASK_APP=app.py
#    然后创建管理员，按提示输入你的管理员用户名和密码
flask create-admin

# 6. [可选]初始化数据库，填充示例文章
python init_db.py

# 7. 测试运行后端，确保一切正常
python app.py
# 如果看到类似下面的输出，说明后端运行正常：
#  * Running on http://127.0.0.1:5000/
```

---

## 四、第三步：让博客 24 小时在线！

现在，你的代码和数据都准备好了。但我们不能用 `python app.py` 来线上运行，因为它太脆弱了。

我们需要一个专业的“项目经理” **Gunicorn** 和一个“系统管家” **Systemd**。

### 1. 安装 Gunicorn

```bash
# 先按下 Ctrl+C 停止当前运行的app.py
# 确保你还在 backend 目录的 (venv) 虚拟环境下
pip install gunicorn
```

### 2. 编写 Systemd 服务文件

这个文件会告诉服务器系统：如何启动、管理、并开机自启你的博客后端。

```bash
# 这需要管理员权限
sudo nano /etc/systemd/system/blog.service
```

在打开的空文件中，**完整复制并粘贴**以下内容。**注意：** 把 `[你的用户名]` 换成你之前创建的服务器用户名（比如 `a_cool_user`）。

```ini
[Unit]
Description=Gunicorn instance for Wind Chan's Blog
After=network.target

[Service]
# 把下面的 [你的用户名] 换掉！blog0fwindchan 是你的项目文件夹名吗？如果不是，也请一并修改！
User=[你的用户名]
Group=www-data
WorkingDirectory=/home/[你的用户名]/blog0fwindchan/backend
Environment="PATH=/home/[你的用户名]/blog0fwindchan/backend/venv/bin"
ExecStart=/home/[你的用户名]/blog0fwindchan/backend/venv/bin/gunicorn --workers 3 --bind unix:blog.sock -m 007 app:app

[Install]
WantedBy=multi-user.target
```

保存并退出 (`Ctrl+X`, `Y`, `Enter`)。

### 3. 启动并验证服务

```bash
# 启动你的博客服务
sudo systemctl start blog

# 设置开机自启
sudo systemctl enable blog

# 检查服务状态
sudo systemctl status blog
```

如果看到一行**绿色**的 `active (running)`，恭喜你，你的博客后端已经在服务器上稳定运行了！

---

## 五、最后一步：Nginx - 世界的入口

现在，我们需要配置 Nginx，让它把来自外部世界的访问请求，正确地指向你的博客前端和后端。

### 1. 编写 Nginx 配置文件

```bash
# 先按ctrl+c 停止 status 查看
sudo nano /etc/nginx/sites-available/blog
```

**完整复制并粘贴**以下内容。记得把 `[你的服务器公网IP]` 和 `[你的用户名]` 以及`blog0fwindchan`换成你自己的！

```nginx
server {
    listen 80;
    # 把这里换成你的 IP 地址
    server_name [你的服务器公网IP];

    # 网站根目录，指向前端打包好的 dist 文件夹
    # 把 [你的用户名] 换成你自己的！同时，如果你的项目文件夹名不是 blog0fwindchan，也请一并修改！
    root /home/[你的用户名]/blog0fwindchan/dist;
    index index.html;

    # 默认请求处理，适配 Vue Router 的 History 模式
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 请求转发，交给 Gunicorn 处理
    location /api {
        # 把 [你的用户名] 换成你自己的！
        proxy_pass http://unix:/home/[你的用户名]/blog0fwindchan/backend/blog.sock;
    }
}
```

保存并退出。

### 2. 启用配置并解决权限问题

```bash
# 激活你的博客配置
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled

# 【超级无敌史诗级常见问题】解决 Nginx 无法访问用户目录的权限问题
# 这一步是让 Nginx 有权限“路过”你的用户主目录
sudo chmod 755 /home/[你的用户名]

# 检查 Nginx 配置语法是否正确
sudo nginx -t

# 重启 Nginx 让所有配置生效
sudo systemctl restart nginx
```

---

## 六、大功告成！

现在！立刻！马上！打开你电脑的浏览器，在地址栏输入你的服务器公-网-IP！

`http://[你的服务器公网IP]`

如果一切顺利，你将会看到你那熟悉又漂亮的博客首页，活生生地运行在广阔的互联网之上！

这趟旅程辛苦啦，但现在，你已经是一位名副其实的全栈开发者了！快去把你的网站地址分享给朋友们吧！(๑•̀ㅂ•́)

> 没有未来的小风酱 敬上
