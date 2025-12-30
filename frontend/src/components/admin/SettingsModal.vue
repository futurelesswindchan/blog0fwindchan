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
      <div class="settings-scroll-area" id="settings-scroll-container">
        <!-- 分组 A: 打字机 -->
        <section id="section-typewriter" class="settings-group">
          <div class="group-title">首页打字机特效 (TypeWriter)</div>

          <!-- 启用开关 -->
          <div class="setting-row">
            <div class="row-label">
              <span>启用动画</span>
              <small>关闭后首页将直接显示完整文本，适合低性能设备。</small>
            </div>
            <!-- 使用 BaseModal 中定义的全局开关样式 -->
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
              <small>进入页面后，等待多久开始打字。建议 400ms 左右。</small>
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
              <small>每个字符输出的间隔时间。数值越小，速度越快。</small>
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
              <small>每次渲染的字符数。增加此值可大幅提升长文显示速度。</small>
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
          <div class="group-title">全局显示 (Display)</div>
          <div class="setting-row">
            <div class="row-label">
              <span>分页容量</span>
              <small>文章列表、画廊、友链每页显示的项目数量。</small>
            </div>
            <input
              type="number"
              class="modal-input short-input"
              v-model.number="paginationSettings.itemsPerPage"
              min="1"
              max="50"
            />
          </div>
        </section>
      </div>

      <!-- 底部固定区域：操作栏 -->
      <div class="settings-footer">
        <button class="modal-btn-text" @click="reset">恢复默认</button>
        <button class="modal-btn-primary" @click="save">保存更改</button>
      </div>
    </div>

    <ToastManager />
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { useToast } from '@/composables/useToast'
import BaseModal from '../common/BaseModal.vue'
import ToastManager from '../common/ToastManager.vue'

const modalStore = useGlobalModalStore()
const settingsStore = useSettingsStore()
const { addToast } = useToast()

// 响应式绑定 Store 中的数据
const settings = reactive({ ...settingsStore.typeWriter })
const paginationSettings = reactive({ ...settingsStore.pagination })

const tabs = [
  { id: 'section-typewriter', name: '动画特效', icon: 'fas fa-keyboard' },
  { id: 'section-display', name: '界面显示', icon: 'fas fa-desktop' },
]
const activeTab = ref('section-typewriter')

const scrollToSection = (id: string) => {
  activeTab.value = id
  const el = document.getElementById(id)
  const container = document.getElementById('settings-scroll-container')
  if (el && container) {
    container.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' })
  }
}

const save = () => {
  settingsStore.setTypeWriterSettings(settings)
  settingsStore.setPaginationSettings(paginationSettings)
  addToast('设置已保存并生效', 'success')
  setTimeout(() => modalStore.closeSettings(), 600)
}

const reset = () => {
  if (!confirm('确定要恢复所有默认设置吗？')) return

  settingsStore.resetTypeWriterSettings()
  settingsStore.resetPaginationSettings()

  // 重新同步本地 reactive 数据
  Object.assign(settings, settingsStore.typeWriter)
  Object.assign(paginationSettings, settingsStore.pagination)

  addToast('已恢复默认设置', 'success')
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

/* 滚动区域 */
.settings-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

.settings-group {
  margin-bottom: 2rem;
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
  max-width: 70%; /* 防止文字太长挤压输入框 */
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

/* 局部微调：短输入框 */
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
}
</style>
