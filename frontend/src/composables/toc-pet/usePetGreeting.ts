// frontend/src/composables/toc-pet/usePetGreeting.ts
import { computed } from 'vue'
import { Solar, Lunar } from 'lunar-javascript'

/**
 * 节日条目定义（公历固定日期）
 */
interface SolarFestivalEntry {
  /** 月份 (1-12) */
  month: number
  /** 日期 (1-31) */
  day: number
  /** 展开状态下的标题文案 */
  expandedTitle: string
  /** hover 状态下的引导文案 */
  hoverHint: string
}

/**
 * 农历节日条目定义
 */
interface LunarFestivalEntry {
  /** 农历月份 (1-12) */
  month: number
  /** 农历日期 (1-30) */
  day: number
  /** 展开状态下的标题文案 */
  expandedTitle: string
  /** hover 状态下的引导文案 */
  hoverHint: string
}

/**
 * 节气节日条目定义（如清明）
 */
interface JieQiFestivalEntry {
  /** 节气名称 */
  name: string
  /** 展开状态下的标题文案 */
  expandedTitle: string
  /** hover 状态下的引导文案 */
  hoverHint: string
}

/**
 * 时段问候条目
 */
interface TimeSlotEntry {
  /** 小时范围起始 (含) */
  from: number
  /** 小时范围结束 (不含) */
  to: number
  /** 展开状态下的标题文案池 */
  expandedTitles: string[]
  /** hover 状态下的引导文案池 */
  hoverHints: string[]
}

/**
 * 时间感知引擎的输出结构
 */
export interface GreetingResult {
  /** 展开状态下的标题文案（替代"文章目录导航"） */
  expandedTitle: string
  /** hover 状态下的引导文案（替代"点击查看文章目录"） */
  hoverHint: string
}

// ============================================================
// 公历固定节日文案库
// ============================================================
const solarFestivals: SolarFestivalEntry[] = [
  // 元旦
  {
    month: 1,
    day: 1,
    expandedTitle: '新年快乐！新一年的阅读清单~',
    hoverHint: '新年第一篇，点开看看？',
  },
  // 情人节
  {
    month: 2,
    day: 14,
    expandedTitle: '今天空气里都是粉色的~',
    hoverHint: '情人节也不忘学习，好厉害 qwq',
  },
  // 妇女节
  {
    month: 3,
    day: 8,
    expandedTitle: '妇女节快乐！今天也要闪闪发光~',
    hoverHint: '点开目录犒劳自己一下？',
  },
  // 愚人节
  {
    month: 4,
    day: 1,
    expandedTitle: '今天说的话...都是真的哦？',
    hoverHint: '这个目录是真的，不骗你 owo',
  },
  // 劳动节
  {
    month: 5,
    day: 1,
    expandedTitle: '劳动节快乐！不过今天可以偷懒~',
    hoverHint: '放假也来看文章，真勤劳 -w-',
  },
  // 儿童节
  {
    month: 6,
    day: 1,
    expandedTitle: '六一快乐！永远保持好奇心~',
    hoverHint: '管它几岁，快乐万岁！',
  },
  // 程序员节 (1024)
  {
    month: 10,
    day: 24,
    expandedTitle: '1024 快乐！代码即信仰！',
    hoverHint: '程序员节快乐，点开奖励自己~',
  },
  // 万圣节
  {
    month: 10,
    day: 31,
    expandedTitle: 'Trick or Treat！不给目录就捣蛋~',
    hoverHint: '南瓜灯里藏着文章地图哦',
  },
  // 光棍节 / 双十一
  {
    month: 11,
    day: 11,
    expandedTitle: '今天是 1111，整整齐齐的~',
    hoverHint: '与其剁手，不如看看文章？',
  },
  // 平安夜
  {
    month: 12,
    day: 24,
    expandedTitle: '平安夜快乐~今晚有苹果吃吗？',
    hoverHint: '圣诞老人把目录塞进袜子里了~',
  },
  // 圣诞节
  {
    month: 12,
    day: 25,
    expandedTitle: 'Merry Christmas！叮叮当~',
    hoverHint: '圣诞礼物：一份精心排列的目录 awa',
  },
]

