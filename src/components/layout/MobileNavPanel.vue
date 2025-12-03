<template>
  <nav
    class="mobile-nav"
    :class="{
      'dark-theme': isDarkTheme,
      'sliding-out': isClosing,
    }"
    @animationend="onAnimationEnd"
  >
    <div class="nav-header">
      <h2>导航菜单</h2>
      <button class="close-btn" @click="handleClose">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="nav-items nav-items-grid">
      <hr />
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :exact="item.exact"
        :exact-active-class="item.exact ? 'router-link-exact-active' : ''"
        :active-class="item.exact ? '' : 'router-link-active'"
        :class="{
          active: item.matchPrefix && $route.path.startsWith(item.path),
        }"
        @click="handleClose"
      >
        <font-awesome-icon :icon="item.iconType" fixed-width />
        <span>{{ item.label }}</span>
      </router-link>
      <hr />
    </div>

    <!-- 主题切换按钮 -->
    <button class="nav-item theme-toggle" :style="themeButtonStyle" @click="$emit('toggle-theme')">
      <i class="fas" :class="isDarkTheme ? 'fa-sun' : 'fa-moon'"></i>
      <span>{{ isDarkTheme ? '切换到亮色主题' : '切换到暗色主题' }}</span>
    </button>

    <!-- 设置按钮，放在主题切换按钮下方 -->
    <router-link to="/settings" class="nav-item settings-item" @click="handleClose">
      <font-awesome-icon :icon="['fas', 'cog']" fixed-width />
      <span>设置</span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const { isDarkTheme } = defineProps<{
  isDarkTheme: boolean
}>()

const emit = defineEmits(['close', 'toggle-theme'])
const isClosing = ref(false)

// 添加主题按钮样式计算属性
const themeButtonStyle = computed(() => ({
  background: isDarkTheme ? 'rgba(251, 114, 153, 0.3)' : 'rgba(66, 133, 244, 0.5)',
}))

// 同步桌面版的路由配置
const navItems = [
  {
    path: '/home',
    iconType: ['fas', 'home'],
    label: '这是首页',
    exact: true,
    matchPrefix: true,
  },
  { path: '/articles', iconType: ['fas', 'book-open'], label: '文章导航', matchPrefix: true },
  {
    path: '/admin/dashboard',
    iconType: ['fas', 'pen-nib'],
    label: '内容管理',
    matchPrefix: true,
  },
  { path: '/gallery', iconType: ['fas', 'images'], label: '绘画长廊', matchPrefix: true },
  { path: '/friends', iconType: ['fas', 'paw'], label: '友情链接', matchPrefix: true },
]

// 优化关闭处理函数
const handleClose = () => {
  if (!isClosing.value) {
    isClosing.value = true
  }
}

// 优化动画结束处理函数
const onAnimationEnd = () => {
  if (isClosing.value) {
    emit('close')
    isClosing.value = false
  }
}
</script>

<style scoped>
.mobile-nav {
  position: fixed;
  padding: 20px;
  z-index: 999;
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  transition: none;
  /* 移除可能影响动画的属性 */
  transform-origin: unset;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  /* 禁用移动端点击高亮 */
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  /* 提高性能 */
  will-change: transform;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.9);
  transition: all 0.3s ease;
}

.dark-theme .mobile-nav {
  background-color: rgba(0, 0, 0, 0.9);
  color: rgba(255, 255, 255, 0.9);
}

/* 修改进入动画 */
@keyframes slideIn {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(0);
  }
}

/* 修改退出动画 */
@keyframes slideOut {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* 添加动画类 */
.mobile-nav {
  animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.mobile-nav.sliding-out {
  animation: slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* 禁用所有可交互元素的点击高亮 */
.nav-item,
.close-btn,
.theme-toggle {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

/* 优化按钮点击效果 */
.close-btn:active,
.theme-toggle:active,
.nav-item:active {
  opacity: 0.7;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-radius: 8px;
  padding: 0px 16px;
}

.nav-header h2 {
  margin: 0;
  font-size: 1.2rem;
  color: inherit;
  opacity: 0.9;
}

.close-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.5rem;
  padding: 8px;
  cursor: pointer;
  opacity: 0.8;
}

hr {
  border: none;
  height: 1px;
  background-color: rgba(0, 0, 0, 1);
  transition: all 0.3s ease;
  margin: 12px 0;
}

.dark-theme hr {
  background-color: rgba(255, 255, 255, 1);
}

/* 新增：双列布局 */
.nav-items-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px; /* 缩小间距，避免重叠 */
  align-items: stretch;
  padding: 0 2px; /* 增加左右内边距 */
}

/* 让分隔线横跨两列 */
.nav-items-grid hr {
  grid-column: 1 / -1;
}

/* 让每个nav-item自适应宽度并缩小 */
.nav-items-grid .nav-item {
  width: 95%; /* 缩小宽度，避免卡片贴边 */
  min-width: 0;
  font-size: 0.98rem; /* 字体略小 */
  padding: 10px 15px; /* 缩小内边距 */
  margin: 0 auto; /* 居中显示 */
  box-sizing: border-box;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  color: rgba(0, 0, 0, 0.85);
  text-decoration: none;
  gap: 12px;
  transition: all 0.3s ease;
  background: rgba(0, 0, 0, 0.1);
}

.dark-theme .nav-item {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.router-link-exact-active,
.nav-item.router-link-active,
.nav-item.active {
  background: rgba(0, 119, 255, 0.5);
  color: var(--accent-color);
}

.dark-theme .nav-item.router-link-exact-active,
.dark-theme .nav-item.router-link-active,
.dark-theme .nav-item.active {
  background: rgba(0, 119, 255, 0.6);
  color: #fff;
}

.nav-item svg,
.theme-toggle i {
  color: var(--accent-color);
  opacity: 0.9;
}

.dark-theme .nav-item svg,
.dark-theme .theme-toggle i {
  opacity: 1;
}

/* 修改主题切换按钮样式 */
.theme-toggle {
  border: none;
  cursor: pointer;
  display: flex;
  transition: all 0.3s var(--aero-animation);
  background: v-bind('themeButtonStyle.background') !important;
}

.dark-theme .theme-toggle {
  color: rgba(255, 255, 255, 0.9);
}

/* 添加点击状态样式 */
.theme-toggle:active {
  opacity: 0.7;
  transform: scale(0.98);
}

/* 移动端导航栏动画优化 */
@media (hover: none) {
  .mobile-overlay {
    backdrop-filter: none; /* 移除背景模糊 */
  }

  .mobile-nav {
    will-change: auto;
    backface-visibility: visible;
    -webkit-backface-visibility: visible;
  }
}

/* 统一按钮高度 */
.theme-toggle,
.nav-items-grid .nav-item,
.settings-item {
  height: 48px;
  min-height: 48px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  transition: 0.3s ease;
  /* 保持原有样式 */
}

/* 保证设置按钮样式不被覆盖 */
.settings-item {
  margin-top: 18px;
  background: rgba(0, 119, 255, 0.13);
  justify-content: flex-start;
}
.dark-theme .settings-item {
  background: rgba(0, 119, 255, 0.18);
}
</style>
