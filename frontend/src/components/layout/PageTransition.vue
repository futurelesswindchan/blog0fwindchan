<!-- src/components/layout/PageTransition.vue -->
<template>
  <router-view v-slot="{ Component }">
    <template v-if="Component">
      <transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.name || route.path" />
      </transition>
    </template>

    <template v-else>
      <div style="color: red; padding: 2em; text-align: center">
        组件未找到（Component is undefined），请检查路由配置和页面组件是否正常导出。
      </div>
    </template>
  </router-view>
</template>

<script setup lang="ts">
import { useRouteTransition } from '@/composables/useRouteTransition'
import { useRoute } from 'vue-router'

const route = useRoute()
const { transitionName } = useRouteTransition()
</script>
