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
        <!-- 分组 A: 视觉特效（包含粒子与打字机） -->
        <section id="section-visual-effects" class="settings-group">
          <div class="group-title">视觉特效 (Visual Effects)</div>

          <!-- 子分组：背景粒子 -->
          <div class="sub-group-label">背景粒子 (Particles)</div>

          <div class="setting-row">
            <div class="row-label">
              <span>启用粒子</span>
              <small>只有PC端能享受传说中的的动态背景哦ヾ(•ω•`)o</small>
            </div>
            <button
              class="toggle-switch"
              :class="{ active: particleSettings.enabled }"
              @click="particleSettings.enabled = !particleSettings.enabled"
            >
              <div class="toggle-knob"></div>
            </button>
          </div>

          <template v-if="particleSettings.enabled">
            <div class="setting-row">
              <div class="row-label">
                <span>粒子数量</span>
                <small>小心一点哦，过多可能导致卡顿！awa</small>
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  v-model.number="particleSettings.count"
                  min="10"
                  max="300"
                  step="10"
                />
                <span class="slider-value">{{ particleSettings.count }}</span>
              </div>
            </div>

            <div class="setting-row">
              <div class="row-label">
                <span>运动速度</span>
                <small>调节粒子的漂浮快↑慢↓ ( ⓛ ω ⓛ *)</small>
              </div>
              <div class="slider-container">
                <input
                  type="range"
                  v-model.number="particleSettings.baseSpeed"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                />
                <span class="slider-value">{{ particleSettings.baseSpeed }}</span>
              </div>
            </div>
          </template>

          <div class="divider-dashed"></div>

          <!-- 子分组：打字机 -->
          <div class="sub-group-label">文章打字机 (TypeWriter)</div>

          <div class="setting-row">
            <div class="row-label">
              <span>启用打字动画</span>
              <small>关闭后首页将直接显示完整文本，不再磨叽咧！</small>
            </div>
            <button
              class="toggle-switch"
              :class="{ active: settings.enabled }"
              @click="settings.enabled = !settings.enabled"
            >
              <div class="toggle-knob"></div>
            </button>
          </div>

          <div class="setting-row">
            <div class="row-label">
              <span>启动延迟 (ms)</span>
              <small>进入页面后，要等待这么久才会开始打字哦</small>
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
              <small>数值越小，打字速度当然就越快的啦</small>
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
              <small>每次打出的字符数，长文建议调大一点点♪(´▽｀)</small>
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

        <!-- 分组 B: 消息通知 -->
        <section id="section-toast" class="settings-group">
          <div class="group-title">消息通知 (Notifications)</div>

          <div class="setting-row">
            <div class="row-label">
              <span>弹窗位置</span>
              <small>选择吐司弹窗会在哪里出现！</small>
            </div>
            <select class="modal-select" v-model="toastSettings.position">
              <option value="bottom-left">左下角 (Bottom Left)</option>
              <option value="top-left">左上角 (Top Left)</option>
              <option value="bottom-right">右下角 (Bottom Right)</option>
              <option value="top-right">右上角 (Top Right)</option>
            </select>
          </div>

          <div class="setting-row">
            <div class="row-label">
              <span>默认停留时间 (ms)</span>
              <small>吐司弹窗自己溜走前的等待时间ovO</small>
            </div>
            <input
              type="number"
              class="modal-input short-input"
              v-model.number="toastSettings.duration"
              step="500"
              min="1000"
            />
          </div>
        </section>

        <div class="divider"></div>

        <!-- 分组 C: 显示 -->
        <section id="section-display" class="settings-group">
          <div class="group-title">分页容量 (Pagination)</div>
          <div class="sub-group-label">前台分页容量 (Frontend Pagination)</div>

          <div class="setting-row">
            <div class="row-label">
              <span>文章列表</span>
              <small>文章列表中每页显示的文章卡片数哦</small>
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
              <small>友链页面每页显示的卡片数！</small>
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
              <small>画廊页面每页显示的图片数OwO</small>
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

            <div class="sub-group-label">后台管理分页 (Admin Pagination)</div>

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
import { useToast } from '@/composables/useToast'
import BaseModal from '../common/BaseModal.vue'

const modalStore = useGlobalModalStore()
const settingsStore = useSettingsStore()
const adminStore = useAdminStore()
const { confirm, notify } = useToast()

// 计算属性：是否为管理员
const isAdmin = computed(() => adminStore.isAuthenticated)

// 响应式绑定 Store 中的数据
const settings = reactive({ ...settingsStore.typeWriter })
const particleSettings = reactive({ ...settingsStore.particles })
const paginationSettings = reactive({ ...settingsStore.pagination })
const toastSettings = reactive({ ...settingsStore.toast })

const tabs = [
  { id: 'section-visual-effects', name: '视觉特效', icon: 'fas fa-wand-magic-sparkles' },
  { id: 'section-toast', name: '消息通知', icon: 'fas fa-bell' },
  { id: 'section-display', name: '分页容量', icon: 'fas fa-th-list' },
]
const activeTab = ref('section-visual-effects')
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

// 保存逻辑
const save = () => {
  settingsStore.setTypeWriterSettings(settings)
  settingsStore.setParticleSettings(particleSettings)
  settingsStore.setPaginationSettings(paginationSettings)
  settingsStore.setToastSettings(toastSettings)

  notify({
    message: '设置已保存并生效了(☆▽☆)！',
    type: 'success',
  })

  setTimeout(() => modalStore.closeSettings(), 600)
}

// 重置逻辑
const reset = async () => {
  const isConfirmed = await confirm(
    '此操作将重置所有的设置参数哦，不能撤销0w0~',
    '真的要重置吗(￣ω￣(￣ω￣〃)',
  )

  if (!isConfirmed) return

  settingsStore.resetTypeWriterSettings()
  settingsStore.resetParticleSettings()
  settingsStore.resetPaginationSettings()
  settingsStore.resetToastSettings()

  // 重新同步本地 reactive 数据
  Object.assign(settings, settingsStore.typeWriter)
  Object.assign(particleSettings, settingsStore.particles)
  Object.assign(paginationSettings, settingsStore.pagination)
  Object.assign(toastSettings, settingsStore.toast)

  notify({
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
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--light-text);
  text-transform: uppercase;
  margin-bottom: 1.2rem;
  letter-spacing: 0.5px;
  border-left: 3px solid #0077ff;
  background: #0077ff0a;
  padding-left: 8px;
}

.sub-group-label {
  font-size: 1rem;
  font-weight: bold;
  color: var(--light-text);
  opacity: 0.8;
  margin: 1rem 0 0.5rem 0;
  padding-left: 0.5rem;
  border-left: 3px solid var(--light-text);
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
