// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
import { useFriendStore } from '@/views/stores/friendStore'
import { useArtworkStore } from '@/views/stores/artworkStore'
import { useAdminStore } from '@/views/stores/adminStore'
import { useGlobalModalStore } from '@/views/stores/globalModalStore' // ✨ 新增引入

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
        meta: { title: '正在首页发呆中...' },
      },
      // 当访问 '/' 时重定向到 /home
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
              title: '这里是全部的文章哦',
            },
          },
          {
            path: 'frontend',
            name: 'FrontEnd',
            component: () => import('@/views/articles/FrontEndView.vue'),
            meta: { title: '正在翻阅技术文章...' },
          },
          {
            path: 'frontend/:id',
            name: 'FrontEndArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '正在认真研读 (O_O)...' },
          },
          {
            path: 'topics',
            name: 'Topics',
            component: () => import('@/views/articles/TopicsView.vue'),
            meta: { title: '奇怪杂谈与碎碎念' },
          },
          {
            path: 'topics/:id',
            name: 'TopicsArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '正在偷看碎碎念...' },
          },
          {
            path: 'novels',
            name: 'Novels',
            component: () => import('@/views/articles/NovelsView.vue'),
            meta: { title: '幻想物语连载中...' },
          },
          {
            path: 'novels/:id',
            name: 'NovelsArticle',
            component: () => import('@/views/articles/ArticleDetailView.vue'),
            meta: { title: '沉浸在幻想故事里...' },
          },
        ],
      },
      {
        path: 'gallery',
        name: 'Gallery',
        component: () => import('@/views/GalleryView.vue'),
        meta: {
          title: '绘卷长廊 ~ 欣赏一下吧',
        },
      },
      {
        path: 'friends',
        name: 'Friends',
        component: () => import('@/views/FriendsView.vue'),
        meta: {
          title: '友情链接 ~ 野生小伙伴！',
        },
      },
      // ❌ 已移除 Settings 路由 (改为模态框)
      {
        path: 'admin',
        children: [
          // ❌ 已移除 Login 路由 (改为模态框)
          {
            path: 'dashboard',
            name: 'AdminDashboard',
            component: () => import('@/views/admin/DashboardView.vue'),
            meta: { title: '控制台 ~ 掌控一切！', requiresAuth: true },
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
            meta: { title: '正在修改文章... 哪里写错了吗~', requiresAuth: true },
          },
        ],
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

  try {
    const adminStore = useAdminStore()

    // 1. 检查 Admin 权限
    if (to.meta.requiresAuth && !adminStore.isAuthenticated) {
      // ✨ 核心修改：如果未登录，不跳转到登录页，而是重定向回首页并弹出模态框
      const modalStore = useGlobalModalStore()
      modalStore.openLogin() // 呼出登录窗口

      // 如果当前已经在首页，则拦截导航即可；否则重定向到首页
      if (from.name === 'Home') {
        next(false) // 取消导航
      } else {
        next({ name: 'Home' }) // 去首页待命
      }
      return
    }

    // 2. 原有的预加载逻辑
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
