<!-- src/components/admin/PlanModal.vue -->
<template>
  <BaseModal
    :show="modalStore.showPlanModal"
    width="500px"
    height="auto"
    @close="modalStore.closePlanModal"
  >
    <div class="modal-layout">
      <div class="modal-header">
        <h3>{{ isEdit ? '修改计划中' : '制定新计划！' }}</h3>
      </div>

      <div class="modal-scroll-area">
        <form id="plan-form" @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label>计划内容 <span class="required">*</span></label>
            <textarea
              v-model="form.content"
              required
              placeholder="比如：给画廊加个3D效果..."
              class="modal-input"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>当前状态 <span class="required">*</span></label>
            <select v-model="form.status" class="modal-input">
              <option value="todo">📌 待办 (Todo)</option>
              <option value="doing">🔥 进行中 (Doing)</option>
              <option value="done">✅ 已完成 (Done)</option>
            </select>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="modal-btn-text" @click="handleCancel">取消</button>
        <button type="submit" form="plan-form" class="modal-btn-primary" :disabled="submitting">
          {{ submitting ? '提交中...' : '确定' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { useActivityStore } from '@/views/stores/activityStore'
import { useToast } from '@/composables/useToast'
import BaseModal from '../common/BaseModal.vue'

const modalStore = useGlobalModalStore()
const activityStore = useActivityStore()
const { notify, confirm } = useToast()

const submitting = ref(false)
const isEdit = computed(() => !!modalStore.editingPlan)

const form = reactive({
  content: '',
  status: 'todo',
})

watch(
  () => modalStore.editingPlan,
  (newVal) => {
    if (newVal) {
      form.content = newVal.content
      form.status = newVal.status
    } else {
      form.content = ''
      form.status = 'todo'
    }
  },
  { immediate: true },
)

const handleCancel = async () => {
  const isConfirmed = await confirm('未保存的计划内容将会丢失哦！', '确定要放弃编辑吗 owo？')
  if (isConfirmed) {
    modalStore.closePlanModal()
  }
}

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (isEdit.value && modalStore.editingPlan) {
      await activityStore.updatePlan(modalStore.editingPlan.id, form)
    } else {
      await activityStore.addPlan(form)
    }

    await activityStore.fetchPlans()
    modalStore.closePlanModal()

    notify({
      type: 'success',
      message: '计划保存成功啦！冲鸭！(≧∇≦)ﾉ',
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

textarea.modal-input {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}
</style>
