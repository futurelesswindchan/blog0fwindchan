# Vol.7 后台管理（下）：JWT 鉴权与安全防线

> **摘要**：如果说 CMS 是博客的躯壳，那鉴权系统就是它的灵魂。本篇将深入探讨 JWT 双 Token 机制（Access + Refresh），利用 Axios 拦截器实现无感刷新，并配合路由守卫打造一个生人勿进的绝对领域!

---

## 0. 前言：忘装大门的金库？

上一集小风酱为了偷懒不写 JSON 而肝出了一个功能强大的 CMS 后台，结果上线前一秒突然意识到一个惊悚的事实——

这后台是裸奔的啊！QAQ

现在的状态是：只要屏幕前的读者们猜到了 /admin/dashboard 这个地址，就能进来把风风博客删个精光，甚至还能顺手发一篇《博主是笨蛋杂鱼》！

为了防止这种赛博惨剧发生，也为了守护小风酱的数字财产，今天这篇不谈偷懒，目标是把这扇防盗门焊死！

## 1. 理论篇：游乐园门票哲学

在写代码之前，先搞懂 **JWT** 的机制。
可以把后台管理想象成一个**迪士尼乐园**：

1.  **登录 (Login)**：在门口出示身份证（账号密码），检票员确认无误后，给你两样东西：

    - 🎫 **Access Token (门票)**：有效期短（比如 1 小时）。玩项目（调接口）时出示它。
    - 💳 **Refresh Token (凭证)**：有效期长（比如 30 天）。藏在口袋里，平时不用。

2.  **访问 (Request)**：去玩过山车（保存文章），工作人员看了一眼你的**门票**，放行。

3.  **过期 (Expired)**：玩了 1 小时，**门票**失效了。工作人员拦住你：“票过期了”。

4.  **刷新 (Refresh)**：你不用回大门口重新排队（重新登录）。只需要掏出口袋里的 **凭证** 去服务台，换一张新的 **门票**，然后继续玩。

这就是下面将要实现的 **双 Token 机制**。

---

## 2. 后端防线：Flask 与 JWT

在后端，使用了 `flask-jwt-extended` 库来颁发和验证这些票据。

### 2.1 颁发 Token (Login)

当管理员输入正确的账号密码后，后端会生成两串加密字符串：

```python
# backend/app.py

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    # ... 验证账号密码逻辑 ...
    if user and user.check_password(password):
        # 颁发双 Token
        # identity 建议存用户 ID，方便后续查询
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        return jsonify(access_token=access_token, refresh_token=refresh_token)
```

### 2.2 刷新 Token (Refresh)

这是服务台接口。注意 `@jwt_required(refresh=True)`，这意味着这个接口只认 **Refresh Token**。

```python
@app.route("/api/admin/refresh", methods=["POST"])
@jwt_required(refresh=True) # 👈 关键点：只验证刷新令牌
def refresh():
    current_user_id = get_jwt_identity()
    # 签发一张新的 Access Token
    new_access_token = create_access_token(identity=current_user_id)
    return jsonify(access_token=new_access_token)
```

---

## 3. 前端中枢：Pinia Store

前端需要一个管家来保管这两张票。所以创建了 `adminStore`。

它做的事情很简单：

1.  **存**：登录成功后，把 Token 存进 `localStorage`（持久化）和 `ref`（内存）。
2.  **取**：提供 `isAuthenticated` 计算属性，判断当前是否登录。
3.  **删**：登出时，把所有痕迹擦得干干净净。

```typescript
// src/views/stores/adminStore.ts
export const useAdminStore = defineStore('admin', () => {
  // 初始化时尝试从 localStorage 读取
  const access_token = ref<string | null>(localStorage.getItem('access_token'))
  const refresh_token = ref<string | null>(localStorage.getItem('refresh_token'))

  const isAuthenticated = computed(() => !!access_token.value)

  const login = async (username, password) => {
    // ... 调用登录接口，保存 Token ...
  }

  const logout = () => {
    access_token.value = null
    refresh_token.value = null
    localStorage.clear()
    router.push({ name: 'AdminLogin' }) // 踢回登录页
  }

  return { access_token, refresh_token, isAuthenticated, login, logout }
})
```

---

## 4. 核心黑科技：Axios 拦截器

这是本篇最精彩的部分。
为了让用户感觉不到 Token 过期的存在，需要在网络请求层做一个**自动重试机制**。

在 `src/api/index.ts` 里可以看到配置了两个拦截器：

### 4.1 请求拦截器：自动带票

每次发请求前，自动把 Access Token 塞进 Header 里。

