// frontend/src/composables/toc-pet/usePetEscape.ts
import { ref, type Ref } from 'vue'
import type { PetMood } from './types'
import { ESCAPE_CONFIG } from './types'

/**
 * 宠物受惊逃跑算法核心。
 *
 * 负责宠物进入 `shocked` 状态后的物理弹射、沿墙滑行、死角量子隧穿传送，
 * 以及结合原生 DOM 事件实现鼠标探测追踪。
 *
 * @param currentMood 宠物当前情绪状态引用
 * @param setMood 修改情绪的受控方法
 * @param isExpanded 目录展开状态引用（受惊时强制折叠）
 * @param setUrgentMsg 写入紧急通道的方法
 * @param getRandomMessage 抽取常规受惊文案的工厂方法
 * @param getRandomCornerEscapeMessage 抽取死角瞬移特有文案的工厂方法
 * @returns 包含位置追踪坐标、触发受惊拦截方法以及清除事件的钩子集合
 */
export function usePetEscape(
  currentMood: Ref<PetMood>,
  setMood: (mood: PetMood) => void,
  isExpanded: Ref<boolean>,
  setUrgentMsg: (msg: string) => void,
  getRandomMessage: () => string,
  getRandomCornerEscapeMessage: () => string,
) {
  const shockPosition = ref<{ right: number; bottom: number } | null>(null)
  let isEscapeCooldown = false
  let shockMouseHandler: ((e: MouseEvent) => void) | null = null

  /**
   * 将 right/bottom 定位坐标转换为屏幕坐标系（左上角为原点）。
   *
   * @param right CSS right 值
   * @param bottom CSS bottom 值
   * @returns 屏幕坐标 {x, y}（所算为宠物组件中心点）
   */
  const toScreenCoords = (right: number, bottom: number) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    return {
      x: vw - right - ESCAPE_CONFIG.PET_WIDTH / 2,
      y: vh - bottom - ESCAPE_CONFIG.PET_HEIGHT / 2,
    }
  }

  /**
   * 将屏幕坐标转换回 right/bottom 定位坐标。
   *
   * @param x 屏幕 X 坐标（组件中心点）
   * @param y 屏幕 Y 坐标（组件中心点）
   * @returns 供 CSS 定位的响应式位置数据
   */
  const toPositionCoords = (x: number, y: number) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    return {
      right: vw - x - ESCAPE_CONFIG.PET_WIDTH / 2,
      bottom: vh - y - ESCAPE_CONFIG.PET_HEIGHT / 2,
    }
  }

  /**
   * 核心逃跑算法：根据鼠标的压迫位置进行矢量弹射。
   *
   * @param mouseX 鼠标当前驻留屏幕 X 坐标
   * @param mouseY 鼠标当前驻留屏幕 Y 坐标
   */
  const executeEscape = (mouseX: number, mouseY: number) => {
    if (!shockPosition.value) return

    const petScreen = toScreenCoords(shockPosition.value.right, shockPosition.value.bottom)
    const dx = mouseX - petScreen.x
    const dy = mouseY - petScreen.y
    const angle = Math.atan2(dy, dx)

    const escapeDist =
      ESCAPE_CONFIG.ESCAPE_DISTANCE_MIN +
      Math.random() * (ESCAPE_CONFIG.ESCAPE_DISTANCE_MAX - ESCAPE_CONFIG.ESCAPE_DISTANCE_MIN)

    let newX = petScreen.x + -Math.cos(angle) * escapeDist
    let newY = petScreen.y + -Math.sin(angle) * escapeDist

    const pad = ESCAPE_CONFIG.BOUNDARY_PADDING
    const minX = pad + ESCAPE_CONFIG.PET_WIDTH / 2
    const maxX = window.innerWidth - pad - ESCAPE_CONFIG.PET_WIDTH / 2
    const minY = pad + ESCAPE_CONFIG.PET_HEIGHT / 2
    const maxY = window.innerHeight - pad - ESCAPE_CONFIG.PET_HEIGHT / 2

    const hitLeft = newX < minX
    const hitRight = newX > maxX
    const hitTop = newY < minY
    const hitBottom = newY > maxY

    newX = Math.max(minX, Math.min(maxX, newX))
    newY = Math.max(minY, Math.min(maxY, newY))

    // 死角检测 & 传送
    if ((hitLeft || hitRight) && (hitTop || hitBottom)) {
      newX = hitLeft ? maxX - Math.random() * 100 : minX + Math.random() * 100
      newY = hitTop ? maxY - Math.random() * 80 : minY + Math.random() * 80
      setUrgentMsg(getRandomCornerEscapeMessage())
    } else {
      setUrgentMsg(getRandomMessage())
    }

    const newPos = toPositionCoords(newX, newY)
    shockPosition.value = {
      right: Math.round(newPos.right),
      bottom: Math.round(newPos.bottom),
    }
  }

  const distToRectEdge = (px: number, py: number, cx: number, cy: number, halfW: number, halfH: number): number => {
    const dx = Math.abs(px - cx)
    const dy = Math.abs(py - cy)
    const overX = Math.max(0, dx - halfW)
    const overY = Math.max(0, dy - halfH)
    return Math.sqrt(overX * overX + overY * overY)
  }

  const handleShockMouseMove = (e: MouseEvent) => {
    if (isEscapeCooldown || !shockPosition.value) return

    const petScreen = toScreenCoords(shockPosition.value.right, shockPosition.value.bottom)
    const distance = distToRectEdge(
      e.clientX,
      e.clientY,
      petScreen.x,
      petScreen.y,
      ESCAPE_CONFIG.PET_WIDTH / 2,
      ESCAPE_CONFIG.PET_HEIGHT / 2,
    )

    if (distance < ESCAPE_CONFIG.ALERT_RADIUS) {
      executeEscape(e.clientX, e.clientY)
      isEscapeCooldown = true
      setTimeout(() => {
        isEscapeCooldown = false
      }, ESCAPE_CONFIG.COOLDOWN_MS)
    }
  }

  /**
   * 触发受惊状态（不可逆）
   * @description 进入 shocked 后永不自动恢复，仅组件销毁重载后重置。
   *              这是一个彩蛋玩法——用户需要刷新页面才能"安抚"宠物。
   */
  const triggerShock = (event?: MouseEvent) => {
    if (currentMood.value === 'shocked') return
    setMood('shocked')
    setUrgentMsg(getRandomMessage())
    isExpanded.value = false // 受惊时强制收起目录

    if (!shockPosition.value) {
      shockPosition.value = { right: 20, bottom: 20 }
    }

    if (event) {
      executeEscape(event.clientX, event.clientY)
    } else {
      executeEscape(window.innerWidth / 2, window.innerHeight / 2)
    }

    shockMouseHandler = handleShockMouseMove
    document.addEventListener('mousemove', shockMouseHandler, { passive: true })
  }

  const stopEscapeListener = () => {
    if (shockMouseHandler) {
      document.removeEventListener('mousemove', shockMouseHandler)
      shockMouseHandler = null
    }
  }

  return {
    shockPosition,
    triggerShock,
    stopEscapeListener,
  }
}
