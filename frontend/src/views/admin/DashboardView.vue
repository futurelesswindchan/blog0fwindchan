<!-- src\views\admin\DashboardView.vue -->
<template>
  <div class="dashboard-container">
    <h2 class="page-title-art">Dashboard</h2>

    <!-- Tab 切换栏 -->
    <div class="tabs-header">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: currentTab === tab.key }"
        @click="currentTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 动态操作按钮：根据当前 Tab 变化 -->
    <div class="action-area" @click="handleCreate">
      <i class="fas" :class="createButtonIcon"></i>
      <span>&ensp;{{ createButtonText }}</span>
    </div>

    <div class="dashboard-content">
      <!-- 1. 文章列表 -->
      <div v-if="currentTab === 'articles'" class="tab-content">
        <FilterBar v-model:searchText="articleSearchText" placeholder="搜索文章标题或分类..." />
        <div class="list-wrapper">
          <div v-if="articleStore.isLoading" class="loading">加载中...</div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th class="col-title">标题</th>
                <th class="col-category">分类</th>
                <th class="col-date">日期</th>
                <th class="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="article in paginatedArticles" :key="article.id">
                <td class="col-title" :title="article.title">{{ article.title }}</td>
                <td class="col-category">
                  <span class="badge">{{ article.category }}</span>
                </td>
                <td class="col-date">{{ formatDate(article.date) }}</td>
                <td class="action-cell col-action">
                  <button @click="editArticle(article)" class="icon-btn edit">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button @click="deleteArticle(article)" class="icon-btn del">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <PaginationControls :pagination="articlePagination" />
      </div>

      <!-- 2. 友链列表 -->
      <div v-else-if="currentTab === 'friends'" class="tab-content">
        <FilterBar
          v-model:searchText="friendSearchText"
          placeholder="搜索友链名称、链接或描述..."
        />
        <div class="list-wrapper">
          <div v-if="friendStore.loading" class="loading">加载中...</div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th class="col-name">名称</th>
                <th class="col-url">链接</th>
                <th class="col-desc">描述</th>
                <th class="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="friend in paginatedFriends" :key="friend.id">
                <td class="col-name">
                  <div class="flex-center">
                    <img :src="friend.avatar || '/favicon.png'" class="mini-avatar" />
                    <span class="text-truncate">{{ friend.name }}</span>
                  </div>
                </td>
                <td class="col-url url-col" :title="friend.url">{{ friend.url }}</td>
                <td class="col-desc" :title="friend.desc">{{ friend.desc }}</td>
                <td class="action-cell col-action">
                  <button @click="modalStore.openFriendModal(friend)" class="icon-btn edit">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button @click="deleteFriend(friend.id)" class="icon-btn del">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <PaginationControls :pagination="friendPagination" />
      </div>

      <!-- 3. 画廊列表 -->
      <div v-else-if="currentTab === 'gallery'" class="tab-content">
        <FilterBar v-model:searchText="gallerySearchText" placeholder="搜索作品标题或描述..." />
        <div class="list-wrapper">
          <div v-if="artworkStore.loading" class="loading">加载中...</div>
          <div v-else class="gallery-grid">
            <div v-for="work in paginatedGallery" :key="work.id" class="gallery-item">
              <img :src="work.thumbnail" loading="lazy" />
              <div class="gallery-info">
                <h4>{{ work.title }}</h4>
                <div class="gallery-actions">
                  <button @click="modalStore.openArtworkModal(work)" class="icon-btn edit">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button @click="deleteArtwork(work.id)" class="icon-btn del">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <PaginationControls :pagination="galleryPagination" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useArticleStore, type ArticleSummary } from '@/views/stores/articleStore'
import { useArtworkStore } from '@/views/stores/artworkStore'
import { useFriendStore } from '@/views/stores/friendStore'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useArticleContent } from '@/composables/useArticleContent'
import { useToast } from '@/composables/useToast'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import PaginationControls from '@/components/common/PaginationControls.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import api from '@/api'

import '@/styles/pageTitleArt.css'

type ArticleWithCategory = ArticleSummary & { category: string }

const router = useRouter()
const { formatDate } = useArticleContent()
const { notify, confirm } = useToast()

// Stores
const articleStore = useArticleStore()
const friendStore = useFriendStore()
const artworkStore = useArtworkStore()
const modalStore = useGlobalModalStore()
const settingsStore = useSettingsStore() // 初始化

