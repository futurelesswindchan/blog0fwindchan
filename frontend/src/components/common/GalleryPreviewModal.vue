<!-- src/components/common/GalleryPreviewModal.vue -->
<template>
  <BaseModal
    :show="modalStore.showGalleryPreview"
    width="80vw"
    height="85vh"
    @close="modalStore.closeGalleryPreview"
  >
    <div class="preview-layout" v-if="modalStore.previewArtwork">
      <!-- 1. 顶部标题栏 -->
      <div class="preview-header">
        <h3>{{ modalStore.previewArtwork.title }}</h3>
        <!-- BaseModal 自带的关闭按钮会浮动在右上角，刚好在这个 Header 区域内 -->
      </div>

      <!-- 2. 中间图片区域 -->
      <div class="preview-middle">
        <LazyImage
          :key="modalStore.previewArtwork.id"
          :src="modalStore.previewArtwork.fullsize"
          :alt="modalStore.previewArtwork.title"
          className="preview-image"
        />

        <!-- 导航按钮 -->
        <button
          class="nav-strip prev"
          @click.stop="modalStore.navigateGallery(-1)"
          v-show="modalStore.hasPrev"
          title="上一张"
        >
          <div class="nav-icon-bg">
            <i class="fas fa-chevron-left"></i>
          </div>
        </button>
        <button
          class="nav-strip next"
          @click.stop="modalStore.navigateGallery(1)"
          v-show="modalStore.hasNext"
          title="下一张"
        >
          <div class="nav-icon-bg">
            <i class="fas fa-chevron-right"></i>
          </div>
        </button>
      </div>

      <!-- 3. 底部信息区域 -->
      <div class="preview-footer">
        <div class="meta-row">
          <span class="date">
            <i class="far fa-calendar-alt"></i> {{ modalStore.previewArtwork.date }}
          </span>
        </div>
        <p class="description" v-if="modalStore.previewArtwork.description">
          {{ modalStore.previewArtwork.description }}
        </p>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import LazyImage from '@/components/common/LazyImage.vue'
import BaseModal from '../common/BaseModal.vue'

const modalStore = useGlobalModalStore()
</script>

<style scoped>
.preview-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

/* === 1. 顶部 Header === */
.preview-header {
  height: 60px; /* 固定高度 */
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 60px 0 2rem; /* 右侧留出 60px 给关闭按钮 */
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.5);
}

.preview-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--accent-color);
  font-family: 'Aa偷吃可爱长大的', sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* === 2. 中间图片区域 === */
.preview-middle {
  flex: 1; /* 占据剩余空间 */
  width: 100%;
  overflow: hidden;
  position: relative;
  background: rgba(0, 0, 0, 0.02); /* 浅灰底色衬托图片 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-middle :deep(.lazy-image-container) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-middle :deep(img) {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.1));
}

/* --- 导航条样式优化 --- */
.nav-strip {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 80px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  transition: all 0.3s ease;
  outline: none;
}

.nav-strip.prev {
  left: 0;
}
.nav-strip.next {
  right: 0;
}

/* 图标容器：用于控制图标的大小和背景 */
.nav-icon-bg {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  transition: all 0.3s ease;
}

.nav-strip i {
  font-size: 1.2rem;
}

/* PC端 Hover 效果 */
@media (hover: hover) {
  .nav-strip:hover {
    background: #0077ff6f;
  }

  .nav-strip:hover .nav-icon-bg {
    color: white;
    transform: scale(1.1);
  }
}

/* === 3. 底部 Footer === */
.preview-footer {
  flex-shrink: 0;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.6);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  /* 如果内容太长，允许底部滚动，或者限制高度 */
  max-height: 150px;
  overflow-y: auto;
}

.preview-footer .meta-row {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
  opacity: 0.8;
}

.preview-footer .description {
  margin: 0;
  font-size: 1rem;
  color: var(--text-color);
  line-height: 1.6;
}

/* === 移动端适配 === */
@media (max-width: 768px) {
  .preview-header {
    height: 50px;
    padding: 0 50px 0 1rem;
  }

  .nav-strip {
    width: 50px;
  }

  .preview-footer {
    padding: 0.8rem 1rem;
  }
}
</style>
