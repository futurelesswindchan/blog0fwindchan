import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { useFriendStore } from '@/views/stores/friendStore'
import { useArtworkStore } from '@/views/stores/artworkStore'
import { useAdminStore } from '@/views/stores/adminStore'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
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
        meta: { title: '正在首页~' },
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
              title: '技术文章',
            },
          },
          {
            path: 'frontend',
            name: 'FrontEnd',
            component: () => import('@/views/articles/FrontEndView.vue'),
            meta: { title: '网站开发笔记' },
          },
          {
            path: 'frontend/:id',
            name: 'FrontEndArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '阅读网站开发笔记中' },
          },
          {
            path: 'topics',
            name: 'Topics',
            component: () => import('@/views/articles/TopicsView.vue'),
            meta: { title: '奇怪杂谈' },
          },
          {
            path: 'topics/:id',
            name: 'TopicsArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '阅读奇怪杂谈中' },
          },
          {
            path: 'novels',
            name: 'Novels',
            component: () => import('@/views/articles/NovelsView.vue'),
            meta: { title: '幻想物语' },
          },
          {
            path: 'novels/:id',
            name: 'NovelsArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '阅读幻想物语中' },
          },
        ],
      },
      {
        path: 'gallery',
        name: 'Gallery',
        component: () => import('@/views/GalleryView.vue'),
        meta: {
          title: '立绘插画之类的',
        },
      },
      {
        path: 'friends',
        name: 'Friends',
        component: () => import('@/views/FriendsView.vue'),
        meta: {
          title: '友情链接哦',
        },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SettingsView.vue'),
        meta: { title: '设置' },
      },
      {
        path: 'admin/login',
        name: 'AdminLogin',
        component: () => import('@/views/admin/LoginView.vue'),
        meta: { title: '管理员登录' },
      },
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/DashboardView.vue'),
        meta: { title: '内容管理', requiresAuth: true },
      },
      {
        path: 'editor',
        name: 'EditorCreate',
        component: () => import('@/views/admin/EditorView.vue'),
        meta: { title: '写新文章', requiresAuth: true },
      },
      {
        path: 'editor/:category/:slug',
        name: 'EditorEdit',
        component: () => import('@/views/admin/EditorView.vue'),
        meta: { title: '编辑文章', requiresAuth: true },
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
  // 添加过渡类名到根元素
  document.documentElement.classList.add('page-transitioning')

  // 1. 检查 Admin 权限（如果路由声明了 requiresAuth）
  try {
    const adminStore = useAdminStore()
    if ((to.meta as { requiresAuth?: boolean }).requiresAuth && !adminStore.isAuthenticated) {
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
