<!-- frontend/src/views/FriendsView.vue -->
<template>
  <div class="friends-view-container">
    <h2 class="page-title-art">Friends & Sponsors</h2>
    <div class="friends-view">
      <FilterBar
        v-model:searchText="searchText"
        :sort-button="sortButton"
        placeholder="搜索大佬或投喂留言..."
      />

      <section class="friend-content">
        <!-- 骨架屏状态 -->
        <div v-if="isLoading && mixedData.length === 0" class="skeleton-container bento-grid">
          <!-- 模拟渲染几个大卡片和小碎块的骨架，保持和真实数据一样的瀑布流排布感 -->
          
          <!-- 大卡片骨架 1 -->
          <div class="bento-item friend-card glass-content" style="pointer-events: none;">
            <SkeletonBlock width="40%" height="100%" radius="0" />
            <div class="friend-info" style="flex: 1; padding: 1.2rem; display: flex; flex-direction: column; gap: 0.8rem;">
              <SkeletonBlock width="60%" height="1.5rem" />
              <SkeletonBlock width="90%" height="1rem" />
              <SkeletonBlock width="70%" height="1rem" />
              <div class="tags" style="margin-top: auto; display: flex; gap: 0.5rem;">
                <SkeletonBlock width="40px" height="24px" radius="12px" />
                <SkeletonBlock width="50px" height="24px" radius="12px" />
              </div>
            </div>
          </div>

          <!-- 小碎块骨架 1 -->
          <div class="bento-item sponsor-shard glass-content" style="pointer-events: none;">
            <SkeletonBlock width="60px" height="100%" radius="0" />
            <div class="shard-content" style="flex: 1; padding: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem;">
              <div class="shard-header" style="display: flex; justify-content: space-between;">
                <SkeletonBlock width="40%" height="1.2rem" />
                <SkeletonBlock width="30%" height="1rem" />
              </div>
              <SkeletonBlock width="80%" height="1rem" />
            </div>
          </div>

          <!-- 大卡片骨架 2 (反向) -->
          <div class="bento-item friend-card glass-content reverse-layout" style="pointer-events: none;">
            <div class="friend-info" style="flex: 1; padding: 1.2rem; display: flex; flex-direction: column; gap: 0.8rem;">
              <SkeletonBlock width="50%" height="1.5rem" />
              <SkeletonBlock width="95%" height="1rem" />
              <SkeletonBlock width="60%" height="1rem" />
              <div class="tags" style="margin-top: auto; display: flex; gap: 0.5rem;">
                <SkeletonBlock width="45px" height="24px" radius="12px" />
              </div>
            </div>
            <SkeletonBlock width="40%" height="100%" radius="0" />
          </div>

          <!-- 小碎块骨架 2 -->
          <div class="bento-item sponsor-shard glass-content reverse-layout" style="pointer-events: none;">
            <div class="shard-content" style="flex: 1; padding: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem;">
              <div class="shard-header" style="display: flex; justify-content: space-between;">
                <SkeletonBlock width="50%" height="1.2rem" />
                <SkeletonBlock width="25%" height="1rem" />
              </div>
              <SkeletonBlock width="70%" height="1rem" />
            </div>
            <SkeletonBlock width="60px" height="100%" radius="0" />
          </div>
          
          <!-- 小碎块骨架 3 -->
          <div class="bento-item sponsor-shard glass-content" style="pointer-events: none;">
            <SkeletonBlock width="60px" height="100%" radius="0" />
            <div class="shard-content" style="flex: 1; padding: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem;">
              <div class="shard-header" style="display: flex; justify-content: space-between;">
                <SkeletonBlock width="35%" height="1.2rem" />
                <SkeletonBlock width="35%" height="1rem" />
              </div>
              <SkeletonBlock width="90%" height="1rem" />
            </div>
          </div>
        </div>

        <div v-else-if="hasError" class="error-message glass-container">数据加载失败了 QAQ</div>

        <div v-else>
          <!-- 核心：便当盒瀑布流网格 -->
          <div v-if="filteredItems.length > 0" class="bento-grid">
            <template v-for="item in filteredItems" :key="item.uniqueId">
              <!-- 大玻璃板：友链卡片 -->
              <a
                v-if="item.type === 'friend'"
                :href="item.data.url ?? undefined"
                target="_blank"
                class="bento-item friend-card glass-content"
                :class="{ 'reverse-layout': item.isReversed }"
              >
                <div class="friend-avatar-wrapper">
                  <LazyImage
                    :src="item.data.avatar ?? ''"
                    :alt="item.data.name"
                    className="avatar"
                    :containerStyle="{ width: '100%', height: '100%', borderRadius: '0' }"
                  />
                </div>
                <div class="friend-info">
                  <h3>{{ item.data.name }}</h3>
                  <p class="desc" :title="item.data.desc ?? undefined">{{ item.data.desc }}</p>
                  <div class="tags">
                    <span v-for="tag in item.data.tags" :key="tag" class="tag">
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </a>

              <!-- 迷你玻璃片：投喂碎块 -->
              <a
                v-else-if="item.type === 'sponsor'"
                :href="item.data.url || '#'"
                :target="item.data.url ? '_blank' : '_self'"
                class="bento-item sponsor-shard glass-content"
                :class="{ 'reverse-layout': item.isReversed }"
              >
                <div class="sponsor-avatar-wrapper">
                  <LazyImage
                    :src="item.data.avatar || '/favicon.png'"
                    :alt="item.data.name"
                    className="avatar"
                    :containerStyle="{ width: '100%', height: '100%', borderRadius: '0' }"
                  />
                </div>
                <div class="shard-content">
                  <div class="shard-header">
                    <span class="shard-name" :title="item.data.name">{{ item.data.name }}</span>
                    <span class="shard-date">{{ item.data.date }}</span>
                  </div>
                  <div class="shard-message" :title="item.data.message ?? undefined">
                    "{{ item.data.message || '留下了一抹星光...' }}"
                  </div>
                </div>
              </a>
            </template>
          </div>
          <EmptyState
            v-else
            icon="fa-search"
            message="在星海中找寻不到这位小伙伴的踪迹...换个关键词试试？"
          />
        </div>

        <PaginationControls
          v-if="pagination && pagination.totalPages > 1"
          :pagination="pagination"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onErrorCaptured } from 'vue'
