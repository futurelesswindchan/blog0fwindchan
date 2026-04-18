<!-- src/components/admin/CollectionModal.vue -->
<template>
  <BaseModal
    :show="modalStore.showCollectionModal"
    width="500px"
    height="auto"
    @close="modalStore.closeCollectionModal"
  >
    <div class="modal-layout">
      <div class="modal-header">
        <h3>{{ isEdit ? '编辑连载合集' : '新建连载合集' }}</h3>
      </div>

      <div class="modal-scroll-area">
        <form id="collection-form" @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label>合集名称 <span class="required">*</span></label>
            <input
              v-model="form.name"
              required
              placeholder="如：Vue3 源码解析"
              class="modal-input"
            />
          </div>

          <div class="form-group">
            <label>Slug标识(建立后不可更改)<span class="required">*</span></label>
            <input
              v-model="form.slug"
              required
              :disabled="isEdit"
              placeholder="如：vue3-source-code (创建后不可改)"
              class="modal-input"
              :style="{ opacity: isEdit ? 0.6 : 1 }"
            />
          </div>

          <div class="form-group">
            <label>归属分类(建立后不可更改)<span class="required">*</span></label>
            <select v-model="form.category" required class="modal-input" :disabled="isEdit">
              <option value="frontend">技术手记</option>
              <option value="topics">奇怪杂谈</option>
              <option value="novels">幻想物语</option>
            </select>
          </div>

          <div class="form-group">
            <label>合集简介</label>
            <textarea
              v-model="form.description"
              placeholder="一句话介绍一下这个合集吧~"
              class="modal-input"
              rows="3"
              style="resize: vertical; min-height: 80px"
            ></textarea>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" class="modal-btn-text" @click="modalStore.closeCollectionModal">
          取消
        </button>
        <button
          type="submit"
          form="collection-form"
          class="modal-btn-primary"
          :disabled="submitting"
        >
          {{ submitting ? '魔法咏唱中...' : '确定' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { useArticleStore, type CollectionSummary } from '@/views/stores/articleStore'
import { useToast } from '@/composables/useToast'
import BaseModal from '../common/BaseModal.vue'
import api from '@/api'

const modalStore = useGlobalModalStore()
const articleStore = useArticleStore()
const { notify } = useToast()

const submitting = ref(false)
const isEdit = computed(() => !!modalStore.editingCollection)

const form = reactive({
  name: '',
  slug: '',
  category: 'frontend',
  description: '',
})

// 监听弹窗数据注入
watch(
  () => modalStore.editingCollection,
  (newVal: (CollectionSummary & { category?: string }) | null) => {
    if (newVal) {
      form.name = newVal.name
      form.slug = newVal.id // 我们的 id 就是 slug
      form.category = newVal.category || 'frontend'
      form.description = newVal.description || ''
    } else {
      form.name = ''
      form.slug = ''
      form.category = 'frontend'
      form.description = ''
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  submitting.value = true
  try {
    if (isEdit.value) {
      // 如果是编辑，调用 PUT 接口
      await api.put(`/admin/collections/${form.slug}`, form)
    } else {
      // 否则调用 POST 接口新建
      await api.post('/admin/collections', form)
    }

    await articleStore.fetchArticleIndex() // 刷新全局状态
    modalStore.closeCollectionModal()

    notify({
      type: 'success',
      message: isEdit.value ? '合集更新成功啦！OvO' : '新合集创建成功啦！OvO',
    })
  } catch (e) {
    notify({
      type: 'error',
      title: '糟糕！魔法失灵了 >_<',
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
</style>