// ============================================================
// 农历节日文案库（由 lunar-javascript 动态计算公历日期）
// ============================================================
const lunarFestivals: LunarFestivalEntry[] = [
  // 除夕（腊月三十，若无三十则廿九）
  {
    month: 12,
    day: 30,
    expandedTitle: '除夕快乐！今晚有饺子吃吗~',
    hoverHint: '旧岁将尽，新年将至，看看目录跨年？',
  },
  // 春节（正月初一）
  {
    month: 1,
    day: 1,
    expandedTitle: '新春快乐！万事如意~',
    hoverHint: '过年也来看文章？给你发个红包 owo',
  },
  // 元宵节（正月十五）
  {
    month: 1,
    day: 15,
    expandedTitle: '元宵节快乐！汤圆甜不甜？',
    hoverHint: '猜个灯谜：点开目录有惊喜~',
  },
  // 端午节（五月初五）
  {
    month: 5,
    day: 5,
    expandedTitle: '端午安康！粽子咸甜都好吃~',
    hoverHint: '划龙舟之余，点开看看目录？',
  },
  // 七夕（七月初七）
  {
    month: 7,
    day: 7,
    expandedTitle: '七夕快乐！今夜星河灿烂~',
    hoverHint: '牛郎织女都在看文章呢 -w-',
  },
  // 中秋节（八月十五）
  {
    month: 8,
    day: 15,
    expandedTitle: '中秋快乐！月饼是什么馅的？',
    hoverHint: '月圆人团圆，目录也团圆~',
  },
  // 重阳节（九月初九）
  {
    month: 9,
    day: 9,
    expandedTitle: '重阳安康！登高望远好时节~',
    hoverHint: '秋高气爽，适合阅读长文章 owo',
  },
  // 腊八节（腊月初八）
  {
    month: 12,
    day: 8,
    expandedTitle: '腊八节快乐！喝碗腊八粥暖暖~',
    hoverHint: '过了腊八就是年，先看看目录？',
  },
]

// ============================================================
// 节气节日文案库
// ============================================================
const jieQiFestivals: JieQiFestivalEntry[] = [
  {
    name: '清明',
    expandedTitle: '清明时节，万物清朗~',
    hoverHint: '春光正好，适合静心阅读 qwq',
  },
]

// ============================================================
// 时段问候库
// ============================================================
const timeSlots: TimeSlotEntry[] = [
  {
    // 深夜 0:00 - 5:00
    from: 0,
    to: 5,
    expandedTitles: [
      '夜深了...目录在这里哦',
      '凌晨的文章别有风味~',
      '世界都睡了，就咱们还醒着 qwq',
    ],
    hoverHints: ['这么晚还在看？注意休息呀 qwq', '深夜阅读模式已解锁~', '星星都在陪你看文章哦'],
  },
  {
    // 早晨 5:00 - 9:00
    from: 5,
    to: 9,
    expandedTitles: ['早安！新一天的阅读清单~', '清晨的第一缕知识光芒！', '早起的鸟儿有文章看 owo'],
    hoverHints: ['早起看文章，元气满满！', '新的一天，从目录开始~', '点开看看今天读什么？'],
  },
  {
    // 上午 9:00 - 12:00
    from: 9,
    to: 12,
    expandedTitles: ['上午好！大脑正活跃~', '上午是黄金阅读时段哦~', '这个时间吸收知识最快了！'],
    hoverHints: ['精神正好，点开看看？', '上午时光，不负阅读~', '来看看文章的全貌吧 owo'],
  },
  {
    // 中午 12:00 - 14:00
    from: 12,
    to: 14,
    expandedTitles: [
      '午间休息，随便翻翻~',
      '吃饱了嘛？摸摸肚子看文章~',
      '午后的阳光适合慢慢读 -w-',
    ],
    hoverHints: [
      '午休时间也来看文章？好勤奋！',
      '消化食物的同时消化知识~',
      '困的话看看目录提提神？',
    ],
  },
  {
    // 下午 14:00 - 18:00
    from: 14,
    to: 18,
    expandedTitles: ['下午的阅读时光~', '下午茶配文章，绝佳组合！', '日落前把这篇看完吧~'],
    hoverHints: ['下午好，点开文章地图 owo', '来杯咖啡配目录？', '下午的知识补给站在这里~'],
  },
  {
    // 傍晚 18:00 - 21:00
    from: 18,
    to: 21,
    expandedTitles: ['晚上好！今天辛苦了~', '暮色中的阅读别有韵味哦', '晚间充电时间到！'],
    hoverHints: ['忙了一天还来看文章？好厉害！', '晚上放松一下，看看目录~', '点开看看睡前读什么？'],
  },
  {
    // 夜晚 21:00 - 24:00
    from: 21,
    to: 24,
    expandedTitles: [
      '夜色渐浓，适合深度阅读~',
      '安静的夜晚最适合思考了',
      '今天的最后一段阅读时光 qwq',
    ],
    hoverHints: [
      '夜深了还在学习？记得早点休息~',
      '睡前目录，助你理清思路~',
      '不要太晚哦，明天还有明天的文章 awa',
    ],
  },
]