// Tabs 配置
const tabs = [
  { key: 'articles', label: '文章管理' },
  { key: 'friends', label: '友链管理' },
  { key: 'gallery', label: '画廊管理' },
] as const
const currentTab = ref<(typeof tabs)[number]['key']>('articles')

// --- 数据加载 ---
onMounted(() => {
  refreshAllData()
})

const refreshAllData = () => {
  articleStore.fetchArticleIndex()
  friendStore.fetchFriends()
  artworkStore.fetchArtworks()
}

// --- 顶部按钮逻辑 ---
const createButtonText = computed(() => {
  switch (currentTab.value) {
    case 'friends':
      return '有新朋友'
    case 'gallery':
      return '上传作品'
    default:
      return '写新文章'
  }
})
const createButtonIcon = computed(() => {
  return currentTab.value === 'gallery' ? 'fa-image' : 'fa-pencil-alt'
})

const handleCreate = () => {
  if (currentTab.value === 'articles') {
    router.push({ name: 'EditorCreate' })
  } else if (currentTab.value === 'friends') {
    modalStore.openFriendModal(null)
  } else {
    modalStore.openArtworkModal(null)
  }
}

// =========================================
// 搜索与分页逻辑
// =========================================

// --- 1. 文章搜索与分页 ---
const articleSearchText = ref('')
const articlePage = ref(1)
// 使用后台专属配置
const articlePageSize = computed(() => settingsStore.pagination.adminArticles)

const allArticles = computed<ArticleWithCategory[]>(() => {
  return Object.entries(articleStore.articles).flatMap(([category, articles]) =>
    articles.map((article) => ({ ...article, category })),
  )
})

const filteredArticles = computed(() => {
  const text = articleSearchText.value.toLowerCase()
  if (!text) return allArticles.value
  return allArticles.value.filter(
    (article) =>
      article.title.toLowerCase().includes(text) || article.category.toLowerCase().includes(text),
  )
})

const paginatedArticles = computed(() => {
  const start = (articlePage.value - 1) * articlePageSize.value
  const end = start + articlePageSize.value
  return filteredArticles.value.slice(start, end)
})

const articlePagination = computed(() => ({
  currentPage: articlePage.value,
  totalPages: Math.ceil(filteredArticles.value.length / articlePageSize.value) || 1,
  prevPage: () => {
    if (articlePage.value > 1) articlePage.value--
  },
  nextPage: () => {
    if (articlePage.value < articlePagination.value.totalPages) articlePage.value++
  },
}))

// 监听搜索或分页大小变化，重置页码
watch([articleSearchText, articlePageSize], () => {
  articlePage.value = 1
})

// --- 2. 友链搜索与分页 ---
const friendSearchText = ref('')
const friendPage = ref(1)
// 使用后台专属配置
const friendPageSize = computed(() => settingsStore.pagination.adminFriends)

const filteredFriends = computed(() => {
  const text = friendSearchText.value.toLowerCase()
  if (!text) return friendStore.friends
  return friendStore.friends.filter(
    (friend) =>
      friend.name.toLowerCase().includes(text) ||
      friend.url?.toLowerCase().includes(text) ||
      friend.desc?.toLowerCase().includes(text),
  )
})

const paginatedFriends = computed(() => {
  const start = (friendPage.value - 1) * friendPageSize.value
  const end = start + friendPageSize.value
  return filteredFriends.value.slice(start, end)
})

const friendPagination = computed(() => ({
  currentPage: friendPage.value,
  totalPages: Math.ceil(filteredFriends.value.length / friendPageSize.value) || 1,
  prevPage: () => {
    if (friendPage.value > 1) friendPage.value--
  },
  nextPage: () => {
    if (friendPage.value < friendPagination.value.totalPages) friendPage.value++
  },
}))

watch([friendSearchText, friendPageSize], () => {
  friendPage.value = 1
})

// --- 3. 画廊搜索与分页 ---
const gallerySearchText = ref('')
const galleryPage = ref(1)
// 使用后台专属配置
const galleryPageSize = computed(() => settingsStore.pagination.adminGallery)

const filteredGallery = computed(() => {
  const text = gallerySearchText.value.toLowerCase()
  if (!text) return artworkStore.artworks
  return artworkStore.artworks.filter(
    (work) =>
      work.title?.toLowerCase().includes(text) || work.description?.toLowerCase().includes(text),
  )
})

const paginatedGallery = computed(() => {
  const start = (galleryPage.value - 1) * galleryPageSize.value
  const end = start + galleryPageSize.value
  return filteredGallery.value.slice(start, end)
})

