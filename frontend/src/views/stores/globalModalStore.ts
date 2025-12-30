// src/views/stores/globalModalStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Friend } from './friendStore'
import type { Artwork } from './artworkStore'

export const useGlobalModalStore = defineStore('globalModal', () => {
  // --- 1. 系统级弹窗 ---
  const showLogin = ref(false)
  const showSettings = ref(false)
  const openLogin = () => (showLogin.value = true)
  const closeLogin = () => (showLogin.value = false)
  const openSettings = () => (showSettings.value = true)
  const closeSettings = () => (showSettings.value = false)

  // --- 2. 业务级弹窗：友链 ---
  const showFriendModal = ref(false)
  const editingFriend = ref<Friend | null>(null)
  const openFriendModal = (friend: Friend | null = null) => {
    editingFriend.value = friend
    showFriendModal.value = true
  }
  const closeFriendModal = () => {
    showFriendModal.value = false
    editingFriend.value = null
  }

  // --- 3. 业务级弹窗：画廊编辑 ---
  const showArtworkModal = ref(false)
  const editingArtwork = ref<Artwork | null>(null)
  const openArtworkModal = (work: Artwork | null = null) => {
    editingArtwork.value = work
    showArtworkModal.value = true
  }
  const closeArtworkModal = () => {
    showArtworkModal.value = false
    editingArtwork.value = null
  }

  // --- 4. 工具级弹窗：素材库 ---
  const showAssetLibrary = ref(false)
  const onAssetSelectCallback = ref<((url: string) => void) | null>(null)
  const openAssetLibrary = (callback?: (url: string) => void) => {
    if (callback) onAssetSelectCallback.value = callback
    showAssetLibrary.value = true
  }
  const closeAssetLibrary = () => {
    showAssetLibrary.value = false
    onAssetSelectCallback.value = null
  }
  const handleAssetSelect = (url: string) => {
    if (onAssetSelectCallback.value) onAssetSelectCallback.value(url)
    closeAssetLibrary()
  }

  // --- 5. 画廊预览 (Gallery Preview) ---
  const showGalleryPreview = ref(false)
  const previewArtwork = ref<Artwork | null>(null)
  const previewList = ref<Artwork[]>([]) // 存储当前列表，用于导航

  // 打开预览，同时传入当前图片和上下文列表
  const openGalleryPreview = (artwork: Artwork, list: Artwork[] = []) => {
    previewArtwork.value = artwork
    previewList.value = list.length > 0 ? list : [artwork]
    showGalleryPreview.value = true
  }

  const closeGalleryPreview = () => {
    showGalleryPreview.value = false
    previewArtwork.value = null
    previewList.value = []
  }

  // 导航逻辑移入 Store
  const currentPreviewIndex = computed(() => {
    if (!previewArtwork.value) return -1
    return previewList.value.findIndex((item) => item.id === previewArtwork.value?.id)
  })

  const hasPrev = computed(() => currentPreviewIndex.value > 0)
  const hasNext = computed(() => currentPreviewIndex.value < previewList.value.length - 1)

  const navigateGallery = (direction: 1 | -1) => {
    const newIndex = currentPreviewIndex.value + direction
    if (newIndex >= 0 && newIndex < previewList.value.length) {
      previewArtwork.value = previewList.value[newIndex]
    }
  }

  return {
    showLogin,
    openLogin,
    closeLogin,
    showSettings,
    openSettings,
    closeSettings,
    showFriendModal,
    editingFriend,
    openFriendModal,
    closeFriendModal,
    showArtworkModal,
    editingArtwork,
    openArtworkModal,
    closeArtworkModal,
    showAssetLibrary,
    openAssetLibrary,
    closeAssetLibrary,
    handleAssetSelect,
    showGalleryPreview,
    previewArtwork,
    openGalleryPreview,
    closeGalleryPreview,
    hasPrev,
    hasNext,
    navigateGallery,
  }
})
