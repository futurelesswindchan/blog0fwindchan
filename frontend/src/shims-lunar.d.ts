/**
 * lunar-javascript 模块类型声明（该库无自带 .d.ts）。
 * 仅声明本项目实际使用的 API 子集。
 */
declare module 'lunar-javascript' {
  /** 公历日期对象 */
  export class Solar {
    /** 从原生 Date 构造 */
    static fromDate(date: Date): Solar
    /** 从年月日构造 */
    static fromYmd(year: number, month: number, day: number): Solar
    /** 获取对应的农历对象 */
    getLunar(): Lunar
    /** 公历年 */
    getYear(): number
    /** 公历月 (1-12) */
    getMonth(): number
    /** 公历日 (1-31) */
    getDay(): number
  }

  /** 农历日期对象 */
  export class Lunar {
    /** 从农历年月日构造 */
    static fromYmd(year: number, month: number, day: number): Lunar
    /** 农历年 */
    getYear(): number
    /** 农历月 (1-12，闰月为负数) */
    getMonth(): number
    /** 农历日 (1-30) */
    getDay(): number
    /** 获取当前日期所在农历月的天数 */
    getMonthDayCount(): number
    /** 获取当天所处节气名称，无则返回空字符串 */
    getJieQi(): string
  }
}
