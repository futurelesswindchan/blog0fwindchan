<!-- src/components/admin/SettingsModal.vue -->
<template>
  <BaseModal
    :show="modalStore.showSettings"
    width="700px"
    height="600px"
    @close="modalStore.closeSettings"
  >
    <div class="settings-layout">
      <!-- 顶部固定区域：标题 + 导航 -->
      <div class="settings-header">
        <h2>Website&nbsp;Settings</h2>
        <nav class="settings-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="modal-nav-pill"
            :class="{ active: activeTab === tab.id }"
            @click="scrollToSection(tab.id)"
          >
            <i :class="tab.icon"></i> {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- 中间滚动区域 -->
      <div class="settings-scroll-area" ref="scrollContainer">
        <!-- 分组 A: 打字机 -->
        <section id="section-typewriter" class="settings-group">
          <div class="group-title">首页打字机特效 (TypeWriter)</div>

          <!-- 启用开关 -->
          <div class="setting-row">
            <div class="row-label">
              <span>启用动画</span>
              <small>关闭后首页将直接显示完整文本，适合低性能设备。</small>
            </div>
            <button
              class="toggle-switch"
              :class="{ active: settings.enabled }"
              @click="settings.enabled = !settings.enabled"
            >
              <div class="toggle-knob"></div>
            </button>
          </div>

          <!-- 详细参数 -->
          <div class="setting-row">
            <div class="row-label">
              <span>启动延迟 (ms)</span>
              <small>进入页面后，等待多久开始打字。</small>
            </div>
            <input
              type="number"
              class="modal-input short-input"
              v-model.number="settings.initialDelay"
              step="100"
            />
          </div>

          <div class="setting-row">
            <div class="row-label">
              <span>打字间隔 (ms)</span>
              <small>数值越小，速度越快。</small>
            </div>
            <input
              type="number"
              class="modal-input short-input"
              v-model.number="settings.speed"
              step="5"
              min="1"
            />
          </div>

          <div class="setting-row">
            <div class="row-label">
              <span>块大小 (Chunk Size)</span>
              <small>每次渲染的字符数，长文建议调大。</small>
            </div>
            <input
              type="number"
              class="modal-input short-input"
              v-model.number="settings.chunkSize"
              min="1"
              max="10"
            />
          </div>
        </section>

        <div class="divider"></div>

        <!-- 分组 B: 显示 -->
        <section id="section-display" class="settings-group">
          <div class="group-title">前台分页容量 (Frontend Pagination)</div>

          <div class="setting-row">
            <div class="row-label">
              <span>文章列表</span>
              <small>首页及分类页每页显示的文章数。</small>
            </div>
            <input
              type="number"
              class="modal-input short-input"
              v-model.number="paginationSettings.articles"
              min="1"
              max="20"
            />
          </div>

          <div class="setting-row">
            <div class="row-label">
              <span>友链列表</span>
              <small>友链页面每页显示的卡片数。</small>
            </div>
            <input
              type="number"
              class="modal-input short-input"
              v-model.number="paginationSettings.friends"
              min="1"
              max="50"
            />
          </div>

          <div class="setting-row">
            <div class="row-label">
              <span>画廊列表</span>
              <small>画廊页面每页显示的图片数。</small>
            </div>
            <input
              type="number"
              class="modal-input short-input"
              v-model.number="paginationSettings.gallery"
              min="1"
              max="50"
            />
          </div>

          <!-- 后台设置 -->
          <template v-if="isAdmin">
            <div class="divider-dashed"></div>

            <div class="group-title">后台管理分页 (Admin Pagination)</div>

            <div class="setting-grid">
              <div class="setting-grid-item">
                <label>文章管理</label>
                <input
                  type="number"
                  class="modal-input tiny-input"
                  v-model.number="paginationSettings.adminArticles"
                  min="5"
                  max="100"
                />
              </div>
              <div class="setting-grid-item">
                <label>友链管理</label>
                <input
                  type="number"
                  class="modal-input tiny-input"
                  v-model.number="paginationSettings.adminFriends"
                  min="5"
                  max="100"
                />
              </div>
              <div class="setting-grid-item">
                <label>画廊管理</label>
                <input
                  type="number"
                  class="modal-input tiny-input"
                  v-model.number="paginationSettings.adminGallery"
                  min="5"
                  max="100"
                />
              </div>
            </div>
          </template>
        </section>
      </div>

      <!-- 底部固定区域 -->
      <div class="settings-footer">
        <button class="modal-btn-text" @click="reset">恢复默认</button>
        <button class="modal-btn-primary" @click="save">保存更改</button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { useAdminStore } from '@/views/stores/adminStore'
import { useToastStore } from '@/views/stores/toastStore'
import BaseModal from '../common/BaseModal.vue'

const modalStore = useGlobalModalStore()
const settingsStore = useSettingsStore()
const adminStore = useAdminStore()
const toastStore = useToastStore()

// 计算属性：是否为管理员
const isAdmin = computed(() => adminStore.isAuthenticated)

// 响应式绑定 Store 中的数据
const settings = reactive({ ...settingsStore.typeWriter })
const paginationSettings = reactive({ ...settingsStore.pagination })

const tabs = [
  { id: 'section-typewriter', name: '动画特效', icon: 'fas fa-keyboard' },
  { id: 'section-display', name: '界面显示', icon: 'fas fa-desktop' },
]
const activeTab = ref('section-typewriter')
const scrollContainer = ref<HTMLElement | null>(null)

// 滚动逻辑
const scrollToSection = (id: string) => {
  activeTab.value = id
  const el = document.getElementById(id)
  const container = scrollContainer.value

  if (el && container) {
    const top = el.offsetTop - 20
    container.scrollTo({
      top: top,
      behavior: 'smooth',
    })
  }
}

const save = () => {
  settingsStore.setTypeWriterSettings(settings)
  settingsStore.setPaginationSettings(paginationSettings)

  // 使用新的对象传参方式
  toastStore.add({
    message: '设置已保存并生效',
    type: 'success',
  })

  setTimeout(() => modalStore.closeSettings(), 600)
}

const reset = () => {
  if (!confirm('确定要恢复所有默认设置吗？')) return

  settingsStore.resetTypeWriterSettings()
  settingsStore.resetPaginationSettings()

  // 重新同步本地 reactive 数据
  Object.assign(settings, settingsStore.typeWriter)
  Object.assign(paginationSettings, settingsStore.pagination)

  // 使用新的对象传参方式
  toastStore.add({
    message: '已恢复默认设置',
    type: 'success',
  })
}
</script>

<style scoped>
.settings-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.settings-header {
  padding: 1.5rem 2rem 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0; /* 防止头部被压缩 */
}

.settings-header h2 {
  margin: 0 0 1rem 0;
  font-family: 'FleurDeLeah', cursive;
  font-size: 2.2rem;
  color: var(--accent-color);
}

.settings-nav {
  display: flex;
  gap: 0.5rem;
}

/* 滚动区域样式 */
.settings-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  position: relative; /* 作为 offsetParent */
  scroll-behavior: smooth;
}

.settings-group {
  margin-bottom: 2rem;
  /* 确保有足够的空间被滚动定位 */
  scroll-margin-top: 20px;
}

.group-title {
  font-size: 0.85rem;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 1.2rem;
  letter-spacing: 0.5px;
  border-left: 3px solid var(--accent-color);
  padding-left: 8px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.2rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}
.setting-row:last-child {
  border-bottom: none;
}

.row-label {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.row-label span {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-color);
  margin-bottom: 4px;
}

.row-label small {
  font-size: 0.8rem;
  color: #999;
  line-height: 1.4;
}

.short-input {
  width: 80px;
  text-align: center;
}

.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.05);
  margin: 1rem 0 2rem;
}

/* 底部 */
.settings-footer {
  padding: 1rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  flex-shrink: 0; /* 防止底部被压缩 */
}

/* 后台设置专属样式 */
.divider-dashed {
  height: 1px;
  border-top: 1px dashed rgba(0, 0, 0, 0.1);
  margin: 1.5rem 0;
}

.setting-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  background: rgba(0, 0, 0, 0.02);
  padding: 1rem;
  border-radius: 8px;
}

.setting-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.setting-grid-item label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
}

.tiny-input {
  width: 60px;
  text-align: center;
  padding: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}
</style>
