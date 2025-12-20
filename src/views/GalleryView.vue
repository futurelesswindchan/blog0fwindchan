<!-- src\views\GalleryView.vue -->
<template>
  <div class="gallery-view-container">
    <h2 class="page-title">Gallery</h2>
    <div class="gallery-view">
      <!-- 搜索栏 -->
      <FilterBar
        v-model:searchText="searchText"
        :sort-button="sortButton"
        placeholder="搜索文章..."
      />

      <section class="gallery-content glass-container">
        <div v-if="artworkStore.loading" class="loading">加载中...</div>
        <div v-else-if="artworkStore.error" class="error">{{ artworkStore.error }}</div>
        <div v-else>
          <div class="gallery-container">
            <div
              v-for="artwork in filteredItems"
              :key="artwork.id"
              class="artwork-card"
              @click="showPreview(artwork)"
            >
              <div class="artwork-image">
                <LazyImage
                  :src="artwork.thumbnail"
                  :alt="artwork.title"
                  className="artwork-thumbnail"
                />
              </div>
              <div class="artwork-info">
                <h3>{{ artwork.title }}</h3>
                <p class="date">{{ artwork.date }}</p>
              </div>
            </div>
          </div>

          <!-- 预览模态框 (2025-12-20重构版) -->
          <Teleport to="body">
            <Transition name="modal-fade">
              <div v-if="previewArtwork" class="modal-overlay" @click.self="closePreview">
                <div class="modal-content gallery-modal-content">
                  <!-- 图片区域 -->
                  <div class="preview-image-wrapper">
                    <LazyImage
                      :key="previewArtwork.id"
                      :src="previewArtwork.fullsize"
                      :alt="previewArtwork.title"
                      className="preview-image"
                    />
                  </div>

                  <!-- 信息区域 -->
                  <div class="preview-info">
                    <h3>{{ previewArtwork.title }}</h3>
                    <p class="description">{{ previewArtwork.description }}</p>
                    <div class="meta-row">
                      <span class="date"
                        ><i class="far fa-calendar-alt"></i> {{ previewArtwork.date }}</span
                      >
                    </div>
                  </div>

                  <!-- 关闭按钮 -->
                  <button class="close-btn" @click="closePreview" title="关闭">
                    <i class="fas fa-times"></i>
                  </button>

                  <!-- 导航按钮 -->
                  <button
                    class="nav-btn prev"
                    @click="navigatePreview(-1)"
                    v-show="canNavigatePrev"
                    title="上一张"
                  >
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <button
                    class="nav-btn next"
                    @click="navigatePreview(1)"
                    v-show="canNavigateNext"
                    title="下一张"
                  >
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </Transition>
          </Teleport>
        </div>
      </section>

      <!-- 分页组件 -->
      <PaginationControls v-if="pagination && pagination.totalPages > 1" :pagination="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useSearchAndSort } from '@/composables/useSearchAndSort'
import { ref, computed, onMounted, onErrorCaptured } from 'vue'
import { useArtworkStore } from '@/views/stores/artworkStore'

import type { Artwork } from '@/views/stores/artworkStore'

import PaginationControls from '@/components/common/PaginationControls.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import LazyImage from '@/components/common/LazyImage.vue'

import '@/styles/correctContentMargin.css'
import '@/styles/pageTitle.css'

const artworkStore = useArtworkStore()
const artworks = computed(() => artworkStore.artworks)
const settingsStore = useSettingsStore()

const { searchText, filteredItems, sortButton, pagination } = useSearchAndSort({
  items: artworks,
  searchFields: (artwork) => [artwork.title],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  itemsPerPage: computed(() => Math.ceil(settingsStore.pagination.itemsPerPage * 1.5)),
})

onMounted(async () => {
  await artworkStore.fetchArtworks()
})

const previewArtwork = ref<Artwork | null>(null)

const currentIndex = computed(() => {
  if (!previewArtwork.value) return -1
  return filteredItems.value.findIndex((art) => art.id === previewArtwork.value?.id)
})

const canNavigatePrev = computed(() => currentIndex.value > 0)
const canNavigateNext = computed(() => currentIndex.value < filteredItems.value.length - 1)

function showPreview(artwork: Artwork) {
  previewArtwork.value = artwork
}
function closePreview() {
  previewArtwork.value = null
}
function navigatePreview(direction: 1 | -1) {
  const newIndex = currentIndex.value + direction
  if (newIndex >= 0 && newIndex < filteredItems.value.length) {
    previewArtwork.value = filteredItems.value[newIndex]
  }
}

