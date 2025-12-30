<!-- src/App.vue -->
<template>
  <div id="app-root" :class="{ 'dark-theme': isDarkTheme }">
    <router-view v-slot="{ Component }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- === 全局模态框挂载点 === -->
    <!-- 不使用 v-if，让组件常驻，由 BaseModal 内部控制显示和动画 -->

    <LoginModal />
    <SettingsModal />
    <GalleryPreviewModal />

    <!-- 业务弹窗 -->
    <!-- 即使不显示，组件也挂载着，但 BaseModal 会隐藏内容 -->
    <!-- 传入 props 依然有效，因为 store 状态是响应式的 -->
    <FriendModal />
    <ArtworkModal />
    <AssetLibraryModal />
  </div>
</template>

<script setup lang="ts">
import { useArticleContent } from '@/composables/useArticleContent'
// 引入所有模态框组件
import LoginModal from '@/components/admin/LoginModal.vue'
import SettingsModal from '@/components/common/SettingsModal.vue'
import FriendModal from '@/components/admin/FriendModal.vue'
import ArtworkModal from '@/components/admin/ArtworkModal.vue'
import AssetLibraryModal from '@/components/admin/AssetLibraryModal.vue'
import GalleryPreviewModal from '@/components/common/GalleryPreviewModal.vue'

const { isDarkTheme } = useArticleContent()
</script>

<style>
@import '@/styles/theme.css';
</style>
