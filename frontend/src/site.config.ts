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
