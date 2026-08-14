# 3. 日常维护：如何更新与照顾你线上的博客

> **目标读者**：已完成生产部署，需要了解如何将本地的代码变更同步到线上服务器的开发者。

---

## 一、标准更新流程

核心思路：**本地修改 → 推送到 GitHub → 服务器拉取 → 重启服务**。

### 第 1 步：本地提交并推送

```bash
git add .
git commit -m "描述本次变更"
git push origin main
```

确认 GitHub 上已是最新代码后，再进行后续步骤。

### 第 2 步：服务器拉取代码

```bash
ssh <你的用户名>@<你的服务器IP>
cd ~/<项目文件夹名>
git pull origin main
```

### 第 3 步：更新前端（如有前端变更）

如果修改了 `frontend/` 下的 Vue 文件、CSS 或其他静态资源，需要重新构建：

```bash
cd frontend
npm install   # 如有新依赖则执行，否则可跳过
npm run build
```

构建完成后重载 Nginx：

```bash
sudo systemctl reload nginx
```

### 第 4 步：更新后端（如有后端变更）

如果修改了 `backend/` 下的 Python 代码，必须重启服务才能生效：

```bash
cd ~/<项目文件夹名>/backend
sudo systemctl restart blog
```

---

## 二、CLI 命令速查

后端所有管理操作通过 `flask` 命令组执行。**执行前需确保已激活虚拟环境，且位于 `backend/` 目录下。**

```bash
cd ~/<项目文件夹名>/backend
source venv/bin/activate
```

| 命令 | 说明 |
| :--- | :--- |
| `flask db init` | 建表并写入默认分类（首次部署时执行） |
| `flask db fix` | 检查并修复数据库表结构（从旧版本升级时使用） |
| `flask admin create` | 创建管理员账号 |
| `flask admin reset-pw` | 重置指定管理员的密码 |

---

## 三、常见问题排错

### 更新后出现 502 Bad Gateway

通常是后端服务启动失败。

```bash
# 查看服务状态
sudo systemctl status blog

# 查看详细错误日志（最后 50 行）
sudo journalctl -u blog -n 50 --no-pager
```

根据日志中的 `Traceback` 信息定位错误，在本地修复后重新走一遍标准更新流程。

### 忘记管理员密码

```bash
flask admin reset-pw
# 按提示输入用户名和新密码
```

### 前端更新后浏览器仍显示旧版本

浏览器缓存问题。强制刷新（`Ctrl + Shift + R` / `Cmd + Shift + R`）即可。如果问题持续，检查 Nginx 是否已正确重载：

```bash
sudo systemctl reload nginx
```

---

> 没有未来的小风酱 敬上
