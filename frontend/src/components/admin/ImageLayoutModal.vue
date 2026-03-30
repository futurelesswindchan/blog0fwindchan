<!-- src/components/admin/ImageLayoutModal.vue -->
<template>
  <BaseModal
    :show="layoutStore.showModal"
    width="600px"
    height="auto"
    @close="layoutStore.closeModal"
  >
    <div class="modal-layout">
      <!-- 模态框头部 -->
      <div class="modal-header">
        <h3>选择图片排版方式</h3>
      </div>

      <!-- 排版选项网格 -->
      <div class="modal-scroll-area">
        <div class="layout-grid">
          <button
            v-for="layout in layouts"
            :key="layout.id"
            class="layout-card"
            :class="{ active: layoutStore.selectedLayout === layout.id }"
            @click="selectLayout(layout.id)"
          >
            <!-- 排版预览区域 -->
            <div class="layout-preview" :class="`preview-${layout.id}`">
              <!-- 右浮动：文字在左，图片在右 -->
              <template v-if="layout.id === 'right'">
                <div class="preview-text"></div>
                <div class="preview-img"></div>
              </template>
              <!-- 左浮动：图片在左，文字在右 -->
              <template v-else-if="layout.id === 'left'">
                <div class="preview-img"></div>
                <div class="preview-text"></div>
              </template>
              <!-- 其他模式：仅显示图片 -->
              <template v-else>
                <div class="preview-img"></div>
              </template>
            </div>

            <!-- 排版名称和描述 -->
            <div class="layout-name">{{ layout.name }}</div>
            <div class="layout-desc">{{ layout.desc }}</div>
          </button>
        </div>

        <!-- 尺寸调节区域 -->
        <div class="size-control-area" v-if="layoutStore.selectedLayout !== 'full'">
          <div class="size-control-header">
            <label>图片尺寸</label>
            <span class="size-display">{{ layoutStore.imageSize }} rem</span>
          </div>
          <div class="size-slider-wrapper">
            <input
              type="range"
              v-model.number="layoutStore.imageSize"
              :min="layoutStore.sizeRanges[layoutStore.selectedLayout].min"
              :max="layoutStore.sizeRanges[layoutStore.selectedLayout].max"
              class="size-slider"
            />
          </div>
        </div>

        <!-- 全宽显示时的灰色提示 -->
        <div v-else class="size-control-area disabled">
          <div class="size-control-header">
            <label>图片尺寸</label>
            <span class="size-display">自动占满</span>
          </div>
        </div>
      </div>

      <!-- 模态框底部操作按钮 -->
      <div class="modal-footer">
        <button type="button" class="modal-btn-text" @click="layoutStore.closeModal">取消</button>
        <button type="button" class="modal-btn-primary" @click="handleConfirm">确认插入</button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { useImageLayoutStore } from '@/views/stores/imageLayoutStore'
import BaseModal from '../common/BaseModal.vue'

const layoutStore = useImageLayoutStore()

/**
 * 排版方式配置列表
 * @property {string} id - 排版方式唯一标识
 * @property {string} name - 排版方式显示名称
 * @property {string} desc - 排版方式描述文本
 */
const layouts = [
  {
    id: 'auto',
    name: '原图自适应',
    desc: '保持原始尺寸，居中显示',
  },
  {
    id: 'full',
    name: '全宽显示',
    desc: '拉伸占满容器宽度',
  },
  {
    id: 'inline',
    name: '行内显示',
    desc: '小图/表情包，不独占一行',
  },
  {
    id: 'left',
    name: '左浮动',
    desc: '图片靠左，文字环绕右侧',
  },
  {
    id: 'right',
    name: '右浮动',
    desc: '图片靠右，文字环绕左侧',
  },
]

/**
 * 选择排版方式并更新对应的默认尺寸
 * @param layoutId - 排版方式 ID
 */
const selectLayout = (layoutId: string) => {
  layoutStore.switchLayout(layoutId)
}

/**
 * 处理排版方式确认
 * 调用 Store 的选择处理方法
 */
const handleConfirm = () => {
  layoutStore.confirmSelection(layoutStore.selectedLayout)
}
</script>

<style scoped>
/* ========================================
 模态框布局与头部样式
 ======================================== */

