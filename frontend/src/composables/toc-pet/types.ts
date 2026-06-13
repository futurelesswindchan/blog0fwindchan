// frontend/src/composables/toc-pet/types.ts

/**
 * 宠物情绪枚举类型
 * @typedef {'typing' | 'reading' | 'sleepy' | 'dizzy' | 'shocked'} PetMood
 */
export type PetMood = 'typing' | 'reading' | 'sleepy' | 'dizzy' | 'shocked'

/**
 * 逃跑算法常量配置模型
 */
export interface EscapeConfigType {
  ALERT_RADIUS: number
  ESCAPE_DISTANCE_MIN: number
  ESCAPE_DISTANCE_MAX: number
  COOLDOWN_MS: number
  PET_WIDTH: number
  PET_HEIGHT: number
  BOUNDARY_PADDING: number
}

/** 逃跑算法常量配置 */
export const ESCAPE_CONFIG: EscapeConfigType = {
  ALERT_RADIUS: 30, // 警戒距离 (px)，鼠标距矩形边缘此距离内触发逃跑
  ESCAPE_DISTANCE_MIN: 50, // 最小逃跑距离 (px)
  ESCAPE_DISTANCE_MAX: 300, // 最大逃跑距离 (px)
  COOLDOWN_MS: 280, // 冷却时间 (ms)，防止高频 mousemove 抽搐
  PET_WIDTH: 400, // 宠物组件宽度 (px)，用于坐标换算
  PET_HEIGHT: 60, // 宠物组件头部高度 (px)，用于坐标换算
  BOUNDARY_PADDING: 20, // 边界安全边距 (px)
}
