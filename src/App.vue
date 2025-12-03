<template>
  <!-- 仅保留最外层容器 -->
  <router-view />
</template>

<script setup lang="ts">
// 空文件，仅作为路由出口
</script>

<style>
/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background-color: transparent;
}

::-webkit-scrollbar-thumb {
  background-color: var(--accent-color);
  border-radius: 4px;
}

::-webkit-scrollbar-track {
  background-color: rgba(0, 0, 0, 0.05);
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
