<!-- src/views/admin/DashboardView.vue -->
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
          <table v-else-if="paginatedArticles.length > 0" class="data-table">
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
                <td class="col-title" :title="article.title">
                  <span
                    v-if="article.collection_id"
                    style="color: var(--accent-color); margin-right: 4px"
                    title="属于连载合集"
                  >
                    <i class="fas fa-layer-group"></i> </span
                  >{{ article.title }}
                </td>

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
          <EmptyState v-else message="没有找到匹配的文章呢，要不要换个关键词试试？qwq" />
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
          <table v-else-if="paginatedFriends.length > 0" class="data-table">
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

          <EmptyState v-else message="星海茫茫，没有搜到这位小伙伴的踪迹呢 owo" />
        </div>
        <PaginationControls :pagination="friendPagination" />
      </div>

      <!-- 3. 画廊列表 -->
      <div v-else-if="currentTab === 'gallery'" class="tab-content">
        <FilterBar v-model:searchText="gallerySearchText" placeholder="搜索作品标题或描述..." />
        <div class="list-wrapper">
          <div v-if="artworkStore.loading" class="loading">加载中...</div>
          <div v-else-if="paginatedGallery.length > 0" class="gallery-grid">
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
          <EmptyState v-else message="画廊里空空的，没有找到相关作品 QAQ" />
        </div>
        <PaginationControls :pagination="galleryPagination" />
      </div>

      <!-- 4. 计划列表 -->
      <div v-else-if="currentTab === 'plans'" class="tab-content">
        <FilterBar v-model:searchText="planSearchText" placeholder="搜索计划内容..." />
        <div class="list-wrapper">
          <div v-if="activityStore.isLoadingPlans" class="loading">加载中...</div>
          <table v-else-if="paginatedPlans.length > 0" class="data-table plan-table">
            <thead>
              <tr>
                <th class="col-status">状态</th>
                <th class="col-content">计划内容</th>
                <th class="col-date">更新日期</th>
                <th class="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="plan in paginatedPlans" :key="plan.id">
                <td class="col-status">
                  <span class="badge" :class="`badge-${plan.status}`">
                    {{
                      plan.status === 'todo'
                        ? '📌 待办'
                        : plan.status === 'doing'
                          ? '🔥 进行中'
                          : '✅ 已完成'
                    }}
                  </span>
                </td>
                <td class="col-content" :title="plan.content">{{ plan.content }}</td>
                <td class="col-date">{{ plan.update_date }}</td>
                <td class="action-cell col-action">
                  <button @click="movePlanUp(plan)" class="icon-btn edit" title="上移">
                    <i class="fas fa-arrow-up"></i>
                  </button>
                  <button @click="movePlanDown(plan)" class="icon-btn edit" title="下移">
                    <i class="fas fa-arrow-down"></i>
                  </button>
                  <button @click="modalStore.openPlanModal(plan)" class="icon-btn edit">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button @click="deletePlan(plan.id)" class="icon-btn del">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else message="没有找到这个计划，是不是已经被你悄悄完成啦？-w-" />
        </div>
        <PaginationControls :pagination="planPagination" />
      </div>

      <!-- 5. 投喂列表 -->
      <div v-else-if="currentTab === 'sponsors'" class="tab-content">
        <FilterBar v-model:searchText="sponsorSearchText" placeholder="搜索投喂大佬昵称或留言..." />
        <div class="list-wrapper">
          <div v-if="sponsorStore.loading" class="loading">加载中...</div>
          <table v-else-if="paginatedSponsors.length > 0" class="data-table">
            <thead>
              <tr>
                <th class="col-name">大佬信息</th>
                <th class="col-content">留言寄语</th>
                <th class="col-date">日期</th>
                <th class="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sponsor in paginatedSponsors" :key="sponsor.id">
                <td class="col-name">
                  <div class="flex-center">
                    <img :src="sponsor.avatar || '/favicon.png'" class="mini-avatar" />
                    <span class="text-truncate" :title="sponsor.name">{{ sponsor.name }}</span>
                  </div>
                </td>
                <td class="col-content" :title="sponsor.message">
                  <span class="text-truncate">{{ sponsor.message || '（留下一抹星光...）' }}</span>
                </td>
                <td class="col-date">{{ sponsor.date }}</td>
                <td class="action-cell col-action">
                  <button @click="modalStore.openSponsorModal(sponsor)" class="icon-btn edit">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button @click="deleteSponsor(sponsor.id)" class="icon-btn del">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else message="没有找到相关的投喂记录呢，等待新的缘分吧~ awa" />
        </div>
        <PaginationControls :pagination="sponsorPagination" />
      </div>

      <!-- 6. 合集列表 -->
      <div v-else-if="currentTab === 'collections'" class="tab-content">
        <FilterBar v-model:searchText="collectionSearchText" placeholder="搜索合集名称..." />
        <div class="list-wrapper">
          <div v-if="articleStore.isLoading" class="loading">加载中...</div>
          <table v-else-if="paginatedCollections.length > 0" class="data-table">
            <thead>
              <tr>
                <th class="col-title">合集名称</th>
                <th class="col-category">归属分类</th>
                <th class="col-date">包含文章数</th>
                <th class="col-action">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="col in paginatedCollections" :key="col.id">
                <td class="col-title">📁 {{ col.name }}</td>
                <td class="col-category">
                  <span class="badge">{{ col.category }}</span>
                </td>
                <td class="col-date">{{ col.article_count }} 篇</td>
                <td class="action-cell col-action">
                  <button
                    @click="modalStore.openCollectionModal(col)"
                    class="icon-btn edit"
                    title="编辑合集"
                  >
                    <i class="fas fa-pen"></i>
                  </button>
                  <button @click="deleteCollection(col.id)" class="icon-btn del" title="解散合集">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-else message="没有找到这个合集呢，要不要新建一个？0w0" />
        </div>
        <PaginationControls :pagination="collectionPagination" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file DashboardView.vue
 * @description 后台管理核心主控台逻辑。包含文章、合集、画廊、友链、投喂、计划的增删改查与分页搜索。
 */