import { useSearchAndSort } from '@/composables/useSearchAndSort'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useFriendStore } from '@/stores/friendStore'
import { useSponsorStore } from '@/stores/sponsorStore'
import type { Friend } from '@/types/friend'
import type { Sponsor } from '@/types/sponsor'

import PaginationControls from '@/components/common/PaginationControls.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import LazyImage from '@/components/common/LazyImage.vue'
import SkeletonBlock from '@/components/common/SkeletonBlock.vue'

import '@/styles/layout/correctContentMargin.css'
import '@/styles/layout/pageTitleArt.css'

const friendStore = useFriendStore()
const sponsorStore = useSponsorStore()
const settingsStore = useSettingsStore()

const isLoading = computed(() => friendStore.loading || sponsorStore.loading)
const hasError = computed(() => friendStore.error || sponsorStore.error)

/**
 * 联合数据类型定义，用于在同一网格中混合渲染友链与投喂记录。
 */
type MixedGridItem =
  | { type: 'friend'; data: Friend; uniqueId: string; isReversed: boolean }
  | { type: 'sponsor'; data: Sponsor; uniqueId: string; isReversed: boolean }

/**
 * 将友链与投喂数据混合，并生成随机排版标识。
 *
 * 策略：每次随机取 1~2 个大卡片，再随机取 1~3 个小碎块，形成更自然的错落感。
 */
const mixedData = computed<MixedGridItem[]>(() => {
  const friends = friendStore.friends || []
  const sponsors = sponsorStore.sponsors || []
  const result: MixedGridItem[] = []
  let fIdx = 0
  let sIdx = 0
  while (fIdx < friends.length || sIdx < sponsors.length) {
    // 随机插入 1~2 个友链大卡片
    const fCount = Math.floor(Math.random() * 2) + 1
    for (let i = 0; i < fCount && fIdx < friends.length; i++) {
      result.push({
        type: 'friend',
        data: friends[fIdx],
        uniqueId: `friend_${friends[fIdx].id}`,
        isReversed: Math.random() > 0.5,
      })
      fIdx++
    }
    // 随机插入 1~3 个投喂小碎块
    const sCount = Math.floor(Math.random() * 3) + 1
    for (let i = 0; i < sCount && sIdx < sponsors.length; i++) {
      result.push({
        type: 'sponsor',
        data: sponsors[sIdx],
        uniqueId: `sponsor_${sponsors[sIdx].id}`,
        isReversed: Math.random() > 0.5, // 投喂碎块也增加随机左右标识！
      })
      sIdx++
    }
  }
  return result
})