const galleryPagination = computed(() => ({
  currentPage: galleryPage.value,
  totalPages: Math.ceil(filteredGallery.value.length / galleryPageSize.value) || 1,
  prevPage: () => {
    if (galleryPage.value > 1) galleryPage.value--
  },
  nextPage: () => {
    if (galleryPage.value < galleryPagination.value.totalPages) galleryPage.value++
  },
}))

watch([gallerySearchText, galleryPageSize], () => {
  galleryPage.value = 1
})

// =========================================
// CRUD 操作逻辑
// =========================================

const notifyDeleteSuccess = () => {
  notify({
    type: 'success',
    title: '删除成功了哦！OvO',
    message: `如果列表中显示依然存在，请尝试刷新页面的啦-v-`,
  })
}

// --- 文章操作 ---
const editArticle = (article: ArticleWithCategory) => {
  router.push({ name: 'EditorEdit', params: { category: article.category, slug: article.id } })
}

const deleteArticle = async (article: ArticleWithCategory) => {
  const isConfirmed = await confirm(
    '确定删除吗OAO？将会永久消失哦（真的很久！）',
    `${article.title}`,
  )

  if (isConfirmed) {
    await api.delete(`/articles/${article.id}`)
    await articleStore.fetchArticleIndex()
    notifyDeleteSuccess()
  }
}

// --- 友链操作 ---
const deleteFriend = async (id: string) => {
  const isConfirmed = await confirm('将会永久消失！（真的很久！）', '确定删除该友链吗OAO？')

  if (isConfirmed) {
    await friendStore.deleteFriend(id)
    await friendStore.fetchFriends()
    notifyDeleteSuccess()
  }
}

// --- 画廊操作 ---
const deleteArtwork = async (id: string) => {
  const isConfirmed = await confirm('将会永久消失！（真的很久！）', '确定删除该作品吗OAO？')

  if (isConfirmed) {
    await artworkStore.deleteArtwork(id)
    await artworkStore.fetchArtworks()
    notifyDeleteSuccess()
  }
}
</script>

<style scoped>
/* =========================================
   1. 基础布局容器
   ========================================= */
.dashboard-container {
  width: 100%;
  min-height: inherit;
}

.dashboard-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem;
  position: relative;
}

/* =========================================
   2. 顶部操作区
   ========================================= */

.action-area {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50px;
  cursor: pointer;
  transition: all 0.3s var(--aero-animation);
  padding: 0 1rem;
  text-decoration: none;
  color: black;
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.dark-theme .action-area {
  color: white;
  border-left-color: rgba(255, 255, 255, 0.05);
  background-color: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.05);
}

.action-area:hover {
  background-color: rgb(0, 119, 255);
  color: white;
}

.action-area:hover i {
  transform: translateX(3px);
  color: white;
}

.action-area i {
  font-size: 1.1em;
  transition: transform 0.3s var(--aero-animation);
  color: var(--accent-color);
  margin-right: 4px;
}

/* =========================================
   3. 标签页切换
   ========================================= */
.tabs-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.35);
  overflow: hidden;
  min-height: 50px;
}

.dark-theme .tabs-header {
  background-color: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.05);
}

.tab-btn {
  flex: 1;
  position: relative;
  border: none;
  background: transparent;
  padding: 1rem 0;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-color-secondary);
  transition: color 0.3s ease;
  z-index: 1;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.tab-btn:last-child {
  border-right: none;
}

.tab-btn:hover {
  color: var(--accent-color);
  background-color: rgba(0, 119, 255, 0.1);
}

.dark-theme .tab-btn:hover {
  background-color: rgba(0, 102, 219, 0.1);
}

.tab-btn.active {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.tab-btn::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgb(0, 119, 255);
  z-index: -1;
  opacity: 0;
  transform: skewX(-20deg) translateX(-20%);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 120%;
  margin-left: -10%;
}

.dark-theme .tab-btn::before {
  background: rgb(0, 102, 219);
}

.tab-btn.active::before {
  opacity: 1;
  transform: skewX(-20deg) translateX(0);
}

@media (max-width: 768px) {
  .tab-btn {
    padding: 0.8rem 0;
    font-size: 0.9rem;
  }
}

/* =========================================
   4. 列表容器
   ========================================= */
.list-wrapper {
  margin: 0;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.75);
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(10px);
}

.dark-theme .list-wrapper {
  background-color: rgba(0, 0, 0, 0.6);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

/* =========================================
   5. 表格样式
   ========================================= */
.data-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  color: inherit;
  table-layout: fixed; /* 强制列宽控制，便于省略号显示 */
}