import { useArticleStore, type ArticleSummary } from '@/views/stores/articleStore'
import { PlanItem, useActivityStore } from '@/views/stores/activityStore'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { useArticleContent } from '@/composables/useArticleContent'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useSearchAndSort } from '@/composables/useSearchAndSort'
import { useSponsorStore } from '@/views/stores/sponsorStore'
import { useArtworkStore } from '@/views/stores/artworkStore'
import { useAllArticles } from '@/composables/useAllArticles'
import { useFriendStore } from '@/views/stores/friendStore'
import { useToast } from '@/composables/useToast'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import PaginationControls from '@/components/common/PaginationControls.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import api from '@/api'

import '@/styles/pageTitleArt.css'

/**
 * @typedef {ArticleSummary & { category: string }} ArticleWithCategory
 * @description 带有分类信息的文章摘要类型
 */
type ArticleWithCategory = ArticleSummary & { category: string }

const router = useRouter()
const { formatDate } = useArticleContent()
const { allArticles, fetchAllArticles } = useAllArticles() // 调用组件获取所有的文章数据
const { notify, confirm } = useToast()

// =========================================
// 📦 状态库 (Stores) 实例化
// =========================================
const articleStore = useArticleStore()
const friendStore = useFriendStore()
const artworkStore = useArtworkStore()
const modalStore = useGlobalModalStore()
const settingsStore = useSettingsStore()
const activityStore = useActivityStore()
const sponsorStore = useSponsorStore()

// =========================================
// 🗂️ 标签页 (Tabs) 配置
// =========================================

/**
 * @type {Array<Readonly<{key: string, label: string}>>}
 * @description 后台管理的全局标签页配置
 */
const tabs = [
  { key: 'articles', label: '文章管理' },
  { key: 'collections', label: '合集管理' },
  { key: 'gallery', label: '画廊管理' },
  { key: 'friends', label: '友链管理' },
  { key: 'sponsors', label: '投喂管理' },
  { key: 'plans', label: '计划管理' },
] as const

