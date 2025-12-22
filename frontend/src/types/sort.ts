// 排序类型定义
export type SortOrder = 'asc' | 'desc'
export type SortType = 'alpha' | 'date'

export interface SortConfig {
  order: SortOrder
}

// 排序按钮配置
export interface SortButton {
  type: SortType
  icon: {
    asc: string
    desc: string
  }
  label: {
    asc: string
    desc: string
  }
}
