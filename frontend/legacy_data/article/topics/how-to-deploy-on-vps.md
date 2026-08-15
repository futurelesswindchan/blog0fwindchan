# 🚀 2. 部署到云服务器：构筑坚不可摧的赛博堡垒 (Nginx + Gunicorn)

> **🎯 目标冒险者**：已经完成上一篇个性化定制，并且把代码妥妥地推送到自己 Fork 仓库的小伙伴。
>
> **💻 系统环境**：本卷轴基于 **Ubuntu 24.04 LTS** 魔法阵编写，如果你使用的是其他系统，请自行转换对应的法术（命令）哦。
>
> **🚨 红色安全警告**：本卷轴包含了**完整**的服务器安全加固流程。请永远记住，在真实的互联网黑暗森林里，服务器从上线的第一秒起，就会被无数自动化的“野生哥布林（扫描器）”疯狂敲门。**安全加固绝对不是选修课，而是保命的必修课！**

---

## 一、出发前的行囊检查 (准备工作)

在念动咒语前，请确认你已经凑齐了以下法宝：

1. 一台运行着 Ubuntu 24.04 LTS 的云服务器，并把它的**公网 IP 地址**写在小本本上。
2. 服务器的 **root 账户密码**（这把万能钥匙我们只用这一次，后面就会把它封印起来！）。
3. 一个域名（强烈推荐！），并且已经接入了 **Cloudflare** 的 DNS 代理（我们的免费大护盾）。
4. 上一篇教程已通关：代码已经乖乖躺在你的 GitHub Fork 仓库里啦。

---

## 二、打地基与升起护盾 (服务器初始化与安全加固)

### 2.1 敲开服务器的大门

```bash
ssh root@<你的服务器IP>
```

### 2.2 给系统喂经验书 (更新系统)

```bash
apt update && apt upgrade -y
```

### 2.3 召唤专属小管家 (创建普通用户)

千万不要让国王（ROOT）天天穿着拖鞋跑腿运行程序，太危险啦！我们来召唤一个专属小管家（新建用户）：

```bash
adduser <你的用户名>
usermod -aG sudo <你的用户名>
```

### 2.4 锻造魔法铭牌 (配置 SSH 密钥登录)

密码登录太容易被暴力破解啦。我们要锻造一把独一无二的“魔法铭牌”（SSH 密钥）。

**👉 请在你自己的本地小电脑上执行：**

```bash
ssh-keygen -t ed25519 -C "<写句自己喜欢的备注>"
```

**👉 将魔法铭牌（公钥）上传到服务器：**

如果是 Linux / macOS 玩家：

```bash
ssh-copy-id <你的用户名>@<你的服务器IP>
```

如果是 Windows 玩家（我们需要手动搬运）：

```bash
# 在本地电脑上查看公钥内容，把输出的那一长串乱码完整复制下来
cat ~/.ssh/id_ed25519.pub
```

然后回到服务器的 root 终端，手动贴上去：

```bash
mkdir -p /home/<你的用户名>/.ssh
nano /home/<你的用户名>/.ssh/authorized_keys
# 粘贴你刚刚复制的公钥内容，按 Ctrl+O 保存，按 Ctrl+X 退出

chown -R <你的用户名>:<你的用户名> /home/<你的用户名>/.ssh
chmod 700 /home/<你的用户名>/.ssh
chmod 600 /home/<你的用户名>/.ssh/authorized_keys
```

**✅ 验证铭牌（在本地新开一个终端窗口）：**

```bash
ssh <你的用户名>@<你的服务器IP>
# 如果不需要输入密码就能直接进去，就说明铭牌锻造成功啦！(撒花🎉)
```

### 2.5 封印旧大门 (禁用密码登录与 root 远程登录)

> ⚠️ **风酱的警告**：**必须必须必须**先确认上面的 2.4 步骤成功了，确保你能用密钥登进去，再执行这一步！\
> 如果不小心搞错了，你就会永远被锁在自己的服务器外面啦 QAQ！！！

```bash
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

### 2.6 升起防洪大坝 (配置 UFW 防火墙)

```bash
sudo apt install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 2.7 净化隐匿的毒沼 (禁用非必要内核模块 CVE-2026-31431)

风酱自己部署博客的服务器实例曾经被一种叫 Ebury 的恶毒史莱姆（恶意软件）感染过。\
执行下面这两句咒语，可以封印它们用来提权的内核通道，对正常博客运行没有任何影响，属于超级打底的防御加成！

```bash
echo "install algif_aead /bin/false" | sudo tee /etc/modprobe.d/disable-algif.conf
sudo rmmod algif_aead 2>/dev/null
```

---

## 三、布置施法台 (安装基础环境)

**⚠️ 注意：从现在开始，所有的操作都用你刚刚召唤的【普通用户】身份执行哦（不要用 root 啦）。**\
你需要退出 root 终端，重新用普通用户登录~

### 3.1 搬运基础工具

