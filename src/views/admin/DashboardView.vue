<template>
  <div class="dashboard-container">
    <div class="page-header">
      <div class="back-area" @click="$router.back()">
        <i class="fas fa-arrow-left"></i>
      </div>
      <h2 class="page-title">内容管理面板</h2>

      <!-- 动态操作按钮：根据当前 Tab 变化 -->
      <div class="action-area" @click="handleCreate">
        <i class="fas" :class="createButtonIcon"></i>
        <span>&ensp;{{ createButtonText }}</span>
      </div>
    </div>

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

    <div class="dashboard-content">
      <!-- 1. 文章列表 -->
      <div v-if="currentTab === 'articles'" class="tab-content">
        <FilterBar v-model:searchText="articleSearchText" placeholder="搜索文章标题或分类..." />
        <div class="list-wrapper">
          <div v-if="articleStore.isLoading" class="loading">加载中...</div>
          <table v-else class="data-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>分类</th>
                <th>日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="article in paginatedArticles" :key="article.id">
                <td>{{ article.title }}</td>
                <td>
                  <span class="badge">{{ article.category }}</span>
                </td>
                <td>{{ formatDate(article.date) }}</td>
                <td class="action-cell">
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
                <th>名称</th>
                <th>链接</th>
                <th>描述</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="friend in paginatedFriends" :key="friend.id">
                <td>
                  <div class="flex-center">
                    <img :src="friend.avatar || '/favicon.png'" class="mini-avatar" />
                    {{ friend.name }}
                  </div>
                </td>
                <td class="url-col">{{ friend.url }}</td>
                <td>{{ friend.desc }}</td>
                <td class="action-cell">
                  <button @click="openFriendModal(friend)" class="icon-btn edit">
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
              <img :src="work.thumbnail" />
              <div class="gallery-info">
                <h4>{{ work.title }}</h4>
                <div class="gallery-actions">
                  <button @click="openArtworkModal(work)" class="icon-btn edit">
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

    <!-- 弹窗组件 -->
    <FriendModal
      v-if="showFriendModal"
      :friend="editingFriend"
      @close="showFriendModal = false"
      @submit="handleFriendSubmit"
    />
    <ArtworkModal
      v-if="showArtworkModal"
      :artwork="editingArtwork"
      @close="showArtworkModal = false"
      @submit="handleArtworkSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { useArticleStore, type ArticleSummary } from '@/views/stores/articleStore'
import { useArtworkStore, type Artwork } from '@/views/stores/artworkStore'
import { useFriendStore, type Friend } from '@/views/stores/friendStore'
import { useArticleContent } from '@/composables/useArticleContent'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import PaginationControls from '@/components/common/PaginationControls.vue'
import ArtworkModal from '@/components/admin/ArtworkModal.vue'
import FriendModal from '@/components/admin/FriendModal.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import api from '@/api'

import '@/styles/pageHeader.css'

// 定义一个扩展类型，因为 computed 里给 article 加上了 category 字段
type ArticleWithCategory = ArticleSummary & { category: string }

const router = useRouter()
const { formatDate } = useArticleContent()

// Stores
const articleStore = useArticleStore()
const friendStore = useFriendStore()
const artworkStore = useArtworkStore()

// Tabs 配置
const tabs = [
  { key: 'articles', label: '文章管理' },
  { key: 'friends', label: '友链管理' },
  { key: 'gallery', label: '画廊管理' },
] as const
const currentTab = ref<(typeof tabs)[number]['key']>('articles')

// --- 数据加载 ---
onMounted(() => {
  articleStore.fetchArticleIndex()
  friendStore.fetchFriends()
  artworkStore.fetchArtworks()
})

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
    openFriendModal(null)
  } else {
    openArtworkModal(null)
  }
}

// =========================================
// 搜索与分页逻辑 (客户端实现)
// =========================================
const pageSize = 10 // 每页显示数量

// --- 1. 文章搜索与分页 ---
const articleSearchText = ref('')
const articlePage = ref(1)

// 所有文章 (带分类)
const allArticles = computed<ArticleWithCategory[]>(() => {
  return Object.entries(articleStore.articles).flatMap(([category, articles]) =>
    articles.map((article) => ({ ...article, category })),
  )
})

