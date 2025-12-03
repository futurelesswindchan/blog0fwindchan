import { ref, computed, unref, type ComputedRef, type Ref } from 'vue'
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

export function useSearchAndSort<T>(options: {
  items: T[] | Ref<T[]> | ComputedRef<T[]>
  searchFields: (item: T) => string[]
  sortType: SortType
  sortBy: (a: T, b: T) => number
}) {
  const searchText = ref('')
  const sortOrder = ref<SortOrder>('desc')

  // 搜索过滤和排序
  const filteredItems = computed(() => {
    const items = unref(options.items) // 兼容响应式和普通数组
    if (!items?.length) return []

    let result = [...items]

    // 搜索过滤
    if (searchText.value) {
      const searchLower = searchText.value.toLowerCase()
      result = result.filter((item) =>
        options.searchFields(item).some((field) => field.toLowerCase().includes(searchLower)),
      )
    }

    // 排序
    result.sort((a, b) => {
      const modifier = sortOrder.value === 'asc' ? 1 : -1
      return modifier * options.sortBy(a, b)
    })

    return result
  })

  // 获取排序按钮配置
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

  return {
    searchText,
    filteredItems,
    sortButton,
  }
}