.modal-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.modal-header h3 {
  margin: 0;
  color: var(--accent-color);
  font-size: 1.3rem;
}

/* ========================================
 排版选项网格
 ======================================== */

.modal-scroll-area {
  padding: 1.5rem 2rem;
  flex: 1;
  overflow-y: auto;
}

.layout-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* ========================================
 排版卡片样式
 ======================================== */

.layout-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s;
}

.dark-theme .layout-card {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.layout-card:hover {
  border-color: rgba(19, 84, 205, 0.3);
  background: rgba(0, 119, 255, 0.05);
}

/* 选中状态样式 */
.layout-card.active {
  border-color: rgba(19, 84, 205, 0.8);
  background: rgba(6, 76, 156, 0.15);
  box-shadow: 0 0 0 3px rgba(0, 119, 255, 0.1);
}

/* ========================================
 排版预览区域
 ======================================== */

.layout-preview {
  width: 100%;
  height: 80px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.dark-theme .layout-preview {
  background: rgba(255, 255, 255, 0.05);
}

/* 预览图片元素 */
.preview-img {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #0077ff, #00d4ff);
  border-radius: 4px;
  flex-shrink: 0;
}

/* 预览文字元素（用条纹表示文本行） */
.preview-text {
  background: repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.15) 4px,
    transparent 4px,
    transparent 8px
  );
  border-radius: 2px;
}

/* 全宽显示预览 */
.preview-full .preview-img {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

/* 行内显示预览 */
.preview-inline .preview-img {
  width: 30px;
  height: 30px;
}

/* 左浮动预览：图片在左，文字在右 */
.preview-left {
  justify-content: flex-start;
  padding: 8px;
  gap: 8px;
}

.preview-left .preview-img {
  width: 36px;
  height: 50px;
}

.preview-left .preview-text {
  flex: 1;
  height: 50px;
}

/* 右浮动预览：文字在左，图片在右 */
.preview-right {
  justify-content: flex-end;
  padding: 8px;
  gap: 8px;
}

.preview-right .preview-img {
  width: 36px;
  height: 50px;
}

.preview-right .preview-text {
  flex: 1;
  height: 50px;
}

/* ========================================
 排版名称和描述
 ======================================== */

.layout-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
}

.layout-desc {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  text-align: center;
}

/* ========================================
 尺寸调节区域
 ======================================== */

.size-control-area {
  padding: 1.2rem;
  background: rgba(0, 119, 255, 0.04);
  border-radius: 8px;
  border: 1px solid rgba(0, 119, 255, 0.1);
  transition: all 0.3s;
}

.dark-theme .size-control-area {
  background: rgba(0, 119, 255, 0.08);
  border-color: rgba(0, 119, 255, 0.15);
}

/* 全宽显示时的禁用状态 */
.size-control-area.disabled {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.06);
  opacity: 0.5;
  pointer-events: none;
}

.dark-theme .size-control-area.disabled {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.06);
}

.size-control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.size-control-header label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.size-display {
  font-family: 'JetBrainsMono', monospace;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--accent-color);
  background: rgba(0, 119, 255, 0.1);
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
}

/* 滑条容器 */
.size-slider-wrapper {
  position: relative;
  padding: 0.2rem 0;
}

/* 滑条样式 */
.size-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(0, 119, 255, 0.15);
  outline: none;
  cursor: pointer;
  transition: background 0.2s;
}

.dark-theme .size-slider {
  background: rgba(0, 119, 255, 0.25);
}

/* 滑条滑块 - Webkit 浏览器 */
.size-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-color, #0077ff);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 119, 255, 0.3);
  transition: all 0.2s;
}

.size-slider::-webkit-slider-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 12px rgba(0, 119, 255, 0.4);
}

/* 滑条滑块 - Firefox */
.size-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-color, #0077ff);
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 119, 255, 0.3);
  transition: all 0.2s;
}

.size-slider::-moz-range-thumb:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 12px rgba(0, 119, 255, 0.4);
}

/* 滑条轨道已填充部分 - Firefox */
.size-slider::-moz-range-progress {
  background: var(--accent-color, #0077ff);
  border-radius: 3px;
  height: 6px;
}

/* ========================================
 模态框底部操作区
 ======================================== */

.modal-footer {
  padding: 1rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>
