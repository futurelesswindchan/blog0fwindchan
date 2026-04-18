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
        <div v-if="isLoading" class="loading">加载星海中...</div>
        <div v-else-if="hasError" class="error">数据加载失败了 QAQ</div>

        <div v-else>
          <!-- 核心：便当盒瀑布流网格 -->
          <div v-if="filteredItems.length > 0" class="bento-grid">
            <template v-for="item in filteredItems" :key="item.uniqueId">
              <!-- 大玻璃板：友链卡片 -->
              <a
                v-if="item.type === 'friend'"
                :href="item.data.url"
                target="_blank"
                class="bento-item friend-card glass-container"
                :class="{ 'reverse-layout': item.isReversed }"
              >
                <div class="friend-avatar-wrapper">
                  <LazyImage
                    :src="item.data.avatar"
                    :alt="item.data.name"
                    className="avatar"
                    :containerStyle="{ width: '100%', height: '100%', borderRadius: '0' }"
                  />
                </div>
                <div class="friend-info">
                  <h3>{{ item.data.name }}</h3>
                  <p class="desc" :title="item.data.desc">{{ item.data.desc }}</p>
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
                class="bento-item sponsor-shard glass-container"
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
                  <div class="shard-message" :title="item.data.message">
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
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { Friend, useFriendStore } from '@/views/stores/friendStore'
import { Sponsor, useSponsorStore } from '@/views/stores/sponsorStore'

import PaginationControls from '@/components/common/PaginationControls.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import LazyImage from '@/components/common/LazyImage.vue'

import '@/styles/correctContentMargin.css'
import '@/styles/pageTitleArt.css'

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
      return [item.data.name, item.data.desc, ...(item.data.tags || [])]
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

/*
 * 核心便当盒网格 (Bento Grid)
 * grid-auto-rows: 80px 是实现“两个小碎块=一个大卡片”的关键基准属性。
 * grid-auto-flow: dense 确保浏览器会尝试寻找最小的空隙填补 Sponsor Shard。
 */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  grid-auto-rows: 80px;
  grid-auto-flow: dense;
  gap: 1.5rem;
  max-width: 1300px;
  margin: 0 auto;
  padding: 1.5rem 0;
}

/* ==========================================================================
   2. 便当盒通用项 (Bento Item)
   ========================================================================== */

.bento-item {
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  position: relative;
  transition:
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease !important;
}

.bento-item:hover {
  transform: translateY(-4px) scale(1.01) !important;
  z-index: 2; /* 悬浮时确保阴影不被遮挡 */
}

/* ==========================================================================
   3. 友链大卡片 (Friend Card) - 跨 2 行 2 列
   ========================================================================== */

.friend-card {
  grid-column: span 2;
  grid-row: span 2; /* 占据两行高度 (80*2 + gap) */
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 0;
}

.friend-card.reverse-layout {
  flex-direction: row-reverse;
}

/*
 * 头像容器：完全占满一侧空间。
 * 通过 border-left/right 为侧边添加垂直厚度边框。
 */
.friend-avatar-wrapper {
  flex: 0 0 span 2;
  height: 100%;
  overflow: hidden;
  position: relative;
  border-left: 5px solid var(--accent-color, #0077ff); /* 左侧厚边框 */
}

/* 布局翻转时，厚边框自动切换到右侧 */
.friend-card.reverse-layout .friend-avatar-wrapper {
  border-left: none;
  border-right: 5px solid var(--accent-color, #0077ff);
}

.friend-card:hover :deep(.lazy-image-container img) {
  transform: scale(1.08) rotate(2deg);
}

.dark-theme .friend-avatar-wrapper {
  border-color: #55aaff; /* 暗色模式下稍微提亮边框色 */
}

:deep(.lazy-image-container img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s ease;
}

/*
 * 信息区：保留内边距以保证文本呼吸感。
 */
.friend-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
  padding: 1.2rem; /* 内部 Padding */
}

.friend-info h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--accent-color, #0077ff);
}

.friend-info .desc {
  margin: 0.5rem 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--light-text);
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: 0.9;
}

.dark-theme .friend-info .desc {
  color: var(--dark-text);
}

.tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  height: 22px;
  overflow: hidden;
}

.tag {
  background: rgba(0, 119, 255, 0.08);
  color: #0077ff;
  padding: 0.1rem 0.6rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid rgba(0, 119, 255, 0.1);
}

/* ==========================================================================
   4. 投喂小碎块 (Sponsor Shard) - 跨 1 行 1 列
   ========================================================================== */

.sponsor-shard {
  grid-column: span 1;
  grid-row: span 1; /* 仅占一行 (80px) */
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 0;
  background: rgba(255, 255, 255, 0.05);
}

/* 随机翻转布局：头像去右边 */
.sponsor-shard.reverse-layout {
  flex-direction: row-reverse;
}

/* 小碎块头像容器：正方形，不加厚边框 */
.sponsor-avatar-wrapper {
  flex: 0 0 80px; /* 高度是80px，所以宽度也给80px变成正方形 */
  height: 100%;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.sponsor-shard:hover :deep(.lazy-image-container img) {
  transform: scale(1.15) rotate(-2deg);
}

/* 小碎块信息区 */
.shard-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.5rem 0.8rem; /* 单独给文字区加内边距 */
}

.shard-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
}

.shard-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--light-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark-theme .shard-name {
  color: var(--dark-text);
}

.shard-date {
  font-size: 0.65rem;
  font-family: 'JetBrainsMono', monospace; /* 日期用等宽字体更有极客感 */
  color: var(--light-text);
  opacity: 0.5;
  white-space: nowrap;
  flex-shrink: 0;
}

.dark-theme .shard-date {
  color: var(--dark-text);
}

.shard-message {
  font-size: 0.75rem;
  font-style: italic;
  line-height: 1.4;
  color: var(--light-text);
  opacity: 0.75;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dark-theme .shard-message {
  color: var(--dark-text);
  opacity: 0.65;
}

/* ==========================================================================
   5. 响应式布局 (Mobile Adaptation)
   ========================================================================== */

@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: 1fr;
    grid-auto-rows: auto; /* 移动端回归自动高度 */
    gap: 1rem;
  }

  .bento-item {
    grid-column: span 1 !important;
    grid-row: span 1 !important;
    height: auto;
  }

  .friend-card {
    flex-direction: column !important;
  }

  .friend-avatar-wrapper {
    flex: none;
    width: 100%;
    height: 140px;
    border-left: none !important;
    border-right: none !important;
    border-bottom: 4px solid var(--accent-color); /* 移动端边框改到底部 */
  }

  .sponsor-shard {
    padding: 1rem;
  }
}
</style>
