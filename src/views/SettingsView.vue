<template>
  <div class="settings-view-container">
    <h2 class="page-title">Settings</h2>

    <hr />

    <form class="typewriter-settings-form" @submit.prevent>
      <h1>打字机动画参数</h1>
      <label>
        启用打字机动画：
        <input type="checkbox" v-model="settings.enabled" />
      </label>
      <small class="form-tip"> 关闭后将直接显示完整内容，不再有打字动画效果。 </small>

      <label>
        初始延迟 (ms)：
        <input type="number" v-model.number="settings.initialDelay" min="0" max="3000" />
      </label>
      <small class="form-tip">
        打字动画开始前的等待时间，单位为毫秒。<br />
        例如填 <b>800</b> 表示动画会在页面加载后延迟 0.8 秒开始。
      </small>

      <label>
        速度 (ms/批)：
        <input type="number" v-model.number="settings.speed" min="5" max="200" />
      </label>
      <small class="form-tip">
        每次输出一批文字后等待的时间，单位为毫秒。<br />
        数值越小，打字速度越快。推荐范围：<b>20~80</b>。
      </small>

      <label>
        每批字数：
        <input type="number" v-model.number="settings.chunkSize" min="1" max="20" />
      </label>
      <small class="form-tip">
        每次打字动画输出的字符数量。<br />
        数值越大，动画越快但不够细腻。<b>1</b>为逐字输出，<b>5</b>为每次输出5个字。
      </small>
    </form>

    <form class="typewriter-settings-form" @submit.prevent style="margin-top: 2rem">
      <h1>列表显示参数</h1>
      <label>
        每页文章数量：
        <input type="number" v-model.number="paginationSettings.itemsPerPage" min="1" max="50" />
      </label>
      <small class="form-tip">
        控制文章列表、画廊与友链等页面每页显示的卡片数量。<br />
        画廊的实际显示数量为此处设置的1.5倍。<br />
        建议设置在 <b>6-8</b> 之间以获得最佳阅读体验。
      </small>
    </form>

    <hr />

    <div class="btn-row">
      <button type="button" @click="save">保存更改</button>
      <button type="button" @click="reset">恢复默认</button>
    </div>

    <ToastManager />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import ToastManager from '../components/common/ToastManager.vue'
import { useToast } from '../composables/useToast'

const settingsStore = useSettingsStore()
const settings = reactive({ ...settingsStore.typeWriter })
const paginationSettings = reactive({ ...settingsStore.pagination })

const { addToast } = useToast()

const save = () => {
  settingsStore.setTypeWriterSettings(settings)
  settingsStore.setPaginationSettings(paginationSettings)
  addToast('设置已保存！', 'success', 2200)
}

const reset = () => {
  settingsStore.resetTypeWriterSettings()
  Object.assign(settings, settingsStore.typeWriter)

  paginationSettings.itemsPerPage = 6
  settingsStore.setPaginationSettings(paginationSettings)

  addToast('已恢复为默认设置', 'success', 2200)
}
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

.typewriter-settings-form {
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border: none;
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem 1.5rem;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 119, 255, 0.06);
  /* 可选：让内容不贴边 */
  box-sizing: border-box;
}
.dark-theme .typewriter-settings-form {
  background: rgba(0, 0, 0, 0.75);
}

.typewriter-settings-form h1 {
  color: var(--accent-color);
  margin-bottom: 0.5rem;
  letter-spacing: 2px;
  font-weight: 600;
  text-shadow: 0 1px 0 rgba(0, 119, 255, 0.08);
}

.typewriter-settings-form label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: var(--accent-color);
  font-size: 1.08rem;
  letter-spacing: 1px;
  margin-bottom: 0.1em;
  margin-top: 0.7em;
}

.typewriter-settings-form input[type='number'] {
  width: 90px;
  padding: 0.4em 0.6em;
  border-radius: 8px;
  border: 1px solid var(--aero-border-color);
  background: rgba(255, 255, 255, 0.7);
  color: black;
  font-size: 1rem;
  transition:
    border 0.2s,
    background 0.2s;
  outline: none;
}
.typewriter-settings-form input[type='number']:focus {
  background: rgba(0, 255, 195, 0.594);
  border-color: rgba(0, 119, 255, 0.85);
}

.typewriter-settings-form input[type='checkbox'] {
  width: 22px;
  height: 22px;
  accent-color: var(--accent-color);
  border-radius: 6px;
  border: 1.5px solid var(--aero-border-color);
  background: rgba(255, 255, 255, 0.7);
  transition: border 0.2s;
}

.form-tip {
  color: #002457;
  font-size: 0.97em;
  margin-bottom: 0.5em;
  margin-left: 0.5em;
  line-height: 1.6;
  background: rgba(0, 119, 255, 0.2);
  border-left: 3px solid var(--accent-color);
  padding: 0.4em 0.8em;
  border-radius: 6px;
  font-family: 'Aa偷吃可爱长大的', sans-serif;
}

.dark-theme .form-tip {
  color: #b3d8ff;
  background: rgba(0, 119, 255, 0.3);
  border-left-color: #90caf9;
}

.btn-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.2rem;
  margin: 2rem 0 0 0;
}

.btn-row button {
  margin: 0 0 1.5rem 0;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.3);
  color: var(--accent-color);
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 119, 255, 0.2);
  transition: all 0.3s var(--aero-animation);
}

.btn-row button:hover {
  color: white;
  background: rgb(0, 119, 255);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 119, 255, 0.3);
}

.btn-row button:active {
  transform: scale(0.98);
  opacity: 0.85;
}

.dark-theme .btn-row button {
  background: rgba(0, 0, 0, 0.3);
  color: #90caf9;
}

.dark-theme .btn-row button:hover {
  background: rgb(0, 119, 255);
  color: white;
}
</style>
