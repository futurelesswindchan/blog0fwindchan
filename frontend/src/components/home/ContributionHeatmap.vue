<template>
  <div class="contribution-heatmap">
    <h3 class="box-title"><i class="fas fa-fire"></i> 过去一年博客的文章更新情况</h3>

    <!-- 外层布局：采用 flex 左右分栏，并实现自适应居中 -->
    <div class="heatmap-layout" v-if="heatmapData.length > 0">
      <!-- 左侧：星期标签栏 (固定不滚动) -->
      <div class="labels-col">
        <!-- 顶部留空，为右侧的月份标签让出高度 -->
        <div class="month-spacer"></div>
        <div class="week-labels">
          <span v-for="day in ['日', '一', '二', '三', '四', '五', '六']" :key="day">
            {{ day }}
          </span>
        </div>
      </div>

      <!-- 右侧：热力图滚动区域 (绑定 ref 用于自动定位) -->
      <div class="heatmap-scroll-wrapper" ref="scrollWrapper">
        <div class="content-col">
          <!-- 月份标签行 -->
          <div class="month-labels">
            <span
              v-for="month in monthLabels"
              :key="month.colIndex"
              class="month-label"
              :style="{ left: `calc(${month.colIndex} * (14px + 4px))` }"
            >
              {{ month.label }}
            </span>
          </div>

          <!-- 热力图格子区域 -->
          <div class="months-grid">
            <div v-for="(week, wIndex) in heatmapData" :key="wIndex" class="week-col">
              <div
                v-for="day in week"
                :key="day.date"
                class="day-cell"
                :class="getColorClass(day.count)"
                :title="`${day.date} : 提交了 ${day.count} 次文章喵~`"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, nextTick } from 'vue'
import { useActivityStore, type ContributionDay } from '@/views/stores/activityStore'

const activityStore = useActivityStore()
const scrollWrapper = ref<HTMLElement | null>(null)

/**
 * 响应式计算热力图展示所需的二维网格数据。
 *
 * @returns 包含 53 周数据的二维数组。
 */
const heatmapData = computed(() => {
  const grid: ContributionDay[][] = []
  const today = new Date()

  // 1. 确定起始日期：回退 364 天（共 365 天）
  const startDate = new Date(today.getTime() - 364 * 24 * 60 * 60 * 1000)

  // 2. 调整到起始日期所在周的周日
  startDate.setDate(startDate.getDate() - startDate.getDay())

  // 3. 构建数据映射字典，方便快速查找 Store 里的 count
  const dataMap = new Map(
    activityStore.contributions.map((item: ContributionDay) => [item.date, item.count]),
  )

  const currentDate = new Date(startDate)

  // 4. 生成 53 周的网格
  for (let w = 0; w < 53; w++) {
    const week: ContributionDay[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      week.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0,
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    grid.push(week)
  }
  return grid
})

/**
 * 计算每个月在网格中首次出现的列索引，用于渲染顶部月份标签。
 *
 * @returns 包含月份文本与对应列索引的对象数组。
 */
const monthLabels = computed(() => {
  const labels: Array<{ label: string; colIndex: number }> = []
  let lastMonth = -1

  heatmapData.value.forEach((week, index) => {
    const dateObj = new Date(week[0].date)
    const currentMonth = dateObj.getMonth()

    if (currentMonth !== lastMonth) {
      if (index > 0 || dateObj.getDate() === 1) {
        labels.push({
          label: `${currentMonth + 1}月`,
          colIndex: index,
        })
      }
      lastMonth = currentMonth
    }
  })

  return labels
})

/**
 * 根据提交次数返回对应的等级 CSS 类名。
 *
 * @param count - 当日的提交次数。
 * @returns 对应的 CSS 类名。
 */
const getColorClass = (count: number): string => {
  if (count === 0) return 'level-0'
  if (count >= 1 && count <= 2) return 'level-1'
  if (count >= 3 && count <= 4) return 'level-2'
  if (count >= 5 && count <= 6) return 'level-3'
  return 'level-4'
}

onMounted(async () => {
  await activityStore.fetchContributions()

  // 等待 DOM 渲染完成后，将滚动条自动推到最右侧，展示最新数据
  nextTick(() => {
    if (scrollWrapper.value) {
      scrollWrapper.value.scrollLeft = scrollWrapper.value.scrollWidth
    }
  })
})
</script>

<style scoped>
/* --- 确保组件本身不会撑出父容器 --- */
.contribution-heatmap {
  min-width: 0;
  width: 100%;
}

.box-title {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}

/* --- 核心布局：大屏居中，小屏限制最大宽度 --- */
.heatmap-layout {
  display: flex;
  gap: 0.5rem;
  width: max-content; /* 空间充足时，由内部撑开 */
  max-width: 100%; /* 空间不足时，最大不超过父容器 */
  margin: 0 auto; /* 居中显示 */
}

/* --- 左侧标签列 (固定) --- */
.labels-col {
  display: flex;
  flex-direction: column;
  flex-shrink: 0; /* 禁止在 flex 容器中被压缩 */
}

.month-spacer {
  height: 20px; /* 预留给月份标签的高度 */
  margin-bottom: 4px;
}

.week-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(7 * (14px + 4px) - 4px); /* 7个格子加间距的总高度 */
  font-size: 0.75rem;
  padding-right: 0.3rem;
}

/* --- 右侧滚动区域 --- */
.heatmap-scroll-wrapper {
  flex: 1; /* 占据剩余的所有空间 */
  min-width: 0; /* 防止内容撑爆 flex 容器 */
  overflow-x: auto;
  overflow-y: hidden;
}

/* 轨道与滑块 */
.heatmap-scroll-wrapper::-webkit-scrollbar {
  height: 6px;
}
.heatmap-scroll-wrapper::-webkit-scrollbar-thumb {
  background: rgba(120, 120, 120, 0.3);
  border-radius: 3px;
}

/* --- 内容列 --- */
.content-col {
  display: flex;
  flex-direction: column;
  position: relative;
  width: max-content; /* 强制内部网格保持实际宽度，触发滚动 */
}

.month-labels {
  position: relative;
  height: 20px;
  margin-bottom: 4px;
  width: 100%;
}

.month-label {
  position: absolute;
  font-size: 0.75rem;
  white-space: nowrap;
}

.months-grid {
  display: flex;
  gap: 4px;
}

.week-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  transition: all 0.2s;
  cursor: pointer;
}

.day-cell:hover {
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(64, 158, 255, 0.5);
  z-index: 10;
}

/* --- 主题自适应颜色系统 --- */
.level-0 {
  background-color: rgba(0, 0, 0, 0.15);
}
.level-1 {
  background-color: rgba(255, 179, 97, 0.3);
}
.level-2 {
  background-color: rgba(255, 179, 97, 0.5);
}
.level-3 {
  background-color: rgba(255, 179, 97, 0.7);
}
.level-4 {
  background-color: rgb(255, 179, 97, 1);
  box-shadow: 0 0 5px rgba(255, 179, 97, 0.6);
}

.dark-theme .level-0 {
  background-color: rgba(255, 255, 255, 0.15);
}
.dark-theme .level-1 {
  background-color: rgba(64, 158, 255, 0.3);
}
.dark-theme .level-2 {
  background-color: rgba(64, 158, 255, 0.5);
}
.dark-theme .level-3 {
  background-color: rgba(64, 158, 255, 0.7);
}
.dark-theme .level-4 {
  background-color: rgba(64, 158, 255, 1);
  box-shadow: 0 0 5px rgba(64, 158, 255, 0.6);
}
</style>