```typescript
// src/api/index.ts
api.interceptors.request.use((config) => {
  const adminStore = useAdminStore()
  // 如果有票，且不是去刷新票的请求（防止死循环），就带上
  if (adminStore.access_token && !config.url?.includes('/refresh')) {
    config.headers['Authorization'] = `Bearer ${adminStore.access_token}`
  }
  return config
})
```

### 4.2 响应拦截器：无感刷新

当后端返回 `401 Unauthorized` 时，拦截器会拦截这个错误，悄悄去换新票，然后把刚才失败的请求**再发一遍**。

```typescript
// src/api/index.ts
api.interceptors.response.use(
  (response) => response, // 成功直接放行
  async (error) => {
    const originalRequest = error.config
    const adminStore = useAdminStore()

    // 🚨 触发条件：
    // 1. 报错 401
    // 2. 不是刷新接口本身报错（如果刷新都报错了，那就真没救了）
    // 3. 这个请求还没重试过
    if (
      error.response?.status === 401 &&
      !originalRequest.url?.includes('/refresh') &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true // 标记：我已经救过它一次了~(O^O`)o

      try {
        // 1. 拿着 Refresh Token 去换新票
        const newToken = await adminStore.refreshToken()

        // 2. 更新默认 Header 和当前请求的 Header
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + newToken
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken

        // 3. 魔法时刻：重新发送原请求
        return api(originalRequest)
      } catch (refreshError) {
        // 救不活了，Refresh Token 也过期了，回去登录页吧awa...
        adminStore.logout()
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)
```

有了这段代码，哪怕 Access Token 只有 5 分钟有效期，只要有操作，系统就会自动续期，永远不会弹窗说“登录已过期”。

---

## 5. 门卫大爷：路由守卫

最后，需要在路由层面设卡。
在 `router/index.ts` 中，利用 `beforeEach` 钩子充当门卫。

这里有个**用户体验优化**：
如果用户没登录就想进后台，不跳转页面，而是在当前页面直接弹出一个**登录模态框**。

```typescript
// src/router/index.ts
router.beforeEach(async (to, from, next) => {
  const adminStore = useAdminStore()

  // 检查路由元信息：是否需要权限？
  if (to.meta.requiresAuth && !adminStore.isAuthenticated) {
    const modalStore = useGlobalModalStore()

    // ✋ 站住！
    modalStore.openLogin() // 呼出登录弹窗

    if (from.name === 'Home') {
      next(false) // 就在原地待着
    } else {
      next({ name: 'Home' }) // 或者是回首页待着
    }
    return
  }

  next() // 放行
})
```

---

## 6. 仪式感：中二病满满的登录框

作为一个二次元博客，登录框怎么能是普通的 `input` 呢？
它必须是 **"Identity Check"**，密码必须是 **"Soul Key"**。

`LoginModal.vue` 不仅承担了输入功能，还配合漂亮的视觉设计，营造出一种正在入侵系统的氛围感ovo!

```html
<!-- LoginModal.vue -->
<div class="form-header">
  <h3>Identity Check</h3>
  <span class="subtitle">请输入口令以解除封印...</span>
</div>
<button>
  <span>Link Start! <i class="fas fa-arrow-right"></i></span>
</button>
```

---

## 7. 结语：完结撒花 🎉

至此，**《从零开始的 Vue3 博客搭建》** 系列教程的主要功能篇章就全部结束了！

从第一篇的吐槽开始，居然一路走过了这么多内容！

- Aero 风格的 UI 设计
- Pinia 状态管理
- Markdown 渲染与代码高亮
- 复杂的动画系统
- 基于 Flask 的 CMS 后台
- 以及现在的 JWT 安全防线

现在，这个博客不仅仅是一个展示文字的地方，更是小风酱技术成长的见证！

当然，开发永无止境。说不定未来也许会有 **Vol.8 如何用 Three.js 给博客加个 3D 看板娘**？

谁知道呢？反正小风酱现在要先去开一瓶可乐庆祝一下了！

耶咦耶咦耶咦耶哦哦~

2025-12-30 祝大家<span class="text-pink">新</span><span class="text-deep-orange">年</span><span class="text-orange">快</span><span class="text-red">乐</span>！🎉

25年已经差不多过去了，愿新的26年里，代码少出错，Bug 全消失，项目全上线，生活多美好！

(ｏ’∀’)ノ｡+｡ﾟ☆I wish you a happy new year☆ﾟ｡+｡ヽ(‘∀’ｏ)

---

> 爱所有人的小风酱 著 **(￣▽￣)／ 大家下次见！**
