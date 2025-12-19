import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { useFriendStore } from '@/views/stores/friendStore'
import { useArtworkStore } from '@/views/stores/artworkStore'
import { useAdminStore } from '@/views/stores/adminStore'

// 扩展路由元信息类型以包含 title 字段
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
  }
}

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        meta: { title: '欢迎回家 ~\(≧▽≦)/~ 正在首页发呆中...' },
      },
      // 当访问 '/' 时重定向到 /home（保持 MainLayout）
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
            meta: {
              title: '这里是全部的技术文章哦 ( •̀ ω •́ )✧',
            },
          },
          {
            path: 'frontend',
            name: 'FrontEnd',
            component: () => import('@/views/articles/FrontEndView.vue'),
            meta: { title: '正在翻阅网站开发笔记... 努力学习中！' },
          },
          {
            path: 'frontend/:id',
            name: 'FrontEndArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '正在认真研读开发笔记... (O_O)?' },
          },
          {
            path: 'topics',
            name: 'Topics',
            component: () => import('@/views/articles/TopicsView.vue'),
            meta: { title: '奇怪杂谈与碎碎念 (*/ω＼*)' },
          },
          {
            path: 'topics/:id',
            name: 'TopicsArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '正在偷看博主的碎碎念... (¬‿¬)' },
          },
          {
            path: 'novels',
            name: 'Novels',
            component: () => import('@/views/articles/NovelsView.vue'),
            meta: { title: '幻想物语连载中... 中二病发作现场！' },
          },
          {
            path: 'novels/:id',
            name: 'NovelsArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '沉浸在幻想故事里... 勿扰模式开启 zZZ' },
          },
        ],
      },
      {
        path: 'gallery',
        name: 'Gallery',
        component: () => import('@/views/GalleryView.vue'),
        meta: {
          title: '绘卷长廊 ~ 欣赏一下黑历史吧 (*/ω＼*)',
        },
      },
      {
        path: 'friends',
        name: 'Friends',
        component: () => import('@/views/FriendsView.vue'),
        meta: {
          title: '友情链接 ~ 抓到几只野生的小伙伴！(o゜▽゜)o☆',
        },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { title: '个性化设置 ~ 打造你的专属界面 🎨' },
      },
      {
        path: 'admin/login',
        name: 'AdminLogin',
        component: () => import('@/views/admin/LoginView.vue'),
        meta: { title: '管理员登录 ~ 闲人免进哦 ( •̀ ω •́ )y' },
      },
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
        meta: { title: '控制台 ~ 掌控一切的感觉！(🕶️)', requiresAuth: true },
      },
      {
        path: 'editor',
        name: 'EditorCreate',
        component: () => import('@/views/admin/EditorView.vue'),
        meta: { title: '正在奋笔疾书写新文章... ✍️', requiresAuth: true },
      },
      {
        path: 'editor/:category/:slug',
        name: 'EditorEdit',
        component: () => import('@/views/admin/EditorView.vue'),
        meta: { title: '正在修改文章... 哪里写错了嘛？(°ー°〃)', requiresAuth: true },
      },
    ],
  },
  // 未匹配的所有路由统一重定向到 /home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home',
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 修改滚动行为：始终回到顶部，立即执行
  scrollBehavior() {
    return {
      top: 0,
      left: 0,
      behavior: 'instant', // 确保立即定位
    }
  },
})

// 添加过渡状态控制
const TRANSITION_DURATION = 400

router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} | 风风博客`
  } else {
    document.title = '风风博客'
  }

  // 添加过渡类名到根元素
  document.documentElement.classList.add('page-transitioning')

  // 1. 检查 Admin 权限（如果路由声明了 requiresAuth）
  try {
    const adminStore = useAdminStore()
    // 使用类型断言确保 requiresAuth 存在
    if (to.meta.requiresAuth && !adminStore.isAuthenticated) {
      next({ name: 'AdminLogin', query: { redirect: to.fullPath } })
      return
    }

    // 2. 原有的预加载逻辑
    // 根据路由名称预加载数据
    if (to.name === 'Friends') {
      const friendStore = useFriendStore()
      if (!friendStore.friends.length) {
        await friendStore.fetchFriends()
      }
    } else if (to.name === 'Gallery') {
      const artworkStore = useArtworkStore()
      if (!artworkStore.artworks.length) {
        await artworkStore.fetchArtworks()
      }
    }

    next()
  } catch (err) {
    console.error('路由守卫异常:', err)
    next() // 保证导航继续
  }
})

router.afterEach(() => {
  // 延迟移除过渡类名
  setTimeout(() => {
    document.documentElement.classList.remove('page-transitioning')
  }, TRANSITION_DURATION)
})

export default router
