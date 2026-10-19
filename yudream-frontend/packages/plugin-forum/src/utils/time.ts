/**
 * Flarum humanTime 蒸馏：30 天内显示相对时间（x 分钟前），跨月显示日期，
 * 跨年补年份。timestamp 为毫秒；空值返回空串。
 */
export function humanTime(timestamp?: string | number): string {
  if (timestamp === undefined || timestamp === null || timestamp === '') return ''
  const value = Number(timestamp)
  if (!Number.isFinite(value) || value <= 0) return ''
  const date = new Date(value)
  const now = new Date()
  if (date.getTime() > now.getTime()) return '刚刚'
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diffSeconds < 60) return '刚刚'
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} 小时前`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays <= 30) return `${diffDays} 天前`
  const sameYear = date.getFullYear() === now.getFullYear()
  const pad = (n: number) => String(n).padStart(2, '0')
  const monthDay = `${date.getMonth() + 1} 月 ${date.getDate()} 日`
  return sameYear ? monthDay : `${date.getFullYear()} 年 ${monthDay}`
}

/** 详情页楼层时间：相对时间 + 具体时刻悬浮提示由调用方 title 承载。 */
export function fullTime(timestamp?: string | number): string {
  if (timestamp === undefined || timestamp === null || timestamp === '') return ''
  const value = Number(timestamp)
  if (!Number.isFinite(value) || value <= 0) return ''
  const date = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