```bash
sudo apt install -y git python3 python3-pip python3-venv libmagic1
```

> 🕳️ **避坑仙人指路**：注意最后那个 `libmagic1`！它是后端文件上传功能的“隐藏守护者”。如果不装这个系统库，你的文件上传功能绝对会当场罢工，而且报错还会极其隐蔽！

### 3.2 组装前端建造锤 (安装 Node.js)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 验货（需要 v22+ 以上哦）
node -v && npm -v
```

### 3.3 聘请大门守卫 (安装最新版 Nginx)

Ubuntu 自带的 Nginx 守卫已经 OUT 啦，身上有漏风的破洞（安全漏洞）。\
我们要直接去 Nginx 官方雇佣最强壮的守卫（>= 1.30.1版）。

```bash
curl -fsSL https://nginx.org/keys/nginx_signing.key | sudo gpg --dearmor -o /usr/share/keyrings/nginx-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] http://nginx.org/packages/ubuntu $(lsb_release -cs) nginx" | sudo tee /etc/apt/sources.list.d/nginx.list

sudo apt update && sudo apt install -y nginx

# 看看守卫的等级是不是最新的
nginx -v
```

> **💡 官方守卫和 Ubuntu 自带守卫的区别：**
>
> - 工作地点变啦：站点配置目录在 `/etc/nginx/conf.d/`，再也没有 `sites-available` 这些绕晕人的文件夹了。
> - 少了个小抄：没有自带 `proxy_params` 文件，我们需要手动写给他。
> - 名字变啦：默认运行用户叫 `nginx`，不叫 `www-data` 啦。

**手写 proxy_params 转发小抄：**

```bash
sudo tee /etc/nginx/proxy_params << 'EOF'
proxy_set_header Host $http_host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
EOF
```

> **为什么要写这个？** 咱们后端的防刷限流器需要抓取访客的真实 IP。\
> 如果不写，限流器会把所有人都当成一个人（`127.0.0.1`），然后把正常访客也给全封了 QAQ！

**给守卫发通行证（解决 Socket 权限问题）：**

```bash
sudo usermod -aG www-data nginx
```

---

## 四、召唤博客本体 (代码部署与构建)

### 4.1 把代码拉入法阵

```bash
cd ~
git clone https://github.com/<你的GitHub用户名>/<你的Fork仓库名>.git
cd <项目文件夹名>
```

### 4.2 锻造前端橱窗

```bash
cd frontend
npm install
npm run build
# 辛苦锻造出的宝贝都在 frontend/dist/ 目录里啦！
```

### 4.3 唤醒后端核心

```bash
cd ../backend

python3 -m venv venv
source venv/bin/activate

# 注入魔力（安装依赖，里面已经包含了 gunicorn 啦）
pip install -r requirements.txt
```

创建线上的 `.env` 文件：

```bash
nano .env
```

写上这些（注意，线上的 `FLASK_DEBUG` 必须是 `False` 哦！）：

```properties
FLASK_DEBUG=False
JWT_SECRET_KEY=<贴上你生成的随机乱码>
CORS_ORIGINS=https://<你的域名>

如果没有域名的话...那么就应该填该服务器的公网 IP 地址（包括协议和端口，如果有）
```

> 🔑 生成随机乱码的咒语：`python -c "import secrets; print(secrets.token_hex(32))"`

初始化数据库并建立管理员:

```bash
# 建表 + 写入默认分类
flask db init

# 创建超级管理员账号
flask admin create

