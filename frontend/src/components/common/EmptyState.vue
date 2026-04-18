<!-- src/components/common/EmptyState.vue -->
<template>
  <div class="empty-state glass-container">
    <i :class="['fas', icon]" class="empty-icon"></i>
    <p class="empty-message">{{ message }}</p>

    <!-- 提供一个插槽，万一以后想在下面加个"去首页"的按钮呢 -->
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
interface Props {
  icon?: string
  message?: string
}

withDefaults(defineProps<Props>(), {
  icon: 'fa-ghost',
  message: '呜呜，没有找到匹配的内容呢...',
})
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  opacity: 0.8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--accent-color);
  opacity: 0.9;
}

.empty-message {
  font-size: 1.05rem;
  color: var(--text-color);
  margin: 0;
}
</style>
