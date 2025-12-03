<template>
  <div class="friends-view-container">
    <section class="friends-view">
      <h2 class="page-title">Friends</h2>

      <div class="filter-bar glass-container">
        <input
          v-model="searchText"
          type="text"
          placeholder="搜索大佬们...awa"
          class="search-input"
        />
        <button class="sort-button" @click="sortButton.toggle">
          <i :class="['fas', sortButton.icon]"></i>
          {{ sortButton.label }}
        </button>
      </div>

      <div v-if="friendStore.loading" class="loading">加载中...</div>
      <div v-else-if="friendStore.error" class="error">{{ friendStore.error }}</div>
      <div v-else>
        <div class="friend-grid">
          <div v-for="link in filteredLinks" :key="link.id" class="friend-card glass-container">
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onErrorCaptured } from 'vue'
import LazyImage from '@/components/common/LazyImage.vue'
import { useFriendStore } from '@/views/stores/friendStore'
import { useSearchAndSort } from '@/composables/useSearchAndSort'
import '@/styles/searchBar.css'

const friendStore = useFriendStore()
const friends = computed(() => friendStore.friends)

const {
  searchText,
  filteredItems: filteredLinks,
  sortButton,
} = useSearchAndSort({
  items: friends, // 传 computed，保证响应式和类型安全
  searchFields: (friend) => [friend.name, friend.desc],
  sortType: 'alpha',
  sortBy: (a, b) => a.name.localeCompare(b.name),
})

// 页面挂载时确保数据已加载
onMounted(async () => {
  await friendStore.fetchFriends()
})

onErrorCaptured((err, instance, info) => {
  console.error('页面 setup/onMounted 异常:', err, info)
  return false
})
</script>

<style scoped>
/* ...原有样式不变... */
.page-title {
  text-align: center;
  color: var(--accent-color);
  margin-bottom: 2rem;
  background-color: rgba(255, 255, 255, 0.1);
  line-height: 175%;
  font-family: 'FleurDeLeah', sans-serif;
  font-size: 3.5rem;
  letter-spacing: 5px;
}

.dark-theme .page-title {
  background-color: rgba(0, 0, 0, 0.1);
}

.filter-bar {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 2rem;
}

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
  width: 100%;
  height: 100%;
}

.avatar {
  display: block;
  width: 100%;
  height: 100%;
}

:deep(.lazy-image-container) {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
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
