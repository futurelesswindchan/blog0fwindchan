<!-- src/components/modal/GlobalModals.vue -->
<template>
  <!-- === 全局模态框挂载点 === -->
  <!-- 不使用 v-if，让组件常驻，由 BaseModal 内部控制显示和动画 -->
  <LoginModal />
  <SettingsModal />
  <GalleryPreviewModal />
  <FriendModal />
  <ArtworkModal />
  <AssetLibraryModal />
  <ImageLayoutModal />
  <PlanModal />
  <SponsorModal />
  <CollectionModal />
</template>

<script setup lang="ts">
import LoginModal from '@/components/modal/LoginModal.vue'
import SettingsModal from '@/components/modal/SettingsModal.vue'
import FriendModal from '@/components/modal/FriendModal.vue'
import ArtworkModal from '@/components/modal/ArtworkModal.vue'
import PlanModal from '@/components/modal/PlanModal.vue'
import SponsorModal from '@/components/modal/SponsorModal.vue'
import AssetLibraryModal from '@/components/modal/AssetLibraryModal.vue'
import GalleryPreviewModal from '@/components/modal/GalleryPreviewModal.vue'
import CollectionModal from '@/components/modal/CollectionModal.vue'
import ImageLayoutModal from '@/components/modal/ImageLayoutModal.vue'
</script>