// 统一的搜索与分页逻辑
const { searchText, filteredItems, sortButton, pagination } = useSearchAndSort({
  items: mixedData,
  searchFields: (item) => {
    if (item.type === 'friend') {
      return [item.data.name, item.data.desc ?? '', ...(item.data.tags || [])]
    } else {
      return [item.data.name, item.data.message || '']
    }
  },
  sortType: 'alpha',
  // 强制返回 0，禁止默认的字母排序打乱前面的洗牌顺序
  sortBy: () => 0,
  itemsPerPage: computed(() => settingsStore.pagination.friends),
})

onMounted(async () => {
  await Promise.all([friendStore.fetchFriends(), sponsorStore.fetchSponsors()])
})

onErrorCaptured((err, instance, info) => {
  console.error('页面 setup/onMounted 异常:', err, instance, info)
  return false
})
</script>

<style scoped>
/* ==========================================================================
   1. 布局容器基础
   ========================================================================== */

.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  grid-auto-rows: 85px;
  grid-auto-flow: dense;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem 0;
}

/* ==========================================================================
   2. 便当盒通用项
   ========================================================================== */

.bento-item {
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
  border-radius: 6px;
  border: 1px solid rgba(var(--accent-color-rgb), 0.15);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.5),
    inset 0 0 20px rgba(var(--accent-color-rgb), 0.02);

  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bento-item::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(135deg, rgba(var(--accent-color-rgb), 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.3s;
  z-index: 0;
}

.bento-item:hover {
  transform: translateY(-4px);
  border-color: rgba(var(--accent-color-rgb), 0.4);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.6),
    0 8px 20px rgba(0, 0, 0, 0.05),
    0 0 30px rgba(var(--accent-color-rgb), 0.1);
  z-index: 2;
}

.bento-item:hover::after {
  opacity: 1;
}

.bento-item > * {
  position: relative;
  z-index: 1;
}

/* ==========================================================================
   3. 友链大卡片
   ========================================================================== */

.friend-card {
  grid-column: span 2;
  grid-row: span 2;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 0;
}

.friend-card.reverse-layout {
  flex-direction: row-reverse;
}

.friend-avatar-wrapper {
  flex: 0 0 35%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* 用半透明遮罩让图片和右侧内容平滑过渡 */
.friend-avatar-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    transparent 80%,
    var(--light-content-bg, rgba(255, 255, 255, 0.05)) 100%
  );
  pointer-events: none;
}
.friend-card.reverse-layout .friend-avatar-wrapper::after {
  background: linear-gradient(
    to left,
    transparent 80%,
    var(--light-content-bg, rgba(255, 255, 255, 0.05)) 100%
  );
}

.friend-card:hover :deep(.lazy-image-container img) {
  transform: scale(1.08) rotate(2deg);
}

:deep(.lazy-image-container img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.friend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  padding: 1.5rem;
  position: relative;
}

.friend-info::before {
  content: '';
  position: absolute;
  top: 1.5rem;
  bottom: 1.5rem;
  left: 0;
  width: 3px;
  background: var(--accent-color);
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(var(--accent-color-rgb), 0.4);
}
.friend-card.reverse-layout .friend-info::before {
  left: auto;
  right: 0;
}

.friend-info h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-color);
  padding-left: 0.8rem;
}
.friend-card.reverse-layout .friend-info h3 {
  padding-left: 0;
  padding-right: 0.8rem;
}

.friend-info .desc {
  margin: 0.8rem 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-color);
  opacity: 0.8;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  height: 24px;
  overflow: hidden;
}

.tag {
  background: rgba(var(--accent-color-rgb), 0.1);
  color: var(--accent-color);
  padding: 0.2rem 0.6rem;
  border-radius: 6px; /* 扁平风圆角 */
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid rgba(var(--accent-color-rgb), 0.15);
}

