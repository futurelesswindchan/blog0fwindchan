// frontend\src\composables\useSearchAndSort.ts
import { ref, computed, unref, type ComputedRef, type Ref, watch } from 'vue'
import type { SortOrder, SortType } from '@/types/sort'

/**
 * 默认排序按钮配置
 * 预设了按字母（alpha）和按日期（date）两种常见排序方式的图标与文案。
 *
 * @constant
 * @type {Object}
 */
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
      asc: '从新到旧',
      desc: '从旧到新',
    },
  },
} as const

/**
 * 搜索、排序与分页组合式函数 (Composable)
 *
 * 提供了一套完整的列表数据处理方案，支持基于关键字的模糊搜索、自定义规则排序以及分页功能。
 * 当搜索词、排序方式或每页数量发生变化时，会自动重置页码至第一页。
 *
 * @template T 列表项的数据类型
 *
 * @param {Object} options - 初始化配置项
 * @param {T[] | Ref<T[]> | ComputedRef<T[]>} options.items - 原始数据源，支持静态数组或 Vue 响应式引用。
 * @param {function(T): string[]} options.searchFields - 搜索字段提取函数。接收单个数据项，返回需要参与搜索匹配的字符串数组。
 * @param {SortType} options.sortType - 排序类型 ('alpha' | 'date')，决定了返回的 sortButton 默认图标与文案。
 * @param {function(T, T): number} options.sortBy - 排序比较函数，规则同原生 `Array.prototype.sort`。
 * @param {number | Ref<number>} [options.itemsPerPage=6] - 每页显示的数据条数，支持响应式。默认为 6。
 *
 * @returns {Object} 包含搜索绑定值、处理后的数据流以及分页控制方法的集合
 * @property {Ref<string>} searchText - 用于绑定搜索输入框的响应式文本。
 * @property {ComputedRef<T[]>} filteredItems - 经过搜索、排序并进行分页截取后的当前页数据列表。
 * @property {ComputedRef<Object>} sortButton - 排序按钮状态，包含当前对应的图标 (icon)、文案 (label) 以及切换排序方向的方法 (toggle)。
 * @property {ComputedRef<Object>} pagination - 分页控制器，包含当前页码 (currentPage)、总页数 (totalPages) 以及翻页方法 (nextPage, prevPage, goToPage)。
 */
export function useSearchAndSort<T>(options: {
  items: T[] | Ref<T[]> | ComputedRef<T[]>
  searchFields: (item: T) => string[]
  sortType: SortType
  sortBy: (a: T, b: T) => number
  itemsPerPage?: number | Ref<number>
}) {
  /** @type {ComputedRef<number>} 动态计算的每页大小 */
  const pageSize = computed(() => unref(options.itemsPerPage) || 6)

  /** @type {Ref<string>} 搜索关键字 */
  const searchText = ref('')

  /** @type {Ref<SortOrder>} 当前排序方向 (asc 或 desc) */
  const sortOrder = ref<SortOrder>('desc')

  /** @type {Ref<number>} 当前所处页码，从 1 开始 */
  const currentPage = ref(1)

  /**
   * 经过搜索和排序后的【完整】列表（未分页）
   *
   * @type {ComputedRef<T[]>}
   */
  const sortedAndSearchedItems = computed(() => {
    const items = unref(options.items)
    if (!items?.length) return []

    let result = [...items]

    // 1. 搜索过滤：忽略大小写匹配 searchFields 提取出的所有字段
    if (searchText.value) {
      const searchLower = searchText.value.toLowerCase()
      result = result.filter((item) =>
        options.searchFields(item).some((field) => field.toLowerCase().includes(searchLower)),
      )
    }

    // 2. 数据排序：根据当前的 sortOrder 动态调整比较结果的正负表现
    result.sort((a, b) => {
      const modifier = sortOrder.value === 'asc' ? 1 : -1
      return modifier * options.sortBy(a, b)
    })

    return result
  })

  /**
   * 监听：当搜索词或排序方式发生变化时，自动跳回第一页，防止用户停留在空白数据页
   */
  watch([searchText, sortOrder], () => {
    currentPage.value = 1
  })

  /**
   * 监听：当每页数量发生变化时（例如用户在全局设置中修改），重置回第一页防止索引越界
   */
  watch(pageSize, () => {
    currentPage.value = 1
  })

  /**
   * 动态计算的总页数
   *
   * @type {ComputedRef<number>}
   */
  const totalPages = computed(() => {
    return Math.ceil(sortedAndSearchedItems.value.length / pageSize.value)
  })

  /**
   * 当前页需要展示的数据（经过搜索、排序、分页截取后）
   *
   * @type {ComputedRef<T[]>}
   */
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    return sortedAndSearchedItems.value.slice(start, end)
  })

  /**
   * 排序按钮 UI 状态管理器
   *
   * @type {ComputedRef<{ icon: string, label: string, toggle: Function }>}
   */
  const sortButton = computed(() => {
    const config = defaultSortButtons[options.sortType]
    return {
      icon: config.icon[sortOrder.value],
      label: config.label[sortOrder.value],
      /** 切换当前排序方向（正序/倒序） */
      toggle: () => {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
      },
    }
  })

  /**
   * 翻至下一页
   */
  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  /**
   * 翻至上一页
   */
  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  /**
   * 跳转至指定页码
   *
   * @param {number} page - 目标页码
   */
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  return {
    searchText,
    // 返回的是 paginatedItems，但暴露为 filteredItems 以保持向后兼容和外部 API 使用一致性
    filteredItems: paginatedItems,
    sortButton,
    pagination: computed(() => ({
      currentPage: currentPage.value,
      totalPages: totalPages.value,
      nextPage,
      prevPage,
      goToPage,
    })),
  }
}
