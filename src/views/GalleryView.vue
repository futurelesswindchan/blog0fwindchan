<template>
  <div class="gallery-view-container">
    <h2 class="page-title">Gallery</h2>
    <div class="gallery-view">
      <!-- 搜索栏重新进行了封装 -->
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
            <!-- 这里改为遍历分页后的数据 paginatedArtworks -->
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

          <!-- 预览模态框 -->
          <Teleport to="body">
            <div v-if="previewArtwork" class="preview-modal" @click.self="closePreview">
              <div class="preview-content glass-container">
                <LazyImage
                  :key="previewArtwork.id"
                  :src="previewArtwork.fullsize"
                  :alt="previewArtwork.title"
                  className="preview-image"
                />
                <div class="preview-info">
                  <h3>{{ previewArtwork.title }}</h3>
                  <p class="description">{{ previewArtwork.description }}</p>
                  <p class="date">{{ previewArtwork.date }}</p>
                </div>
                <button class="close-btn" @click="closePreview">
                  <i class="fas fa-times"></i>
                </button>
                <button class="nav-btn prev" @click="navigatePreview(-1)" v-show="canNavigatePrev">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <button class="nav-btn next" @click="navigatePreview(1)" v-show="canNavigateNext">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </Teleport>
        </div>
      </section>

      <!-- 分页组件以重新进行了封装 -->
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

const artworkStore = useArtworkStore()
const artworks = computed(() => artworkStore.artworks)
const settingsStore = useSettingsStore()

// ✨ 修改：解构出 pagination
const { searchText, filteredItems, sortButton, pagination } = useSearchAndSort({
  items: artworks,
  searchFields: (artwork) => [artwork.title],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),

  // 这里使用了 computed，所以当 settingsStore 变化时，
  // useSearchAndSort 内部的 pageSize 也会变化，从而触发重新计算分页
  itemsPerPage: computed(() => Math.ceil(settingsStore.pagination.itemsPerPage * 1.5)),
})

// 页面加载时确保数据已加载
onMounted(async () => {
  await artworkStore.fetchArtworks()
})

// 预览状态
const previewArtwork = ref<Artwork | null>(null)

// 当前预览索引：基于 allFilteredArtworks (全量数据)，保证可以跨页切换预览
const currentIndex = computed(() => {
  if (!previewArtwork.value) return -1
  return filteredItems.value.findIndex((art) => art.id === previewArtwork.value?.id)
})

// 导航状态
const canNavigatePrev = computed(() => currentIndex.value > 0)
const canNavigateNext = computed(() => currentIndex.value < filteredItems.value.length - 1)

// 预览控制
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

// 捕获 setup/onMounted 错误
onErrorCaptured((err, instance, info) => {
  console.error('GalleryView setup/onMounted error:', err, info)
  return false
})
</script>

<style scoped>
.page-title {
  text-align: center;
  color: var(--accent-color);
  margin-bottom: 2rem;
  background-color: rgba(255, 255, 255, 0.1);
  line-height: 175%;
  font-family: 'FleurDeLeah', sans-serif;
  font-size: 3.5rem;
  letter-spacing: 5px;
}
.dark-theme .page-title {
  background-color: rgba(0, 0, 0, 0.1);
}
.gallery-view-container {
  width: 100%;
  min-height: inherit;
}
.gallery-view {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem;
  position: relative;
}
.gallery-content {
  padding: 2rem;
}
.gallery-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
  padding: 1rem;
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
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.preview-content {
  position: relative;
  width: 90vw;
  max-width: 1200px;
  height: 90vh;
  padding: 2rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}
.preview-content :deep(.lazy-image-container) {
  width: 100%;
  height: calc(100% - 100px);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}
.preview-content :deep(.lazy-image-container img) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  width: auto;
  height: auto;
}
.preview-info {
  margin-top: 1rem;
  padding: 1rem;
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
}
.close-btn,
.nav-btn {
  position: absolute;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--aero-border-color);
  color: black;
  width: 64px;
  height: 64px;
  border-radius: 30%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s var(--aero-animation);
  backdrop-filter: var(--aero-blur);
  box-shadow:
    0 0 15px rgba(255, 255, 255, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.2);
}
.close-btn:hover,
.nav-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.1);
  box-shadow:
    0 0 20px rgba(255, 255, 255, 0.2),
    0 6px 12px rgba(0, 0, 0, 0.3);
}
.close-btn:active,
.nav-btn:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.05);
  box-shadow:
    0 0 10px rgba(255, 255, 255, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.2);
}
.close-btn {
  top: 1.5rem;
  right: 1.5rem;
  font-size: 1.2rem;
}
.nav-btn {
  top: 50%;
  font-size: 1.5rem;
}
.nav-btn.prev {
  left: -24px;
}
.nav-btn.next {
  right: -24px;
}
.nav-btn i {
  transition: transform 0.3s var(--aero-animation);
}
.nav-btn:hover i {
  transform: scale(1.2);
}
@media (max-width: 1200px) {
  .gallery-container.masonry {
    columns: 3 250px;
  }
}
@media (max-width: 900px) {
  .gallery-container.masonry {
    columns: 2 250px;
  }
}
@media (max-width: 600px) {
  .gallery-container.masonry {
    columns: 1 250px;
  }
  .preview-content {
    padding: 1rem;
  }
}
@media (max-width: 768px) {
  .preview-content {
    padding: 1rem;
  }
  .preview-content :deep(.lazy-image-container) {
    max-height: calc(80vh - 80px);
  }
  .nav-btn {
    width: 40px;
    height: 40px;
  }
  .nav-btn.prev {
    left: -20px;
  }
  .nav-btn.next {
    right: -20px;
  }
}
</style>
