// src/site.config.ts
export const siteConfig = {
  // 基础信息
  title: '风风博客',
  author: 'futurelesswindchan',
  description: '一个基于 Vue 3 + TypeScript + Flask 打造的高颜值全栈个人博客系统',
  
  // 个人社交链接
  socials: {
    github: 'https://github.com/futurelesswindchan',
    twitter: '',
  },

  // 博客分类定义 (需与后端数据库初始化的分类对应)
  categories: [
    { key: 'frontend', name: '技术手札', path: '/articles/frontend' },
    { key: 'topics', name: '杂谈闲聊', path: '/articles/topics' },
    { key: 'novels', name: '小说故事', path: '/articles/novels' },
  ],

  // 导航栏菜单
  navItems: [
    { name: '首页', path: '/home', icon: 'home' },
    { name: '文章', path: '/articles', icon: 'book' },
    { name: '画廊&设定', path: '/gallery', icon: 'image' },
    { name: '友链&留言', path: '/friends', icon: 'users' },
  ],
};