<!-- src/views/GalleryView.vue -->
<template>
  <div class="gallery-view-container">
    <h2 class="page-title-art">Gallery</h2>
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
              @click="openPreview(artwork)"
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
          <!-- 预览模态框代码已移除，交由全局组件处理 -->
        </div>
      </section>

      <PaginationControls v-if="pagination && pagination.totalPages > 1" :pagination="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useSearchAndSort } from '@/composables/useSearchAndSort'
import { computed, onMounted } from 'vue'
import { useArtworkStore } from '@/views/stores/artworkStore'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'

import type { Artwork } from '@/views/stores/artworkStore'

import PaginationControls from '@/components/common/PaginationControls.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import LazyImage from '@/components/common/LazyImage.vue'

import '@/styles/correctContentMargin.css'
import '@/styles/pageTitleArt.css'

const artworkStore = useArtworkStore()
const modalStore = useGlobalModalStore()
const artworks = computed(() => artworkStore.artworks)
const settingsStore = useSettingsStore()

const { searchText, filteredItems, sortButton, pagination } = useSearchAndSort({
  items: artworks,
  searchFields: (artwork) => [artwork.title],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),

  // 这里使用了 computed，所以当 settingsStore 变化时，
  // useSearchAndSort 内部的 pageSize 也会变化，从而触发重新计算分页
  // 使用 gallery 专属分页配置
  itemsPerPage: computed(() => Math.ceil(settingsStore.pagination.gallery)),
})

onMounted(async () => {
  await artworkStore.fetchArtworks()
})

// 打开预览，传入当前图片和列表
function openPreview(artwork: Artwork) {
  modalStore.openGalleryPreview(artwork, filteredItems.value)
}
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

.artwork-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.artwork-card:hover .artwork-image :deep(img) {
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
</style>