/* ==========================================================================
   4. 投喂小碎块
   ========================================================================== */

.sponsor-shard {
  grid-column: span 1;
  grid-row: span 1;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 0;
}

.sponsor-shard.reverse-layout {
  flex-direction: row-reverse;
}

.sponsor-avatar-wrapper {
  flex: 0 0 85px;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.sponsor-shard:hover :deep(.lazy-image-container img) {
  transform: scale(1.15) rotate(-4deg);
}

.shard-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.5rem 1rem;
}

.shard-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.shard-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--accent-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shard-date {
  font-size: 0.7rem;
  font-family: 'JetBrainsMono', monospace;
  opacity: 0.5;
  white-space: nowrap;
  flex-shrink: 0;
}

.shard-message {
  font-size: 0.8rem;
  font-style: italic;
  line-height: 1.4;
  opacity: 0.85;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ==========================================================================
   5. 暗色模式适配
   ========================================================================== */

.dark-theme .bento-item {
  background-color: var(--dark-content-bg, rgba(0, 0, 0, 0.2));
  border-color: rgba(var(--dark-accent-color-rgb), 0.2);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 0 20px rgba(var(--dark-accent-color-rgb), 0.05);
}
.dark-theme .bento-item::after {
  background: linear-gradient(
    135deg,
    rgba(var(--dark-accent-color-rgb), 0.15) 0%,
    transparent 100%
  );
}
.dark-theme .bento-item:hover {
  border-color: rgba(var(--dark-accent-color-rgb), 0.5);
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.15),
    0 8px 20px rgba(0, 0, 0, 0.2),
    0 0 30px rgba(var(--dark-accent-color-rgb), 0.15);
}
.dark-theme .friend-info::before {
  background: var(--dark-accent-color);
  box-shadow: 0 0 8px rgba(var(--dark-accent-color-rgb), 0.4);
}
.dark-theme .tag {
  background: rgba(var(--dark-accent-color-rgb), 0.15);
  color: var(--dark-accent-color);
  border-color: rgba(var(--dark-accent-color-rgb), 0.2);
}
.dark-theme .shard-name {
  color: var(--dark-accent-color);
}
.dark-theme .friend-avatar-wrapper::after {
  background: linear-gradient(
    to right,
    transparent 80%,
    var(--dark-content-bg, rgba(0, 0, 0, 0.2)) 100%
  );
}
.dark-theme .friend-card.reverse-layout .friend-avatar-wrapper::after {
  background: linear-gradient(
    to left,
    transparent 80%,
    var(--dark-content-bg, rgba(0, 0, 0, 0.2)) 100%
  );
}

/* ==========================================================================
   6. 响应式布局
   ========================================================================== */

@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: auto;
    gap: 1rem;
  }
  .bento-item {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
    height: auto;
  }
  .friend-card,
  .friend-card.reverse-layout {
    flex-direction: column !important;
  }
  .friend-avatar-wrapper {
    flex: none;
    width: 100%;
    height: 160px;
  }
  /* 移动端图片遮罩改为从下往上 */
  .friend-avatar-wrapper::after,
  .friend-card.reverse-layout .friend-avatar-wrapper::after {
    background: linear-gradient(
      to bottom,
      transparent 70%,
      var(--light-content-bg, rgba(255, 255, 255, 0.05)) 100%
    );
  }
  .dark-theme .friend-avatar-wrapper::after,
  .dark-theme .friend-card.reverse-layout .friend-avatar-wrapper::after {
    background: linear-gradient(
      to bottom,
      transparent 70%,
      var(--dark-content-bg, rgba(0, 0, 0, 0.2)) 100%
    );
  }
  .friend-info {
    padding: 1.2rem;
  }
  .friend-info::before,
  .friend-card.reverse-layout .friend-info::before {
    top: 0;
    left: 1.5rem;
    bottom: auto;
    width: 30px;
    height: 3px;
  }
  .friend-info h3,
  .friend-card.reverse-layout .friend-info h3 {
    padding-left: 0;
    padding-right: 0;
    margin-top: 0.5rem;
  }
}
</style>
