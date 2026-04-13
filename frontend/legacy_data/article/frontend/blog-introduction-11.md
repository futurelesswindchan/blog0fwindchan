# Vol.11 绝对防御：JWT 双 Token 机制与 Axios 拦截器无感刷新

> **摘要**：当博客有了后台管理系统，安全就成了悬在头顶的达摩克利斯之剑。如果 Token 有效期太长，一旦泄露，黑客就能把你的文章删个精光；如果太短，你写文章写到一半就会被系统无情踢出。  
> 为了解决这个千古难题，小风酱祭出了终极防御魔法——JWT 双 Token 机制与 Axios 无感刷新！🛡️✨

---

## 1. 痛点：鱼与熊掌不可兼得的 Token

在传统的单 Token 认证中，开发者总是面临一个极其痛苦的选择：

- **设为 30 天过期**：用户体验极佳，一个月不用重新登录。但如果 Token 被 XSS 攻击窃取，黑客在这 30 天内可以为所欲为。
- **设为 1 小时过期**：绝对安全！哪怕被偷了，黑客也只能嚣张一个小时。但是……当你花了两小时精心排版了一篇长文，点击“保存”时，系统却冷冰冰地弹出一个 `401 Unauthorized`，把你踢回了登录页，你的心血瞬间化为乌有 QAQ！

有没有一种方法，既能保证 1 小时级别的安全性，又能让用户在 30 天内完全感受不到登录过期的存在？

答案就是： **Access Token (门票) + Refresh Token (长期凭证)** 的双轨制！

---

## 2. 后端发证机关：Flask-JWT-Extended

在风风博客的后端核心 `backend/app.py` 中，小风酱利用 `Flask-JWT-Extended` 建立了一个极其严格的发证机关。

在环境初始化时，明确规定了两种 Token 的寿命：

```python
# Access Token 只有 1 小时寿命，哪怕丢了也不怕！
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
# Refresh Token 拥有 30 天寿命，但它只有去换新门票的权力，不能用来发文章！
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=30)
```

当你通过 `LoginModal` 输入正确的账号密码后，后端的 `/api/admin/login` 接口会同时颁发这两张凭证：

```python
access_token = create_access_token(identity=str(user.id))
refresh_token = create_refresh_token(identity=str(user.id))
```

而当你的 Access Token 过期时，你需要拿着 Refresh Token 去敲开 `/api/admin/refresh` 这个特殊接口的门。  
注意，这个接口被 `@jwt_required(refresh=True)` 严格保护， **只认 Refresh Token，不认其他任何东西！**

---

## 3. 前端金库：Pinia `adminStore`

拿到了这两把钥匙，前端该怎么保管它们呢？  
在 `src/views/stores/adminStore.ts` 中，小风酱把它们锁进了 `localStorage` 的保险柜里，并且暴露了核心的 `refreshToken` 方法。

```typescript
const refreshToken = async (): Promise<string> => {
  try {
    const response = await api.post(
      '/admin/refresh',
      {},
      {
        headers: {
          // 这里必须手动塞入 refresh_token！
          Authorization: `Bearer ${refresh_token.value}`,
        },
      },
    )
    // 拿到新门票，立刻存入金库！
    access_token.value = response.data.access_token
    localStorage.setItem('access_token', access_token.value!)
    return access_token.value!
  } catch (e) {
    // 如果连长期凭证都过期了，那就只能无情踢出去了 OAO
    logout()
    throw e
  }
}
```

当然...如果有大佬问起 XSS 攻击的防范？awa  
~~真的会有黑客为了空空如也的数据库攻击咱的博客吗qwq...~~

咳咳，为了极致的前后端解耦和单页体验，所以目前采用了 localStorage；  
如果是对安全性要求极高的金融级系统，可以配合后端的 `set-cookie: HttpOnly` 来彻底杜绝 XSS 窃取哦！

---

## 4. 终极魔法：Axios 无感刷新拦截器

后端接口和前端 Store 都准备就绪了，但真正让这套机制“活”起来、让用户感受到极致丝滑的，是位于 `src/api/index.ts` 中的 Axios 拦截器！

