<template>
  <div class="friends-view-container">
    <h2 class="page-title">Friends</h2>
    <div class="friends-view">
      <!-- 搜索栏重新进行了封装 -->
      <FilterBar
        v-model:searchText="searchText"
        :sort-button="sortButton"
        placeholder="搜索大佬..."
      />

      <div v-if="friendStore.loading" class="loading">加载中...</div>
      <div v-else-if="friendStore.error" class="error">{{ friendStore.error }}</div>
      <div v-else>
        <!-- 列表容器 -->
        <div class="friend-grid">
          <div v-for="link in filteredItems" :key="link.id" class="friend-card glass-container">
            <a :href="link.url" target="_blank" class="friend-link">
              <LazyImage
                :src="link.avatar"
                :alt="link.name"
                className="avatar"
                :containerStyle="{ width: '100px', height: '100px', borderRadius: '50%' }"
              />
              <div class="info">
                <h3>{{ link.name }}</h3>
                <p>{{ link.desc }}</p>
                <div class="tags">
                  <span v-for="tag in link.tags" :key="tag" class="tag">
                    {{ tag }}
                  </span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>

      <!-- 分页组件以重新进行了封装 -->
      <PaginationControls v-if="pagination && pagination.totalPages > 1" :pagination="pagination" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSearchAndSort } from '@/composables/useSearchAndSort'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useFriendStore } from '@/views/stores/friendStore'
import { computed, onMounted, onErrorCaptured } from 'vue'

import PaginationControls from '@/components/common/PaginationControls.vue'
import FilterBar from '@/components/common/FilterBar.vue'

import LazyImage from '@/components/common/LazyImage.vue'

import '@/styles/pageTitle.css'

const friendStore = useFriendStore()
const friends = computed(() => friendStore.friends)
const settingsStore = useSettingsStore()

// 解构出 pagination
const { searchText, filteredItems, sortButton, pagination } = useSearchAndSort({
  items: friends,
  searchFields: (friend) => [friend.name, friend.desc],
  sortType: 'alpha',
  sortBy: (a, b) => a.name.localeCompare(b.name),

  // 这里使用了 computed，所以当 settingsStore 变化时，
  // useSearchAndSort 内部的 pageSize 也会变化，从而触发重新计算分页
  itemsPerPage: computed(() => settingsStore.pagination.itemsPerPage),
})

// 页面挂载时确保数据已加载
onMounted(async () => {
  await friendStore.fetchFriends()
})

onErrorCaptured((err, instance, info) => {
  console.error('页面 setup/onMounted 异常:', err, instance, info)
  return false
})
</script>

<style scoped>
.friend-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  max-width: 1200px;
  margin: 0 auto;
  justify-content: flex-start;
}

.friend-card {
  transition: transform 0.3s;
  padding: 1.5rem;
  width: 220px;
  min-height: 300px;
  margin: 0 auto;
  display: flex;
}

.friend-card:hover {
  transform: translateY(-5px);
}

.friend-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
  text-align: center;

  border: 2px solid var(--accent-color);
  margin-bottom: 1rem;
}

:deep(.lazy-image-container img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

:deep(.lazy-image-container:hover img) {
  transform: scale(1.1);
}

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
}

.info h3 {
  margin: 0.5rem 0;
}

.info p {
  margin: 0.5rem 0;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
  justify-content: center;
}

.tag {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.3rem 0.8rem;
  border-radius: 15px;
  font-size: 0.8em;
}

.friends-view-container {
  width: 100%;
  min-height: inherit;
}
</style>