/**
 * @description 当前选中的标签页
 */
const currentTab = ref<(typeof tabs)[number]['key']>('articles')

// =========================================
// 📚 数据拉取逻辑 (Fetching Logic)
// =========================================

/**
 * 刷新全局文章数据
 * @async
 */
const refreshArticles = async () => {
  try {
    // 直接呼叫我们的魔法函数！它会在底层把散篇和合集都处理得服服帖帖的~
    await fetchAllArticles()

    // 成功后可以给个小提示 awa
    notify({
      type: 'success',
      title: '拉取成功✨',
      message: '遍历好全部合集啦，所有文章都抓回来咧！',
    })
  } catch (error) {
    notify({ type: 'error', title: '加载文章失败QAQ', message: `${error}` })
  }
}

/**
 * 刷新所有模块的数据
 * @returns {void}
 */
const refreshAllData = () => {
  refreshArticles()
  friendStore.fetchFriends()
  artworkStore.fetchArtworks()
  activityStore.fetchPlans()
  sponsorStore.fetchSponsors()
}

onMounted(() => {
  refreshAllData()
})

// =========================================
// 🔘 顶部操作栏逻辑 (Top Bar Actions)
// =========================================

/**
 * @description 计算当前标签页对应的新建按钮文本
 * @returns {string} 按钮显示的文本
 */
const createButtonText = computed(() => {
  switch (currentTab.value) {
    case 'friends':
      return '有新朋友'
    case 'gallery':
      return '传新作品'
    case 'collections':
      return '建新合集'
    case 'plans':
      return '定新计划'
    case 'sponsors':
      return '感谢投喂'
    default:
      return '写新文章'
  }
})

/**
 * @description 计算当前标签页对应的新建按钮图标
 * @returns {string} FontAwesome 图标类名
 */
const createButtonIcon = computed(() => {
  if (currentTab.value === 'gallery') return 'fa-image'
  if (currentTab.value === 'collections') return 'fa-folder-plus'
  if (currentTab.value === 'plans') return 'fa-list-check'
  if (currentTab.value === 'sponsors') return 'fa-gift'
  return 'fa-pencil-alt'
})

/**
 * @description 处理新建按钮点击事件，根据当前标签页打开对应的模态框或跳转页面
 * @returns {void}
 */
const handleCreate = () => {
  if (currentTab.value === 'articles') {
    router.push({ name: 'EditorCreate' })
  } else if (currentTab.value === 'friends') {
    modalStore.openFriendModal(null)
  } else if (currentTab.value === 'plans') {
    modalStore.openPlanModal(null)
  } else if (currentTab.value === 'collections') {
    modalStore.openCollectionModal(null)
  } else if (currentTab.value === 'sponsors') {
    modalStore.openSponsorModal(null)
  } else {
    modalStore.openArtworkModal(null)
  }
}

// =========================================
// 🔍 搜索与分页逻辑 (Search & Pagination)
// =========================================

// --- 1. 文章搜索与分页 ---
const {
  searchText: articleSearchText,
  filteredItems: paginatedArticles,
  pagination: articlePagination,
} = useSearchAndSort({
  items: allArticles,
  searchFields: (article) => [article.title, article.category],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
  itemsPerPage: computed(() => settingsStore.pagination.adminArticles),
})

// --- 2. 友链搜索与分页 ---
const {
  searchText: friendSearchText,
  filteredItems: paginatedFriends,
  pagination: friendPagination,
} = useSearchAndSort({
  items: computed(() => friendStore.friends),
  searchFields: (friend) => [friend.name, friend.url || '', friend.desc || ''],
  sortType: 'alpha',
  sortBy: (a, b) => a.name.localeCompare(b.name),
  itemsPerPage: computed(() => settingsStore.pagination.adminFriends),
})

