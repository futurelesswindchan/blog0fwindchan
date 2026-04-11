// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { useToastStore } from '@/views/stores/toastStore'
import { useFriendStore } from '@/views/stores/friendStore'
import { useArtworkStore } from '@/views/stores/artworkStore'
import { useAdminStore } from '@/views/stores/adminStore'

/**
 * @module RouterConfiguration
 * @description 扩展 Vue Router 默认的 RouteMeta 类型声明，以支持自定义的页面标题与鉴权标识。
 */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
  }
}

/**
 * 路由树配置
 * @constant routes
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '正在首页发呆中...' },
      },
      {
        path: '',
        redirect: { name: 'Home' },
      },
      {
        path: 'articles',
        children: [
          {
            path: '',
            name: 'Articles',
            component: () => import('@/views/ArticleView.vue'),
            meta: { title: '文章分类管理处' },
          },
          {
            path: 'frontend',
            name: 'FrontEnd',
            component: () => import('@/views/articles/FrontEndView.vue'),
            meta: { title: '技术文章' },
          },
          {
            path: 'frontend/:id',
            name: 'FrontEndArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '技术文章详情页' },
          },
          {
            path: 'topics',
            name: 'Topics',
            component: () => import('@/views/articles/TopicsView.vue'),
            meta: { title: '杂谈闲聊' },
          },
          {
            path: 'topics/:id',
            name: 'TopicsArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '杂谈闲聊详情页' },
          },
          {
            path: 'novels',
            name: 'Novels',
            component: () => import('@/views/articles/NovelsView.vue'),
            meta: { title: '小说故事' },
          },
          {
            path: 'novels/:id',
            name: 'NovelsArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '小说故事详情页' },
          },
        ],
      },
      {
        path: 'gallery',
        name: 'Gallery',
        component: () => import('@/views/GalleryView.vue'),
        meta: { title: '画廊&设定' },
      },
      {
        path: 'friends',
        name: 'Friends',
        component: () => import('@/views/FriendsView.vue'),
        meta: { title: '友链&留言' },
      },
      {
        path: 'admin',
        children: [
          {
            path: 'dashboard',
            name: 'AdminDashboard',
            component: () => import('@/views/admin/DashboardView.vue'),
            meta: { title: '控制台', requiresAuth: true },
          },
          {
            path: 'dashboard/editor',
            name: 'EditorCreate',
            component: () => import('@/views/admin/EditorView.vue'),
            meta: { title: '正在奋笔疾书写新文章...', requiresAuth: true },
          },
          {
            path: 'dashboard/editor/:category/:slug',
            name: 'EditorEdit',
            component: () => import('@/views/admin/EditorView.vue'),
            meta: { title: '正在编辑文章...', requiresAuth: true },
          },
        ],
      },
    ],
  },
  // 兜底路由：未匹配路径统一重定向至首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home',
  },
]

/**
 * @instance router
 * @description 全局路由实例配置，包含历史模式与滚动行为接管。
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 强制接管滚动行为：任何路由切换均瞬间回到页面顶部坐标 (0, 0)
  scrollBehavior() {
    return {
      top: 0,
      left: 0,
      behavior: 'instant',
    }
  },
})

// --- 全局路由守卫配置 ---

const TRANSITION_DURATION = 400

/**
 * @variable activeLoadingToastId
 * @description 记录当前拦截器呼出的“加载中” Toast 的唯一标识符。
 * 用于在路由成功放行后，精准销毁该提示框，避免内存泄漏与视觉残留。
 */
let activeLoadingToastId: number | null = null

/**
 * @variable loadingStartTime
 * @description 记录“加载中” Toast 弹出的高精度时间戳 (毫秒)。
 * 用于在加载完成后计算用户等待的时间。如果加载极快，则抑制成功提示的弹出，避免视觉打扰。
 */
let loadingStartTime: number = 0

/**
 * 全局前置守卫 (Global Before Guard)
 * @description
 * 1. 动态修改文档标题。
 * 2. 注入页面切换的 CSS 过渡类名。
 * 3. 鉴权拦截与登录模态框唤醒。
 * 4. 核心逻辑：检测到需异步拉取数据的页面，触发 Toast 视觉反馈，阻断页面假死感。
 */
