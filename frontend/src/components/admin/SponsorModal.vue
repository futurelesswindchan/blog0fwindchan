<!-- src/components/admin/SponsorModal.vue -->
<template>
  <BaseModal
    :show="modalStore.showSponsorModal"
    width="600px"
    height="auto"
    @close="modalStore.closeSponsorModal"
  >
    <div class="modal-layout">
      <div class="modal-header">
        <h3>{{ isEdit ? '修改投喂记录' : '新增投喂大佬！' }}</h3>
      </div>

      <div class="modal-scroll-area">
        <form id="sponsor-form" @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label>大佬昵称 <span class="required">*</span></label>
            <input v-model="form.name" required placeholder="awa..." class="modal-input" />
          </div>

          <ImageUploader v-model="form.avatar" label="大佬头像" />

          <div class="form-group">
            <label>主页链接</label>
            <input v-model="form.url" placeholder="https://..." class="modal-input" />
          </div>

          <div class="form-group">
            <label>留言寄语</label>
            <textarea
              v-model="form.message"
              placeholder="留下一抹星光..."
              class="modal-input"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>投喂日期</label>
            <input type="date" v-model="form.date" class="modal-input" />
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="modal-btn-text" @click="handleCancel">取消</button>
        <button type="submit" form="sponsor-form" class="modal-btn-primary" :disabled="submitting">
          {{ submitting ? '提交中...' : '确定' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { useSponsorStore } from '@/views/stores/sponsorStore'
import { useToast } from '@/composables/useToast'

import BaseModal from '../common/BaseModal.vue'
import ImageUploader from '@/components/admin/ImageUploader.vue'

const modalStore = useGlobalModalStore()
const sponsorStore = useSponsorStore()
const { notify, confirm } = useToast()

const submitting = ref(false)
const isEdit = computed(() => !!modalStore.editingSponsor)

const form = reactive({
  name: '',
  avatar: '',
  url: '',
  message: '',
  date: '',
})

watch(
  () => modalStore.editingSponsor,
  (newVal) => {
    if (newVal) {
      form.name = newVal.name
      form.avatar = newVal.avatar || ''
      form.url = newVal.url || ''
      form.message = newVal.message || ''
      form.date = newVal.date || ''
    } else {
      // 获取当前日期的 YYYY-MM-DD 格式作为默认值
      const today = new Date().toISOString().split('T')[0]
      form.name = ''
      form.avatar = ''
      form.url = ''
      form.message = ''
      form.date = today
    }
  },
  { immediate: true },
)

const handleCancel = async () => {
  const isConfirmed = await confirm('未保存的投喂信息将会丢失哦！', '真的要放弃编辑吗 owo？')
  if (isConfirmed) {
    modalStore.closeSponsorModal()
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (isEdit.value && modalStore.editingSponsor) {
      await sponsorStore.updateSponsor(modalStore.editingSponsor.id, form)
    } else {
      await sponsorStore.addSponsor(form)
    }

    await sponsorStore.fetchSponsors()
    modalStore.closeSponsorModal()

    notify({
      type: 'success',
      message: '投喂记录保存成功啦！感谢大佬！(≧∇≦)ﾉ',
    })
  } catch (e) {
    notify({
      type: 'error',
      title: '保存失败了 QAQ',
      message: `${e}`,
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* 布局容器：撑满 BaseModal 的高度 */
.modal-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 80vh;
}

.modal-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}
.modal-header h3 {
  margin: 0;
  color: var(--accent-color);
  font-size: 1.5rem;
  letter-spacing: 1px;
}

.modal-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 2rem;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.required {
  color: #ff4757;
  margin-left: 4px;
}

.modal-footer {
  padding: 1rem 2rem;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}
</style>