// --- 3. 画廊搜索与分页 ---
const {
  searchText: gallerySearchText,
  filteredItems: paginatedGallery,
  pagination: galleryPagination,
} = useSearchAndSort({
  items: computed(() => artworkStore.artworks),
  searchFields: (work) => [work.title || '', work.description || ''],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
  itemsPerPage: computed(() => settingsStore.pagination.adminGallery),
})

// --- 4. 计划搜索与分页 ---
const {
  searchText: planSearchText,
  filteredItems: paginatedPlans,
  pagination: planPagination,
} = useSearchAndSort({
  items: computed(() => activityStore.plans),
  searchFields: (plan) => [plan.content],
  sortType: 'date',
  sortBy: (a, b) => b.sort_order - a.sort_order, // 依据排序字段
  itemsPerPage: computed(() => settingsStore.pagination.adminPlans),
})

// --- 5. 投喂搜索与分页 ---
const {
  searchText: sponsorSearchText,
  filteredItems: paginatedSponsors,
  pagination: sponsorPagination,
} = useSearchAndSort({
  items: computed(() => sponsorStore.sponsors),
  searchFields: (sp) => [sp.name, sp.message || ''],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
  itemsPerPage: computed(() => settingsStore.pagination.adminSponsors || 10),
})

// --- 6. 合集搜索与分页 ---
/**
 * @description 获取所有扁平化后的合集列表
 */
const allCollections = computed(() => {
  return Object.entries(articleStore.collections).flatMap(([category, cols]) =>
    cols.map((col) => ({ ...col, category })),
  )
})

const {
  searchText: collectionSearchText,
  filteredItems: paginatedCollections,
  pagination: collectionPagination,
} = useSearchAndSort({
  items: allCollections,
  searchFields: (col) => [col.name, col.category, col.description || ''],
  sortType: 'date',
  sortBy: (a, b) => b.article_count - a.article_count, // 按文章数量排序
  itemsPerPage: computed(() => settingsStore.pagination.adminArticles || 10),
})

// =========================================
// 🛠️ 增删改查操作逻辑 (CRUD Operations)
// =========================================

/**
 * 统一下发删除成功的通知反馈
 * @returns {void}
 */
const notifyDeleteSuccess = () => {
  notify({
    type: 'success',
    title: '删除成功了哦！OvO',
    message: `如果列表中显示依然存在，请尝试刷新页面的啦-v-`,
  })
}

/**
 * 跳转编辑文章页面
 * @param {ArticleWithCategory} article - 要编辑的文章对象
 */
const editArticle = (article: ArticleWithCategory) => {
  router.push({ name: 'EditorEdit', params: { category: article.category, slug: article.id } })
}

/**
 * 删除指定的文章
 * @async
 * @param {ArticleWithCategory} article - 要删除的文章对象
 */
const deleteArticle = async (article: ArticleWithCategory) => {
  const isConfirmed = await confirm(
    '确定删除吗OAO？将会永久消失哦（真的很久！）',
    `${article.title}`,
  )

  if (isConfirmed) {
    await api.delete(`/articles/${article.id}`)
    await refreshArticles() // 确保合集内的文章也同步被刷新
    notifyDeleteSuccess()
  }
}

/**
 * 删除指定的友链
 * @async
 * @param {string} id - 友链唯一 ID
 */
const deleteFriend = async (id: string) => {
  const isConfirmed = await confirm('将会永久消失！（真的很久！）', '确定删除该友链吗OAO？')
  if (isConfirmed) {
    await friendStore.deleteFriend(id)
    await friendStore.fetchFriends()
    notifyDeleteSuccess()
  }
}

/**
 * 删除指定的画廊作品
 * @async
 * @param {string} id - 作品唯一 ID
 */
const deleteArtwork = async (id: string) => {
  const isConfirmed = await confirm('将会永久消失！（真的很久！）', '确定删除该作品吗OAO？')
  if (isConfirmed) {
    await artworkStore.deleteArtwork(id)
    await artworkStore.fetchArtworks()
    notifyDeleteSuccess()
  }
}