onErrorCaptured((err, instance, info) => {
  console.error('GalleryView setup/onMounted error:', err, info)
  return false
})
</script>

<style scoped>
.gallery-content {
  padding: 2rem;
}

.gallery-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  padding: 1rem;
}

@media (max-width: 768px) {
  .gallery-container {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 565px) {
  .gallery-container {
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    padding: 0.5rem;
  }
}

@media (max-width: 502px) {
  .gallery-container {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    padding: 0.5rem;
  }
}

.artwork-card {
  position: relative;
  aspect-ratio: 1;
  cursor: pointer;
  transition: all 0.3s var(--aero-animation);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.artwork-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.artwork-image {
  width: 100%;
  height: 100%;
}

.artwork-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.artwork-card:hover .artwork-image img {
  transform: scale(1.05);
}

.artwork-info {
  position: absolute;
  bottom: -100%;
  left: 0;
  right: 0;
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(0);
  transition: all 0.4s var(--aero-animation);
}

.artwork-card:hover .artwork-info {
  bottom: 0;
  transform: translateY(0);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
}

.artwork-info h3 {
  color: #4a4a4a;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  font-family: 'Aa偷吃可爱长大的', sans-serif;
}

.artwork-info .date {
  color: #666;
  font-size: 0.9rem;
  opacity: 0.8;
}

/* =========================================
   新版模态框样式
   ========================================= */

/* 1. 遮罩层 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px); /* 核心模糊 */
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  /* 动画由 Vue Transition 控制 */
}

/* 2. 弹窗主体 */
.modal-content {
  /* 基础玻璃质感 */
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  box-shadow:
    0 20px 50px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.2) inset;

  /* 布局属性 */
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* 动画初始状态由 Vue Transition 控制 */
}

/* 画廊专用尺寸覆盖 */
.gallery-modal-content {
  width: 90vw;
  height: 85vh;
  max-width: 1200px;
  padding: 0; /* 移除内边距，让图片撑满 */
}

/* 3. 图片区域 */
.preview-image-wrapper {
  flex: 1; /* 占据剩余空间 */
  width: 100%;
  overflow: hidden;
  position: relative;
  background: rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 这里的 :deep 是为了穿透 LazyImage 组件 */
.preview-image-wrapper :deep(.lazy-image-container) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image-wrapper :deep(img) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* 4. 信息区域 */
.preview-info {
  padding: 1.5rem 2rem;
  background: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  text-align: center;
  flex-shrink: 0; /* 防止被压缩 */
}

.preview-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: var(--accent-color);
  font-family: 'Aa偷吃可爱长大的', sans-serif;
}

.preview-info .description {
  font-size: 1rem;
  color: var(--text-color);
  opacity: 0.8;
  margin-bottom: 0.5rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.preview-info .meta-row {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  opacity: 0.6;
}

/* 5. 按钮样式 (关闭 & 导航) */
.close-btn,
.nav-btn {
  position: absolute;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: var(--text-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: 10;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.close-btn:hover,
.nav-btn:hover {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: rgba(0, 119, 255, 0.5);
  transform: scale(1.1), translateY(-50%);
  box-shadow: 0 8px 20px rgba(var(--accent-color-rgb), 0.3);
}

.close-btn:active,
.nav-btn:active {
  transform: scale(0.95);
}

/* 按钮定位 */
.close-btn {
  top: 1.5rem;
  right: 1.5rem;
}

.nav-btn {
  top: 50%;
  transform: translateY(-50%);
}

.nav-btn.prev {
  left: 1.5rem;
}

.nav-btn.next {
  right: 1.5rem;
}

/* 6. Vue Transition 动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content {
  animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-leave-active .modal-content {
  animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse;
}

@keyframes modalSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 7. 移动端适配 */
@media (max-width: 768px) {
  .gallery-modal-content {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
    border: none;
  }

  .nav-btn {
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.3); /* 移动端加深背景以防看不清 */
    color: white;
    border: none;
  }

  .nav-btn.prev {
    left: 10px;
  }
  .nav-btn.next {
    right: 10px;
  }
  .close-btn {
    top: 10px;
    right: 10px;
  }

  .preview-info {
    padding: 1rem;
  }

  .preview-info h3 {
    font-size: 1.2rem;
  }
}
</style>