# （🎁 选做）拆开新手礼包导入演示数据
# ⚠️ 同样注意：这会清空表数据哦，只适合第一次搬家！
python init_db.py
```

---

## 五、让博客变成不知疲倦的打工人 (配置 Systemd)

我们要给后端配置一个“永动法阵”，即使我们关掉终端，它也能自己在后台默默运行。

```bash
sudo nano /etc/systemd/system/blog.service
```

把下面这些抄进去（把 `<占位符>` 换成你自己的内容哦）：

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

启动并让它开机自启：

```bash
sudo systemctl daemon-reload
sudo systemctl start blog
sudo systemctl enable blog
sudo systemctl status blog
# 看到绿色的 active (running) 就说明它已经在努力打工啦！
```

---

## 六、史诗级权限大坑 (目录穿越权限) 💥

**敲黑板！！这是无数萌新在此折戟沉沙的地方！！OAO**\
Nginx 守卫（`nginx` 用户）要去访问后端的 socket 文件，**它走过的每一层地砖（目录）都必须有通行权限（`x`）**！光给 socket 赋予权限是没用的！

快念这三句咒语打通道路：

```bash
chmod o+x /home/<你的用户名>
chmod o+x /home/<你的用户名>/<项目文件夹名>
chmod o+x /home/<你的用户名>/<项目文件夹名>/backend
```

---

## 七、告诉守卫如何接客 (配置 Nginx 反向代理)

这里有两个方案，风酱把它们折叠起来啦，请根据你的情况选择哦：

<details>
<summary><b>📜 方案 A：纯 HTTP 裸奔方案 (没有域名 / 只是测测看)</b></summary>
<br>

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

</details>

<details open>
<summary><b>🛡️ 方案 B：HTTPS + Cloudflare 终极装甲方案 (强烈推荐！)</b></summary>
<br>

_对啦对啦，此方案还是专门面向 SEO 有优化的哦，配合博客后端的 SEO 优化模块一起生效0w0_

如果你用了 Cloudflare，可以去领一张**有效期长达 15 年**的免费源站证书哦！

1. 去 Cloudflare 面板 → SSL/TLS → 源服务器 → 创建证书。
2. 把证书保存在服务器里：

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

    # 站点地图导航：让爬虫直接去找 Flask 后端拿 sitemap
    location = /sitemap.xml {
        include proxy_params;
        proxy_pass http://unix:/home/<你的用户名>/<项目文件夹名>/backend/blog.sock;
    }

    # 蜘蛛照妖镜 (文章详情页)：
    # 爬虫走 Flask (获取带 SEO 信息的轻量 HTML)，普通人类访客走 SPA！
    location ~* ^/articles/[^/]+/[^/]+ {
        set $is_bot 0;
        if ($http_user_agent ~* "(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver)") {
            set $is_bot 1;
        }
        if ($is_bot = 1) {
            proxy_pass http://unix:/home/<你的用户名>/<项目文件夹名>/backend/blog.sock;
        }
        try_files $uri $uri/ /index.html;
    }

    # 蜘蛛照妖镜 (分类列表页)：同上原理
    location ~* ^/articles/[^/]+$ {
        set $is_bot 0;
        if ($http_user_agent ~* "(googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|sogou|exabot|facebot|ia_archiver)") {
            set $is_bot 1;
        }
        if ($is_bot = 1) {
            proxy_pass http://unix:/home/<你的用户名>/<项目文件夹名>/backend/blog.sock;
        }
        try_files $uri $uri/ /index.html;
    }

    # 其余的普通页面，统统回前端 SPA 橱窗
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

</details>

**激活守卫配置：**

```bash
sudo rm -f /etc/nginx/conf.d/default.conf  # 删掉默认的捣乱配置
sudo nginx -t                              # 测试一下有没有拼写错误
sudo systemctl restart nginx               # 重启守卫
```

---

## 八、验收奇迹的时刻 ✨

在浏览器里敲下你的域名或者服务器 IP。如果那座漂亮的博客小站跃然屏上——\
**恭喜你！！你战胜了最硬核的关卡！你现在是一名真正拥有自己赛博领地的站长啦！！** (疯狂撒花 🌸🎉🎆)

---

<details>
<summary><b>📋 附录 A：强迫症福音 (部署检查清单)</b></summary>

完成部署后，来玩个打勾游戏吧，全绿了才算完美通关哦：

- [ ] 魔法铭牌（SSH 密钥登录）已配置成功
- [ ] 危险的旧大门已封印（`PasswordAuthentication no`）
- [ ] 国王无法远程乱跑（`PermitRootLogin no`）
- [ ] UFW 防洪大坝已开启，仅放行 22 / 80 / 443
- [ ] `libmagic1` 隐藏守护者已安装
- [ ] 守卫（Nginx）版本 >= 1.30.1
- [ ] 毒沼内核模块 `algif_aead` 已被净化
- [ ] `nginx` 守卫已拿到 `www-data` 通行证
- [ ] **三层地砖（目录）均已施加 `chmod o+x` 魔法**
- [ ] `nginx.conf` 里写的是 `location /api/`（有斜杠！）
- [ ] `proxy_params` 里带上了 `X-Forwarded-For`
- [ ] `.env` 里的 `FLASK_DEBUG` 设为了 `False`
- [ ] `.env` 里的 `CORS_ORIGINS` 填了正确的域名（或公网 IP）
</details>

<details>
<summary><b>💊 附录 B：赛博急救箱 (常见问题排错)</b></summary>

**Q：满屏全是 502 Bad Gateway 怎么办 QAQ？**
别急！按顺序排查：

1. 看看打工人还在不在：`sudo systemctl status blog`
2. 看看信物（socket）在不在：`ls -la ~/<项目文件夹名>/backend/blog.sock`
3. 看看地砖权限（每一层都要有 o+x 哦）：`ls -ld /home/<你的用户名>/<项目文件夹名>/backend`
4. 看看守卫组别：`groups nginx`（必须有 www-data）

**Q：F12 报错 CORS 跨域拦截？**
快去查查 `backend/.env` 里的 `CORS_ORIGINS`，是不是少写了 `https://`，或者域名拼错了？改完记得 `sudo systemctl restart blog` 呀！

**Q：上传图片总是失败，后台偷偷报 `magic` 错误？**
一定是忘了请守护者！执行 `sudo apt install -y libmagic1`，然后再重启一遍 blog 服务。

</details>

---

> 没有未来的小风酱 敬上