.data-table th,
.data-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  vertical-align: middle;
  /* 默认不换行，溢出隐藏，显示省略号 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark-theme .data-table th,
.dark-theme .data-table td {
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.data-table th {
  font-weight: 600;
  color: var(--accent-color);
  background: rgba(0, 119, 255, 0.08);
  border-bottom: 2px solid rgba(0, 119, 255, 0.2);
}

.dark-theme .data-table th {
  background: rgba(0, 119, 255, 0.15);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.data-table tr {
  transition: background-color 0.2s ease;
}

.data-table tr:hover {
  background: rgba(0, 119, 255, 0.05);
}

.dark-theme .data-table tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

/* =========================================
   6. 列宽控制与文本截断 (移动端适配核心)
   ========================================= */

/* 桌面端默认宽度分配 */
.col-title {
  width: 40%;
}
.col-category {
  width: 15%;
}
.col-date {
  width: 20%;
}
.col-action {
  width: 15%;
  min-width: 100px;
  text-align: right;
}

.col-name {
  width: 25%;
}
.col-url {
  width: 35%;
}
.col-desc {
  width: 25%;
}

/* 文本截断辅助类 */
.text-truncate {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 徽章 */
.badge {
  background: rgba(0, 119, 255, 0.1);
  color: #0077ff;
  border: 1px solid rgba(0, 119, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
  display: inline-block;
}

.dark-theme .badge {
  color: #a0c8ff;
  background: rgba(0, 119, 255, 0.2);
  border-color: rgba(0, 119, 255, 0.3);
}

/* 友链头像与布局 */
.flex-center {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 500;
}

.mini-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0; /* 防止头像被挤压 */
}

.url-col {
  color: #888;
  font-size: 0.9em;
  font-family: monospace;
}

.dark-theme .url-col {
  color: #aaa;
}

/* =========================================
   7. 操作按钮
   ========================================= */
.action-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end; /* 按钮靠右 */
  overflow: visible; /* 允许按钮阴影溢出 */
}

.icon-btn {
  background: rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: var(--text-color-secondary);
  width: 34px;
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  flex-shrink: 0;
}

.dark-theme .icon-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #b0b0b0;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  border-color: rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark-theme .icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.icon-btn.edit:hover {
  color: #43e97b;
  border-color: rgba(67, 233, 123, 0.3);
  background: rgba(67, 233, 123, 0.1);
}

.icon-btn.del:hover {
  color: #ff6b6b;
  border-color: rgba(255, 107, 107, 0.3);
  background: rgba(255, 107, 107, 0.1);
}

/* =========================================
   8. 画廊网格
   ========================================= */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.5rem;
  padding: 0.5rem;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #eee;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.dark-theme .gallery-item {
  background: #2a2a2a;
  border-color: rgba(255, 255, 255, 0.05);
}

.gallery-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.gallery-item:hover img {
  transform: translateY(-8px);
}

.gallery-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  color: white;
  padding: 0.8rem;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0 0 12px 12px;
}

/* 移动端或悬停时显示信息 */
.gallery-item:hover .gallery-info {
  transform: translateY(0);
}

.gallery-info h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}

.gallery-actions {
  display: flex;
  gap: 0.5rem;
}

.gallery-actions .icon-btn {
  width: 28px;
  height: 28px;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ddd;
}

.gallery-actions .icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

/* =========================================
   9. 加载状态
   ========================================= */
.loading {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
  font-style: italic;
}

/* =========================================
   10. 响应式适配 (移动端核心优化)
   ========================================= */
@media (max-width: 768px) {
  .dashboard-content {
    padding: 0.5rem;
    margin: 1rem auto;
  }

  .list-wrapper {
    padding: 0.5rem;
  }

  /* 移动端表格列宽调整 */
  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }

  /* 隐藏次要列以节省空间 */
  .col-date {
    display: none;
  }

  /* 调整剩余列宽 */
  .col-title {
    width: 50%;
  }
  .col-category {
    width: 25%;
  }
  .col-action {
    width: 25%;
  }

  .col-name {
    width: 30%;
  }
  .col-url {
    width: 40%;
  }
  .col-desc {
    display: none;
  } /* 移动端隐藏描述列 */

  /* 徽章缩小 */
  .badge {
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
  }

  .tab-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  /* 画廊双列布局 */
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
  }

  /* 移动端画廊信息常驻显示，防止无法操作 */
  .gallery-info {
    transform: translateY(0);
    padding: 0.5rem;
  }

  .gallery-info h4 {
    font-size: 0.8rem;
  }
}
</style>
