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

const baseOffset = 16 // px from bottom for the first toast
const gap = 72 // vertical spacing per toast (approx height + margin)

function handleAfterLeave(id: number) {
  // ensure removal if still present
  removeToast(id)
}
</script>

<style scoped>
/* The manager itself doesn't need extra styles — positioning handled by each toast's offset */
</style>