/**
 * 交换两个计划的排序顺序，并持久化到后端
 * @async
 * @param {number} indexA - 计划在数组中的当前索引
 * @param {number} indexB - 计划在数组中的目标索引
 */
const swapPlanOrder = async (indexA: number, indexB: number) => {
  const plans = activityStore.plans
  // 交换数组元素
  const temp = plans[indexA]
  plans[indexA] = plans[indexB]
  plans[indexB] = temp

  // 重新生成排序 payload
  const payload = plans.map((p, index) => {
    p.sort_order = index
    return { id: p.id, sort_order: index }
  })

  try {
    await activityStore.reorderPlans(payload)
  } catch (error) {
    notify({ type: 'error', title: '排序保存失败', message: `${error}` })
    await activityStore.fetchPlans()
  }
}

/**
 * 计划上移操作
 * @async
 * @param {PlanItem} plan - 计划项对象
 */
const movePlanUp = async (plan: PlanItem) => {
  const index = activityStore.plans.findIndex((p) => p.id === plan.id)
  if (index > 0) {
    await swapPlanOrder(index, index - 1)
  } else {
    notify({ type: 'info', message: '已经是第一个啦，不能再往上咧0w0' })
  }
}

/**
 * 计划下移操作
 * @async
 * @param {PlanItem} plan - 计划项对象
 */
const movePlanDown = async (plan: PlanItem) => {
  const index = activityStore.plans.findIndex((p) => p.id === plan.id)
  if (index >= 0 && index < activityStore.plans.length - 1) {
    await swapPlanOrder(index, index + 1)
  } else {
    notify({ type: 'info', message: '已经是最后一个啦，踩到底咯qwq' })
  }
}

/**
 * 删除指定的计划项
 * @async
 * @param {number} id - 计划 ID
 */
const deletePlan = async (id: number) => {
  const isConfirmed = await confirm('将会永久消失！（真的很久！）', '确定要删除这个计划吗OAO？')
  if (isConfirmed) {
    await activityStore.deletePlan(id)
    await activityStore.fetchPlans()
    notifyDeleteSuccess()
  }
}

/**
 * 删除指定的投喂记录
 * @async
 * @param {number} id - 投喂记录 ID
 */
const deleteSponsor = async (id: number) => {
  const isConfirmed = await confirm('将会永久消失！（真的很久！）', '确定要删除这条投喂记录吗OAO？')
  if (isConfirmed) {
    await sponsorStore.deleteSponsor(id)
    await sponsorStore.fetchSponsors()
    notifyDeleteSuccess()
  }
}

/**
 * 删除指定的文章合集
 * @async
 * @param {string} id - 合集唯一 ID (slug)
 */
const deleteCollection = async (id: string) => {
  const isConfirmed = await confirm('将会永久消失！（真的很久！）', '确定要删除这个合集吗OAO？')
  if (isConfirmed) {
    await api.delete(`/admin/collections/${id}`)
    await refreshArticles() // 刷新全部文章，确保连载文章变成散篇或者被正确移除
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
  table-layout: fixed;
}

.data-table th,
.data-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  vertical-align: middle;
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
 6. 列宽控制与文本截断
 ========================================= */

/* 计划管理 */
.col-status {
  width: 110px;
  flex-shrink: 0;
}

.col-date {
  width: 130px;
  flex-shrink: 0;
}

.col-action {
  width: 180px;
  min-width: 180px;
  text-align: right;
  flex-shrink: 0;
}

/* 计划内容 */
.col-content {
  width: auto;
  white-space: normal;
  word-break: break-all;
}

/* 文章、友链等其他页面的 */
.col-title {
  width: 40%;
}

.col-category {
  width: 15%;
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
  flex-shrink: 0;
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
  gap: 6px;
  justify-content: flex-end;
  overflow: visible;
}

/* 适配移动端：在小屏幕上隐藏次要列 */
@media (max-width: 768px) {
  .col-date {
    display: none;
  }

  .col-action {
    width: 140px;
    min-width: 140px;
  }

  .col-content {
    font-size: 0.9rem;
  }
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