这简直是整个系统中最精妙的“中间人攻击（正向版）”！

### 4.1 请求拦截器：自动佩戴胸牌

每次前端向后端发送请求前，请求拦截器都会拦下它，检查 Store 里有没有 `access_token`。如果有，就悄悄给请求头挂上 `Authorization` 胸牌。

但是，小风酱在这里埋下了一个极其关键的逻辑分支：

```typescript
const isRefreshRequest = config.url?.includes('/refresh')

// 只有当存在 access_token，且【不是刷新请求】时，才挂载 access_token！
if (adminStore.access_token && !isRefreshRequest) {
  config.headers['Authorization'] = `Bearer ${adminStore.access_token}`
}
```

**为什么？** 因为去 `/refresh` 接口换票时，需要的是 `refresh_token`！  
如果在这里无脑挂载 `access_token`，后端就会报 `422 Unprocessable Entity` 的错（它要的是刷新凭证，你却给它过期的门票）！

### 4.2 响应拦截器：起死回生的时空逆转

这是全站最硬核的代码！当你写完文章点击保存，但门票刚好在 1 分钟前过期了，后端无情地返回了 `401 Unauthorized`。

不要慌！响应拦截器会像一个顶级的黑客一样， **把这个报错拦截下来，不让 Vue 知道，也不让页面崩溃！**

```typescript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // 触发条件：遇到了 401 + 不是刷新接口本身的报错 + 还没重试过
    if (
      error.response?.status === 401 &&
      !originalRequest.url?.includes('/refresh') &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true // 贴个标签：我已经重试过啦，防止死循环！

      try {
        // 1. 停止时间！偷偷去后台换一张新门票！
        const newAccessToken = await adminStore.refreshToken()

        // 2. 给刚才那条失败的请求，换上崭新的门票！
        originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken

        // 3. 时空逆转！带着新门票把刚才的请求重新发一遍！
        return api(originalRequest)
      } catch (refreshError) {
        adminStore.logout()
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  },
)
```

**对用户来说发生了什么？**
用户点击“保存”，按钮转了一秒钟的圈圈，然后提示“保存成功”。  
他们根本不知道，在这短短的一秒钟里，旧的 Token 已经被拒绝，拦截器悄悄用 Refresh Token 换来了新的 Access Token，并重新提交了文章！

**整个过程鸦雀无声，仿佛什么都没发生过。这就是“无感刷新”的极致浪漫！✨**

_当然，在真实的超大型高并发系统中，我们还需要引入 isRefreshing 锁和请求队列来防止并发刷新风暴。但这对于个人博客来说，现在的极简时空逆转已经足够优雅啦！_

---

## 5. 闭环：一键上云与优雅退场

至此，我们的风风博客已经拥有了：

- 赛博玻璃拟态风格与炫酷的 Canvas 粒子引擎衬托的主页。
- 万能 Hook 驱动的文章列表、瀑布流与全局弹窗状态管理。
- 全能的 CMS 控制台与带有颜色的魔法 Markdown 编辑器。
- 坚不可摧且极其温柔的 JWT 双 Token 绝对防御。

为了让其他小白也能一键体验这个系统，小风酱甚至在源码里留下了一个 `backend/fix_db.py` 脚本，几百行代码自动遍历 `legacy_data` 文件夹，把所有的遗留 Markdown 文章（就是连载的这些文章啦awa）、示例友链头像、甚至示例图片，全自动地洗入 SQLite 数据库中。

这哪里是一个博客，这明明是一个极其完整、武装到牙齿的全栈艺术品呀！awa

---

## 下集预告

经过了漫长的代码长征与架构演进……我们的博客连载终于要迎来最终章啦！

下一篇 **【Vol.12 尾声：完结撒花与未来展望】** ，我们将对整个风风博客的代码哲学进行最后的回顾，聊聊各种需要注意的坑，以及……下一个赛博计划！

备好香槟，我们要准备开香槟啦！🍾🎉

---

> 忘了自己所设管理员密码而无法登录的可怜小风酱 著 🛡️  
> 本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
