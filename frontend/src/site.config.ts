// src/site.config.ts

/**
 * 站点全局配置
 * 集中管理博客的核心常量、导航结构与主题色等信息
 */

// --- 导航项类型定义 ---
export interface NavItem {
  path: string
  iconType: [string, string]
  label: string
  exact?: boolean
  matchPrefix?: boolean
}

// --- 基础站点信息 ---
export const siteConfig = {
  title: '风风博客',
  author: 'futurelesswindchan',
  description: '一个基于 Vue 3 + TypeScript + Flask 打造的高颜值全栈个人博客系统',
}

// --- 导航菜单配置（桌面端 & 移动端共用） ---
export const navItems: NavItem[] = [
  {
    path: '/home',
    iconType: ['fas', 'home'],
    label: '这是首页',
    exact: true,
    matchPrefix: true,
  },
  { path: '/articles', iconType: ['fas', 'book-open'], label: '文章导航', matchPrefix: true },
  { path: '/gallery', iconType: ['fas', 'images'], label: '绘画长廊', matchPrefix: true },
  { path: '/friends', iconType: ['fas', 'paw'], label: '友情链接', matchPrefix: true },
  {
    path: '/admin/dashboard',
    iconType: ['fas', 'pen-nib'],
    label: '内容管理',
    matchPrefix: true,
  },
]

// --- 主题按钮配色 ---
export const themeToggleColors = {
  light: 'rgba(66, 133, 244, 0.5)',
  dark: 'rgba(251, 114, 153, 0.3)',
} as const

// --- 社交链接配置 ---
export interface SocialLink {
  name: string
  icon: string
  link: string
  color: string
}

export const socialLinks: SocialLink[] = [
  {
    name: 'GitHub',
    icon: 'fab fa-github',
    link: 'https://github.com/futurelesswindchan',
    color: '#24292e',
  },
  {
    name: 'Bilibili',
    icon: 'fab fa-bilibili',
    link: 'https://space.bilibili.com/273245032',
    color: '#fb7299',
  },
  {
    name: 'Email',
    icon: 'fas fa-envelope',
    link: 'mailto:windchan0v0@foxmail.com',
    color: '#4285f4',
  },
]

// --- 首页快捷导航（传送门）配置 ---
export interface PortalItem {
  icon: string
  title: string
  desc: string
  route: string
}

export const portalItems: PortalItem[] = [
  {
    icon: 'fa-laptop-code',
    title: '技术手札',
    desc: '代码与Bug的爱恨情仇',
    route: '/articles/frontend',
  },
  {
    icon: 'fa-coffee',
    title: '奇怪杂谈',
    desc: '生活琐事与碎碎念',
    route: '/articles/topics',
  },
  {
    icon: 'fa-feather-alt',
    title: '幻想物语',
    desc: '中二病发作现场',
    route: '/articles/novels',
  },
  {
    icon: 'fa-palette',
    title: '绘卷长廊',
    desc: '黑历史堆放处',
    route: '/gallery',
  },
]

// --- 文章分类类型定义 ---
export interface ArticleCategory {
  id: 'frontend' | 'novels' | 'topics' | string // 保留 string 以便未来扩展
  title: string
  desc: string
  icon: string
  className: string
  routeName: string
}

// --- 文章分类数据导出 ---
export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  {
    id: 'frontend',
    title: '技术手札',
    desc: '这里是咱的开发笔记与心得，以及各种实用技术分享0w0！',
    icon: 'fas fa-laptop-code',
    className: 'frontend',
    routeName: 'FrontEnd',
  },
  {
    id: 'novels',
    title: '幻想物语',
    desc: '非常非常神秘的连载与短篇故事？！（随缘更新中—v—）',
    icon: 'fas fa-feather',
    className: 'novels',
    routeName: 'Novels',
  },
  {
    id: 'topics',
    title: '奇怪杂谈',
    desc: '关于生活、兴趣与日常的随笔... 总之就是各种奇奇怪怪的东西啦OAO！',
    icon: 'fas fa-user-astronaut',
    className: 'topics',
    routeName: 'Topics',
  },
]
