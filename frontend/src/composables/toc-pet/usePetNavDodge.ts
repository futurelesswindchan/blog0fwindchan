// frontend/src/composables/toc-pet/usePetNavDodge.ts
import { ref, watch } from 'vue'

// 全局导航躲避偏移量 (暴露出供其他组件修改)
export const globalNavOffset = ref<number>(0)

/**
 * 屏幕底栏 Toast 与全局导航防遮挡探测器。
 *
 * 通过持续监听 `globalNavOffset` 值，同步向组件反馈垂直增肌的位移补偿量（`dodgeOffset`），
 * 使小精灵能在系统出现吐司消息或全局浮动操作栏时，聪明地往上蹦开躲避掩盖。
 *
 * @returns { dodgeOffset } 躲闪物理反馈的纵向 Y 轴推力距离
 */
export function usePetNavDodge() {
  // 直接返回全局偏移量的引用，当前无需二次加工
  return {
    dodgeOffset: globalNavOffset,
  }
}
