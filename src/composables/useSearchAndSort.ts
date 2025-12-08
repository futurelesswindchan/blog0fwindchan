import { ref, computed, unref, type ComputedRef, type Ref, watch } from 'vue'
import type { SortOrder, SortType } from '@/types/sort'

// 默认排序按钮配置
const defaultSortButtons = {
  alpha: {
    type: 'alpha',
    icon: {
      asc: 'fa-sort-alpha-down',
      desc: 'fa-sort-alpha-up',
    },
    label: {
      asc: '按名称正序',
      desc: '按名称倒序',
    },
  },
  date: {
    type: 'date',
    icon: {
      asc: 'fa-sort-numeric-down',
      desc: 'fa-sort-numeric-up',
    },
    label: {
      asc: '最早发布',
      desc: '最新发布',
    },
  },
} as const

// 搜索和排序组合函数（升级版）
export function useSearchAndSort<T>(options: {
  items: T[] | Ref<T[]> | ComputedRef<T[]>
  searchFields: (item: T) => string[]
  sortType: SortType
  sortBy: (a: T, b: T) => number
  itemsPerPage?: number // ✨ 新增：每页显示数量
}) {
  const { itemsPerPage = 6 } = options // 默认每页6项

  const searchText = ref('')
  const sortOrder = ref<SortOrder>('desc')
  const currentPage = ref(1) // ✨ 新增：当前页码

  // 计算经过搜索和排序后的【完整】列表
  const sortedAndSearchedItems = computed(() => {
    const items = unref(options.items)
    if (!items?.length) return []

    let result = [...items]

    // 1. 搜索过滤
    if (searchText.value) {
      const searchLower = searchText.value.toLowerCase()
      result = result.filter((item) =>
        options.searchFields(item).some((field) => field.toLowerCase().includes(searchLower)),
      )
    }

    // 2. 排序
    result.sort((a, b) => {
      const modifier = sortOrder.value === 'asc' ? 1 : -1
      return modifier * options.sortBy(a, b)
    })

    return result
  })

  // 当搜索词或排序变化时，自动跳回第一页
  watch([searchText, sortOrder], () => {
    currentPage.value = 1
  })

  // ✨ 新增：计算总页数
  const totalPages = computed(() => {
    return Math.ceil(sortedAndSearchedItems.value.length / itemsPerPage)
  })

  // ✨ 修改：filteredItems 现在只返回【当前页】的数据
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return sortedAndSearchedItems.value.slice(start, end)
  })

  // 排序按钮的逻辑 (不变)
  const sortButton = computed(() => {
    const config = defaultSortButtons[options.sortType]
    return {
      icon: config.icon[sortOrder.value],
      label: config.label[sortOrder.value],
      toggle: () => {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      },
    }
  })

  // ✨ 新增：分页控制方法
  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  return {
    searchText,
    // ✨ 修改：返回的是 paginatedItems，但我们依然叫它 filteredItems 以保持外部 API 一致
    filteredItems: paginatedItems,
    sortButton,
    // ✨ 新增：将分页状态和方法暴露出去
    pagination: computed(() => ({
      currentPage: currentPage.value,
      totalPages: totalPages.value,
      nextPage,
      prevPage,
      goToPage,
    })),
  }
}