// ============================================================
// 工具函数
// ============================================================

/**
 * 从数组中随机取一项
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * 检查今天是否命中公历固定节日
 */
function matchSolarFestival(now: Date): SolarFestivalEntry | null {
  const month = now.getMonth() + 1
  const day = now.getDate()
  return solarFestivals.find((f) => f.month === month && f.day === day) || null
}

/**
 * 检查今天是否命中农历节日。
 * 使用 lunar-javascript 将当前公历日期转换为农历，再匹配节日库。
 *
 * 特殊处理：除夕——若农历腊月无三十（小月），则腊月廿九视为除夕。
 */
function matchLunarFestival(now: Date): LunarFestivalEntry | null {
  const solar = Solar.fromDate(now)
  const lunar = solar.getLunar()
  const lunarMonth = lunar.getMonth()
  const lunarDay = lunar.getDay()

  // 除夕特殊处理：腊月的最后一天
  const chuxi = lunarFestivals.find((f) => f.month === 12 && f.day === 30)
  if (chuxi && lunarMonth === 12) {
    // 获取当年农历腊月的天数，判断今天是否为最后一天
    const daysInMonth = Lunar.fromYmd(lunar.getYear(), 12, 1).getMonthDayCount()
    if (lunarDay === daysInMonth) {
      return chuxi
    }
  }

  // 常规匹配（排除除夕的重复匹配）
  return (
    lunarFestivals.find(
      (f) => f.month === lunarMonth && f.day === lunarDay && !(f.month === 12 && f.day === 30),
    ) || null
  )
}

/**
 * 检查今天是否命中节气节日（如清明）。
 * 通过 lunar-javascript 获取当天所属节气进行判断。
 */
function matchJieQiFestival(now: Date): JieQiFestivalEntry | null {
  const solar = Solar.fromDate(now)
  const lunar = solar.getLunar()
  const jieQi = lunar.getJieQi()

  if (!jieQi) return null
  return jieQiFestivals.find((f) => f.name === jieQi) || null
}

/**
 * 根据当前小时匹配时段
 */
function matchTimeSlot(now: Date): TimeSlotEntry {
  const hour = now.getHours()
  return timeSlots.find((s) => hour >= s.from && hour < s.to) || timeSlots[0]
}

// ============================================================
// 导出组合式函数
// ============================================================

/**
 * 时间/节日感知文案引擎。
 *
 * 根据当前日期和时间，输出适合展示的问候文案。
 * 优先级：农历节日 > 节气节日 > 公历节日 > 时段问候。
 *
 * 使用 lunar-javascript 实现农历/节气的精确计算，
 * 无需手动维护每年的公历对照表。
 *
 * @returns 提供 getGreeting 方法，每次调用返回当前时间语境下的文案
 */
export function usePetGreeting() {
  /**
   * 获取当前时刻对应的问候文案。
   * 每次调用都基于实时时间判断，适合在轮播/交互时按需调用。
   */
  const getGreeting = (): GreetingResult => {
    const now = new Date()

    // 优先级 1：农历节日（传统大节，优先级最高）
    const lunarFestival = matchLunarFestival(now)
    if (lunarFestival) {
      return {
        expandedTitle: lunarFestival.expandedTitle,
        hoverHint: lunarFestival.hoverHint,
      }
    }

    // 优先级 2：节气节日（清明等）
    const jieQiFestival = matchJieQiFestival(now)
    if (jieQiFestival) {
      return {
        expandedTitle: jieQiFestival.expandedTitle,
        hoverHint: jieQiFestival.hoverHint,
      }
    }

    // 优先级 3：公历固定节日
    const solarFestival = matchSolarFestival(now)
    if (solarFestival) {
      return {
        expandedTitle: solarFestival.expandedTitle,
        hoverHint: solarFestival.hoverHint,
      }
    }

    // 优先级 4：时段问候
    const slot = matchTimeSlot(now)
    return {
      expandedTitle: pickRandom(slot.expandedTitles),
      hoverHint: pickRandom(slot.hoverHints),
    }
  }

  /**
   * 静态 computed，适合模板直接绑定（但不会跨时段自动刷新）。
   * 一般建议优先使用 getGreeting() 手动获取。
   */
  const currentGreeting = computed<GreetingResult>(() => getGreeting())

  return {
    getGreeting,
    currentGreeting,
  }
}