router.beforeEach(async (to, from, next) => {
  // 1. 动态挂载浏览器标签页标题
  if (to.meta.title) {
    document.title = `${to.meta.title} | 风风博客`
  } else {
    document.title = '风风博客'
  }

  // 2. 注入过渡动画钩子类名
  document.documentElement.classList.add('page-transitioning')

  try {
    const adminStore = useAdminStore()
    const toastStore = useToastStore()

    // 3. 路由鉴权拦截机制
    if (to.meta.requiresAuth && !adminStore.isAuthenticated) {
      const modalStore = useGlobalModalStore()
      modalStore.openLogin() // 唤醒全局登录模态框

      // 根据来源决定退路：若处在首页则直接阻断，否则重定向退回首页面
      if (from.name === 'Home') {
        next(false)
      } else {
        next({ name: 'Home' })
      }
      return
    }

    // 4. 重数据依赖页面的视觉护航与预加载逻辑
    // 判定当前目标是否为需要等待数据响应的页面
    const isDataHeavyRoute = [
      'Friends',
      'Gallery',
      'Articles',
      'FrontEnd',
      'Topics',
      'Novels',
      'FrontEndArticle',
      'TopicsArticle',
      'NovelsArticle',
    ].includes(to.name as string)

    if (isDataHeavyRoute) {
      // 记录开始加载的时间戳
      loadingStartTime = performance.now()

      // 呼出无限期存在的 Loading Toast，安抚用户等待情绪
      activeLoadingToastId = toastStore.add({
        title: '次元跃迁准备中...',
        message: `正在为您搬运${to.meta.title}的数据，请稍候~`,
        type: 'info',
        duration: 0, // 设置为 0 使其常驻，直到我们在 afterEach 中手动移除
      })

      // 针对特定的重度强依赖页面，执行前置的异步数据拉取
      // 注意：由于文章详情等页面的数据拉取是在其组件内部 onMounted 里进行的，
      // 所以我们这里不需要 await 它们的接口，只负责弹 Toast 即可。
      if (to.name === 'Friends') {
        const friendStore = useFriendStore()
        if (!friendStore.friends.length) await friendStore.fetchFriends()
      } else if (to.name === 'Gallery') {
        const artworkStore = useArtworkStore()
        if (!artworkStore.artworks.length) await artworkStore.fetchArtworks()
      }
    }

    // 所有前置任务就绪，放行路由
    next()
  } catch (err) {
    console.error('路由守卫执行异常:', err)

    // 异常兜底：若加载失败，确保清理 Loading Toast 并弹出错误提示
    if (activeLoadingToastId) {
      const toastStore = useToastStore()
      toastStore.remove(activeLoadingToastId)
      activeLoadingToastId = null

      toastStore.add({
        title: '跃迁失败',
        message: '获取数据时遇到了时空乱流，请刷新重试 QAQ',
        type: 'error',
        duration: 3000,
      })
    }

    next() // 即使报错也强制放行，避免应用死锁
  }
})

/**
 * 全局后置钩子 (Global After Hook)
 * @description
 * 1. 负责清理过期的 Loading Toast。
 * 2. 仅当用户等待时间超过阈值 (如 300ms) 时，才弹出“跃迁成功”提示，避免页面秒开时的弹窗轰炸。
 * 3. 延迟移除页面的过渡动画类名。
 */
router.afterEach((to) => {
  // 1. 若存在活跃的加载提示框，将其销毁，标志着数据加载与页面切换正式完成
  if (activeLoadingToastId) {
    const toastStore = useToastStore()
    toastStore.remove(activeLoadingToastId)
    activeLoadingToastId = null

    // 计算用户实际等待的时间 (毫秒)
    const waitTime = performance.now() - loadingStartTime

    // 2. 智能化反馈拦截：如果耗时超过 300ms，说明用户确实感知到了等待，此时给予成功反馈。
    // 如果耗时极短 (网络极佳或命中缓存)，则静默跳转，不打扰用户。
    if (waitTime > 300) {
      toastStore.add({
        message: `跃迁成功！欢迎来到${to.meta.title}~`,
        type: 'success',
        duration: 1500,
      })
    }
  }

  // 3. 依据设定的动画持续时间，清理过渡类名以恢复正常 DOM 交互
  setTimeout(() => {
    document.documentElement.classList.remove('page-transitioning')
  }, TRANSITION_DURATION)
})

export default router
