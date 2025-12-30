// src/views/stores/globalModalStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
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

  // --- 2. 业务级弹窗：友链编辑 ---
  const showFriendModal = ref(false)
  const editingFriend = ref<Friend | null>(null) // 存储当前正在编辑的数据

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

  // --- 4. 工具级弹窗：素材库选择器 ---
  const showAssetLibrary = ref(false)
  // 存储回调函数：当用户选中图片时，执行此函数将图片插入编辑器
  const onAssetSelectCallback = ref<((url: string) => void) | null>(null)

  const openAssetLibrary = (callback?: (url: string) => void) => {
    if (callback) {
      onAssetSelectCallback.value = callback
    }
    showAssetLibrary.value = true
  }

  const closeAssetLibrary = () => {
    showAssetLibrary.value = false
    onAssetSelectCallback.value = null // 清理回调，防止内存泄漏
  }

  // 处理选中逻辑
  const handleAssetSelect = (url: string) => {
    if (onAssetSelectCallback.value) {
      onAssetSelectCallback.value(url)
    }
    closeAssetLibrary()
  }

  return {
    // Login
    showLogin,
    openLogin,
    closeLogin,
    // Settings
    showSettings,
    openSettings,
    closeSettings,
    // Friend
    showFriendModal,
    editingFriend,
    openFriendModal,
    closeFriendModal,
    // Artwork
    showArtworkModal,
    editingArtwork,
    openArtworkModal,
    closeArtworkModal,
    // Asset Library
    showAssetLibrary,
    openAssetLibrary,
    closeAssetLibrary,
    handleAssetSelect,
  }
})
