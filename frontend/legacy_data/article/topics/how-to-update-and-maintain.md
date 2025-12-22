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
