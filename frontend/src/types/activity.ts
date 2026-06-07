/**
 * 每日贡献度数据接口（对应后端 Contribution.to_dict）。
 */
export interface ContributionDay {
  date: string
  count: number
}

/**
 * 计划项数据接口（对应后端 Plan.to_dict）。
 */
export interface PlanItem {
  id: number
  content: string
  status: 'todo' | 'doing' | 'done'
  update_date: string
  sort_order: number
}
