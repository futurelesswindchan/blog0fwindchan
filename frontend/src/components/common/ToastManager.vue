<!-- frontend\src\components\common\ToastManager.vue -->
<template>
  <div>
    <CuteToast
      v-for="(t, i) in toasts"
      :key="t.id"
      :message="t.message"
      :type="t.type"
      :visible="t.visible"
      :duration="t.duration"
      :offset="baseOffset + i * gap"
      @after-leave="handleAfterLeave(t.id)"
    />
  </div>
</template>

<script setup lang="ts">
import CuteToast from './CuteToast.vue'
import { useToast } from '../../composables/useToast'

const { toasts, removeToast } = useToast()

const baseOffset = 16 // 初始偏移量
const gap = 72 // 每个 toast 之间的间距

// 这里处理每个 toast 消失后的清理工作
function handleAfterLeave(id: number) {
  removeToast(id)
}
</script>
