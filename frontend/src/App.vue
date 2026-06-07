<!-- src/App.vue -->
<template>
  <div id="app-root" :class="{ 'dark-theme': isDarkTheme }">
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- 全局所有弹窗容器 -->
    <GlobalModals />

    <!-- Toast Manager -->
    <ToastManager />
  </div>
</template>

<script setup lang="ts">
import { useArticleContent } from '@/composables/useArticleContent'
import GlobalModals from '@/components/modal/GlobalModals.vue'
import ToastManager from '@/components/feedback/ToastManager.vue'

const { isDarkTheme } = useArticleContent()
</script>

<style>
@import '@/styles/theme.css';
</style>
