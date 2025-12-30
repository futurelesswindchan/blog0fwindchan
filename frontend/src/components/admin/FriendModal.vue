<!-- src/components/admin/FriendModal.vue -->
<template>
  <BaseModal
    :show="modalStore.showFriendModal"
    width="600px"
    height="auto"
    @close="modalStore.closeFriendModal"
  >
    <!-- 使用 flex 布局容器，确保高度撑满 modal-window -->
    <div class="modal-layout">
      <!-- 1. 头部 (固定) -->
      <div class="modal-header">
        <h3>{{ isEdit ? '编辑友链中' : '认识新朋友~' }}</h3>
      </div>

      <!-- 2. 内容区域 (可滚动) -->
      <div class="modal-scroll-area">
        <form id="friend-form" @submit.prevent="handleSubmit" class="modal-form">
          <div class="form-group">
            <label>名称 <span class="required">*</span></label>
            <!-- 使用全局样式 modal-input -->
            <input v-model="form.name" required placeholder="大佬的名字" class="modal-input" />
          </div>

          <div class="form-group">
            <label>链接 <span class="required">*</span></label>
            <input v-model="form.url" required placeholder="https://..." class="modal-input" />
          </div>

          <!-- ImageUploader -->
          <ImageUploader v-model="form.avatar" label="头像" />

          <div class="form-group">
            <label>描述</label>
            <input v-model="form.desc" placeholder="一句话介绍" class="modal-input" />
          </div>

          <div class="form-group">
            <label>标签 (用逗号分隔)</label>
            <input v-model="tagsInput" placeholder="技术, 宅, 游戏" class="modal-input" />
          </div>
        </form>
      </div>

      <!-- 3. 底部 (固定) -->
      <div class="modal-footer">
        <!-- 使用全局样式 modal-btn-* -->
        <button type="button" class="modal-btn-text" @click="modalStore.closeFriendModal">
          取消
        </button>
        <!-- form 属性关联上面的 form id，这样按钮在 form 外面也能提交 -->
        <button type="submit" form="friend-form" class="modal-btn-primary" :disabled="submitting">
          {{ submitting ? '提交中...' : '确定' }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { useFriendStore } from '@/views/stores/friendStore'
import BaseModal from '../common/BaseModal.vue'
import ImageUploader from '@/components/admin/ImageUploader.vue'

const modalStore = useGlobalModalStore()
const friendStore = useFriendStore()

const submitting = ref(false)
const isEdit = computed(() => !!modalStore.editingFriend)

const form = reactive({
  name: '',
  url: '',
  avatar: '',
  desc: '',
})
const tagsInput = ref('')

// 监听弹窗打开或编辑对象变化，填充表单
watch(
  () => modalStore.editingFriend,
  (newVal) => {
    if (newVal) {
      form.name = newVal.name
      form.url = newVal.url
      form.avatar = newVal.avatar || ''
      form.desc = newVal.desc || ''
      tagsInput.value = (newVal.tags || []).join(', ')
    } else {
      // 重置表单
      form.name = ''
      form.url = ''
      form.avatar = ''
      form.desc = ''
      tagsInput.value = ''
    }
  },
  { immediate: true },
)

const handleSubmit = async () => {
  submitting.value = true
  try {
    const tags = tagsInput.value
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t)
    const payload = { ...form, tags }

    if (isEdit.value && modalStore.editingFriend) {
      await friendStore.updateFriend(modalStore.editingFriend.id, payload)
    } else {
      await friendStore.addFriend(payload)
    }

    await friendStore.fetchFriends()
    modalStore.closeFriendModal()
  } catch (e) {
    console.error(e)
    alert('提交失败')
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
  max-height: 80vh; /* 确保在小屏幕下也能滚动 */
}

/* 头部 */
.modal-header {
  padding: 1.5rem 2rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  flex-shrink: 0; /* 防止被压缩 */
}
.modal-header h3 {
  margin: 0;
  color: var(--accent-color);
  font-size: 1.5rem;
  letter-spacing: 1px;
}

/* 滚动区域 */
.modal-scroll-area {
  flex: 1;
  overflow-y: auto; /* 关键：开启垂直滚动 */
  padding: 1.5rem 2rem;
}

/* 表单样式 */
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

/* 底部 */
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
