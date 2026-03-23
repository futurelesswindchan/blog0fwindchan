<template>
  <div class="plan-board">
    <h3 class="box-title"><i class="fas fa-list-check"></i> 近期计划</h3>

    <div v-if="activityStore.isLoadingPlans" class="loading-state">
      <i class="fas fa-circle-notch fa-spin"></i> 读取计划中...
    </div>

    <ul v-else class="plan-list">
      <li
        v-for="plan in activityStore.plans"
        :key="plan.id"
        class="plan-item"
        :class="`status-${plan.status}`"
      >
        <div class="status-indicator">
          <i v-if="plan.status === 'done'" class="fas fa-check-circle text-green"
            ><span>&nbsp;已完成</span></i
          >
          <i v-else-if="plan.status === 'doing'" class="fa-solid fa-arrow-right text-orange"
            ><span>&nbsp;在进行</span></i
          >
          <i v-else class="fas fa-thumbtack todo-icon"><span>&nbsp;待办中</span></i>
        </div>

        <div class="plan-content">
          <span class="text">{{ plan.content }}</span>
          <span class="date">{{ plan.update_date }}</span>
        </div>
      </li>
      <li v-if="activityStore.plans.length === 0" class="empty-state">目前没有计划呢 awa</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useActivityStore } from '@/views/stores/activityStore'

const activityStore = useActivityStore()

onMounted(() => {
  activityStore.fetchPlans()
})
</script>

<style scoped>
.box-title {
  font-size: 1.2rem;
}

.plan-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.plan-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.3s;
}

.plan-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

@keyframes breathe {
  from {
    opacity: 0.4;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1.2);
  }
}

.status-done .text {
  text-decoration: line-through;
  opacity: 0.5;
}

.plan-content {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.text {
  font-size: 1rem;
  line-height: 1.4;
}

.date {
  font-size: 0.75rem;
  color: #888;
}

.loading-state,
.empty-state {
  text-align: center;
  color: #888;
  padding: 2rem 0;
}
</style>
