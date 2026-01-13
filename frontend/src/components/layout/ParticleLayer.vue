<template>
  <div class="particle-layer" :style="{ opacity: layerOpacity }">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  isDarkTheme: boolean
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const layerOpacity = ref(0) // 用于切换主题时的淡入淡出过渡

let ctx: CanvasRenderingContext2D | null = null
let animationFrameId: number | null = null
let particles: Particle[] = []
let canvasWidth = 0
let canvasHeight = 0

// --- 1. 粒子类定义 ---

interface Particle {
  x: number
  y: number
  vx: number // 水平速度
  vy: number // 垂直速度
  size: number
  color: string

  // 棱镜特有属性
  rotation: number
  rotationSpeed: number

  // 星尘特有属性
  alpha: number // 当前透明度
  targetAlpha: number // 目标透明度（用于闪烁）
  pulseSpeed: number // 闪烁速度
}

// --- 2. 核心工具函数 ---

// 获取 CSS 变量颜色
const getThemeColors = () => {
  const styles = getComputedStyle(document.documentElement)

  // 读取 reflection-1 到 reflection-7
  const colors: string[] = []
  for (let i = 1; i <= 7; i++) {
    const color = styles.getPropertyValue(`--reflection-${i}`).trim()
    if (color) colors.push(color)
  }

  // 如果读取失败（比如变量未定义），提供兜底颜色
  if (colors.length === 0) {
    return props.isDarkTheme
      ? ['rgba(155, 200, 230, 0.5)', 'rgba(255, 255, 255, 0.5)']
      : ['rgba(255, 100, 100, 0.3)', 'rgba(100, 200, 255, 0.3)']
  }
  return colors
}

// 生成随机数
const random = (min: number, max: number) => Math.random() * (max - min) + min

// --- 3. 初始化粒子 ---

const initParticles = () => {
  particles = []
  const colors = getThemeColors()

  // 粒子数量：根据屏幕面积计算，避免在大屏太稀疏或小屏太密集
  // 基准：1080p -> 亮色60个，暗色100个
  const area = canvasWidth * canvasHeight
  const count = props.isDarkTheme
    ? Math.floor(area / 20000) // 星尘多一点
    : Math.floor(area / 35000) // 棱镜少一点，避免杂乱

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)]

    particles.push({
      x: random(0, canvasWidth),
      y: random(0, canvasHeight),
      vx: props.isDarkTheme ? random(-0.2, 0.2) : random(-0.5, 0.5), // 暗色更慢
      vy: props.isDarkTheme ? random(-0.2, 0.2) : random(-0.5, 0.5),
      size: props.isDarkTheme ? random(0.5, 2.5) : random(3, 8), // 星尘小，棱镜大
      color: color,
      rotation: random(0, 360),
      rotationSpeed: random(-1, 1),
      alpha: random(0.1, 0.8),
      targetAlpha: random(0.1, 0.8),
      pulseSpeed: random(0.005, 0.02),
    })
  }
}

// --- 4. 渲染逻辑 ---

// 绘制棱镜 (三角形)
const drawPrism = (p: Particle) => {
  if (!ctx) return
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate((p.rotation * Math.PI) / 180)
  ctx.beginPath()
  // 绘制等边三角形
  const r = p.size
  ctx.moveTo(0, -r)
  ctx.lineTo(r * 0.866, r * 0.5)
  ctx.lineTo(-r * 0.866, r * 0.5)
  ctx.closePath()

  ctx.fillStyle = p.color
  ctx.fill()

  // 添加一点边框让它更像玻璃
  // ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  // ctx.lineWidth = 0.5
  // ctx.stroke()

  ctx.restore()
}

// 绘制星尘 (圆形 + 闪烁)
const drawStardust = (p: Particle) => {
  if (!ctx) return
  ctx.beginPath()
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)

  // 处理颜色透明度，模拟闪烁
  // 这里我们需要解析 rgba 字符串来修改透明度，或者简单地使用 globalAlpha
  ctx.save()
  ctx.globalAlpha = p.alpha
  ctx.fillStyle = p.color
  ctx.fill()

  // 核心发光点
  if (p.size > 1.5) {
    ctx.globalAlpha = p.alpha * 0.5
    ctx.shadowBlur = 10
    ctx.shadowColor = p.color
    ctx.fill()
  }

  ctx.restore()
}

const update = () => {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  particles.forEach((p) => {
    // 1. 移动
    p.x += p.vx
    p.y += p.vy

    // 2. 边界检查 (无缝循环)
    if (p.x < -20) p.x = canvasWidth + 20
    if (p.x > canvasWidth + 20) p.x = -20
    if (p.y < -20) p.y = canvasHeight + 20
    if (p.y > canvasHeight + 20) p.y = -20

    // 3. 特殊属性更新
    if (props.isDarkTheme) {
      // 星尘：闪烁逻辑
      if (Math.abs(p.alpha - p.targetAlpha) < 0.01) {
        p.targetAlpha = random(0.1, 0.8) // 随机下一个目标透明度
      }

      const diff = p.targetAlpha - p.alpha
      p.alpha += diff * p.pulseSpeed

      drawStardust(p)
    } else {
      // 棱镜：旋转逻辑
      p.rotation += p.rotationSpeed
      drawPrism(p)
    }
  })

  animationFrameId = requestAnimationFrame(update)
}

// --- 5. 生命周期管理 ---

const initCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  canvasWidth = window.innerWidth
  canvasHeight = window.innerHeight
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  ctx = canvas.getContext('2d')

  initParticles()

  // 淡入
  setTimeout(() => {
    layerOpacity.value = 1
  }, 100)

  update()
}

const handleResize = () => {
  if (!canvasRef.value) return
  canvasWidth = window.innerWidth
  canvasHeight = window.innerHeight
  canvasRef.value.width = canvasWidth
  canvasRef.value.height = canvasHeight

  // 重新生成粒子以适应新尺寸
  initParticles()
}

// 监听主题变化
watch(
  () => props.isDarkTheme,
  () => {
    // 1. 淡出当前层
    layerOpacity.value = 0

    // 2. 等待淡出动画完成后，切换粒子数据，再淡入
    setTimeout(() => {
      initParticles() // 重新读取 CSS 变量并生成新粒子
      layerOpacity.value = 1
    }, 500) // 对应 CSS transition 时间
  },
)

onMounted(() => {
  initCanvas()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.particle-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0; /* 确保在 MainLayout 中位于正确层级 */
  pointer-events: none;
  transition: opacity 0.5s ease-in-out; /* 主题切换时的柔和过渡 */
}
</style>
