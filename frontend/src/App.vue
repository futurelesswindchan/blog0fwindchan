<template>
  <!-- 仅保留最外层容器 -->
  <router-view />
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/views/stores/useSettingsStore'

const settingsStore = useSettingsStore()
// 初始化时读取本地存储的设置
settingsStore.loadSettings()
</script>

<style>
/* 全局滚动条样式 */
::-webkit-scrollbar {
  display: none;
}
.page-transitioning {
  pointer-events: none;
  user-select: none;
}

/* 禁用移动端点击高亮 */
* {
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
}

/* 禁用文本选择 */
.no-select {
  user-select: none;
  -webkit-user-select: none;
}
</style>