// 过滤后的文章
const filteredArticles = computed(() => {
  const text = articleSearchText.value.toLowerCase()
  if (!text) return allArticles.value
  return allArticles.value.filter(
    (article) =>
      article.title.toLowerCase().includes(text) || article.category.toLowerCase().includes(text),
  )
})

// 分页后的文章
const paginatedArticles = computed(() => {
  const start = (articlePage.value - 1) * pageSize
  const end = start + pageSize
  return filteredArticles.value.slice(start, end)
})

// 文章分页信息对象
const articlePagination = computed(() => ({
  currentPage: articlePage.value,
  totalPages: Math.ceil(filteredArticles.value.length / pageSize) || 1,
  prevPage: () => {
    if (articlePage.value > 1) articlePage.value--
  },
  nextPage: () => {
    if (articlePage.value < articlePagination.value.totalPages) articlePage.value++
  },
}))

// 搜索时重置页码
watch(articleSearchText, () => {
  articlePage.value = 1
})

// --- 2. 友链搜索与分页 ---
const friendSearchText = ref('')
const friendPage = ref(1)

// 过滤后的友链
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

// 分页后的友链
const paginatedFriends = computed(() => {
  const start = (friendPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredFriends.value.slice(start, end)
})

// 友链分页信息对象
const friendPagination = computed(() => ({
  currentPage: friendPage.value,
  totalPages: Math.ceil(filteredFriends.value.length / pageSize) || 1,
  prevPage: () => {
    if (friendPage.value > 1) friendPage.value--
  },
  nextPage: () => {
    if (friendPage.value < friendPagination.value.totalPages) friendPage.value++
  },
}))

// 搜索时重置页码
watch(friendSearchText, () => {
  friendPage.value = 1
})

// --- 3. 画廊搜索与分页 ---
const gallerySearchText = ref('')
const galleryPage = ref(1)

// 过滤后的画廊
const filteredGallery = computed(() => {
  const text = gallerySearchText.value.toLowerCase()
  if (!text) return artworkStore.artworks
  return artworkStore.artworks.filter(
    (work) =>
      work.title?.toLowerCase().includes(text) || work.description?.toLowerCase().includes(text),
  )
})

// 分页后的画廊
const paginatedGallery = computed(() => {
  const start = (galleryPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredGallery.value.slice(start, end)
})

// 画廊分页信息对象
const galleryPagination = computed(() => ({
  currentPage: galleryPage.value,
  totalPages: Math.ceil(filteredGallery.value.length / pageSize) || 1,
  prevPage: () => {
    if (galleryPage.value > 1) galleryPage.value--
  },
  nextPage: () => {
    if (galleryPage.value < galleryPagination.value.totalPages) galleryPage.value++
  },
}))

// 搜索时重置页码
watch(gallerySearchText, () => {
  galleryPage.value = 1
})

// =========================================
// CRUD 操作逻辑
// =========================================

// --- 文章操作 ---
// 使用 ArticleWithCategory 类型
const editArticle = (article: ArticleWithCategory) => {
  router.push({ name: 'EditorEdit', params: { category: article.category, slug: article.id } })
}

// 使用 ArticleWithCategory 类型
const deleteArticle = async (article: ArticleWithCategory) => {
  if (confirm(`确定删除文章《${article.title}》吗？`)) {
    await api.delete(`/articles/${article.id}`)
    articleStore.fetchArticleIndex() // 简单粗暴重刷
  }
}

// --- 友链操作 ---
const showFriendModal = ref(false)
const editingFriend = ref<Friend | null>(null)

const openFriendModal = (friend: Friend | null) => {
  editingFriend.value = friend
  showFriendModal.value = true
}

// 使用 Partial<Friend> 类型，因为表单提交的数据可能不包含 id
const handleFriendSubmit = async (data: Partial<Friend>) => {
  if (editingFriend.value) {
    await friendStore.updateFriend(editingFriend.value.id, data)
  } else {
    await friendStore.addFriend(data)
  }
}

const deleteFriend = async (id: string) => {
  if (confirm('确定删除该友链吗？')) {
    await friendStore.deleteFriend(id)
  }
}

// --- 画廊操作 ---
const showArtworkModal = ref(false)
const editingArtwork = ref<Artwork | null>(null)

const openArtworkModal = (work: Artwork | null) => {
  editingArtwork.value = work
  showArtworkModal.value = true
}

// 使用 Partial<Artwork> 类型
const handleArtworkSubmit = async (data: Partial<Artwork>) => {
  if (editingArtwork.value) {
    await artworkStore.updateArtwork(editingArtwork.value.id, data)
  } else {
    await artworkStore.addArtwork(data)
  }
}

const deleteArtwork = async (id: string) => {
  if (confirm('确定删除该作品吗？')) {
    await artworkStore.deleteArtwork(id)
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
  min-width: 100px; /* 稍微宽一点以容纳文字 */
  cursor: pointer;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s var(--aero-animation);
  padding: 0 1rem;
  text-decoration: none;
  color: black;
  font-weight: 500;
}

.dark-theme .action-area {
  color: white;
  border-left-color: rgba(255, 255, 255, 0.05);
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
  margin-top: 0; /* 紧贴上方或保持原有间距 */
  margin-bottom: 2rem;

  /* 复用 page-header 的容器样式 */
  background-color: rgba(255, 255, 255, 0.35);
  border-radius: 4px;
  overflow: hidden; /* 裁剪掉平行四边形溢出的棱角 */
  border: 1px solid rgba(255, 255, 255, 0.35); /* 增加微弱边框增强质感 */
}

.dark-theme .tabs-header {
  background-color: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.05);
}

.tab-btn {
  flex: 1; /* 三等分 */
  position: relative;
  border: none;
  background: transparent;
  padding: 1rem 0;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-color-secondary); /* 默认灰色 */
  transition: color 0.3s ease;

  /* 确保文字在背景之上 */
  z-index: 1;
  /* 简单的分隔线 (可选) */
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.tab-btn:last-child {
  border-right: none;
}

/* 悬停态：稍微亮一点 */
.tab-btn:hover {
  color: var(--accent-color);
  background-color: rgba(0, 119, 255, 0.1);
}

.dark-theme .tab-btn:hover {
  background-color: rgba(0, 102, 219, 0.1);
}

/* 激活态文字颜色 */
.tab-btn.active {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 平行四边形激活背景 */
.tab-btn::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgb(0, 119, 255);
  z-index: -1; /* 放在文字下面 */

  /* 初始状态：完全透明且位置偏移 */
  opacity: 0;
  transform: skewX(-20deg) translateX(-20%); /* 倾斜并偏移 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* 稍微加宽一点，防止倾斜后边缘露白 */
  width: 120%;
  margin-left: -10%;
}

.dark-theme .tab-btn::before {
  background: rgb(0, 102, 219);
}

/* 激活时显示背景 */
.tab-btn.active::before {
  opacity: 1;
  transform: skewX(-20deg) translateX(0); /* 归位 */
}

/* 修正：第一个和最后一个按钮的背景不需要倾斜外侧边缘，
   或者利用父容器的 overflow: hidden 自动裁剪。
   这里我们利用父容器裁剪，效果就像一个被切断的平行四边形，非常酷。
*/

/* 响应式微调 */
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
}

.data-table th,
.data-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  vertical-align: middle;
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
  white-space: nowrap;
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
   6. 徽章与特定列样式
   ========================================= */
/* 分类徽章 */
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
}

.url-col {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
}

/* 将 .icon-btn 样式升级为旧版的 .action-btn 块状样式 */
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
  padding: 0; /* 重置 padding */
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

/* 画廊里的按钮稍微小一点，且颜色适应深色背景 */
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
   10. 响应式适配
   ========================================= */
@media (max-width: 768px) {
  .dashboard-content {
    padding: 0.5rem;
    margin: 1rem auto;
  }

  .list-wrapper {
    padding: 0.5rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.9rem;
  }

  .badge {
    padding: 0.15rem 0.5rem;
    font-size: 0.75rem;
  }

  .tab-btn {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  .action-area {
    min-width: 60px;
    padding: 0 0.5rem;
  }
  .action-area span {
    display: none; /* 移动端隐藏文字，只留图标 */
  }
}
</style>
