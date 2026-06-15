// frontend/src/composables/toc-pet/types.ts

/**
 * 宠物情绪枚举类型
 * @typedef {'typing' | 'reading' | 'sleepy' | 'dizzy' | 'shocked'} PetMood
 */
export type PetMood = 'typing' | 'reading' | 'sleepy' | 'dizzy' | 'shocked'

/**
 * 消息通道标识枚举。
 * 仲裁器依据优先级选取当前激活通道，模板层据此分发切换动画。
 *
 * - `urgent`   紧急事件（逃跑、晕车等不可打断状态）
 * - `interact` 主动交互（hover 回应、expand 引导）
 * - `idle`     被动闲聊（情绪轮播 + 时间感知氛围）
 */
export type MessageChannel = 'urgent' | 'interact' | 'idle'

/**
 * 消息仲裁器最终输出结构。
 * 模板层根据 `channel` 选择对应 CSS 切换动画。
 */
export interface MessageOutput {
  /** 最终显示文案 */
  text: string
  /** 当前激活的通道标识 */
  channel: MessageChannel
}

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
