import type { Parts } from './types.ts'

function addMonths(date: Date, count: number): Date {
  const next = new Date(date.getTime())
  const day = next.getDate()
  next.setDate(1)
  next.setMonth(next.getMonth() + count)
  const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(day, last))
  next.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds())
  return next
}

export function breakdown(target: Date, now: Date): Parts {
  const empty: Parts = { done: true, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  if (Number.isNaN(target.getTime()) || target.getTime() <= now.getTime()) return empty

  let months =
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  if (months < 0) months = 0
  if (months > 0 && addMonths(now, months).getTime() > target.getTime()) months -= 1

  let guard = 0
  while (guard < 2400 && addMonths(now, months + 1).getTime() <= target.getTime()) {
    months += 1
    guard += 1
  }

  let rest = target.getTime() - addMonths(now, months).getTime()
  if (rest < 0) rest = 0
  const days = Math.floor(rest / 86_400_000)
  rest -= days * 86_400_000
  const hours = Math.floor(rest / 3_600_000)
  rest -= hours * 3_600_000
  const minutes = Math.floor(rest / 60_000)
  rest -= minutes * 60_000
  const seconds = Math.floor(rest / 1000)

  return { done: false, months, days, hours, minutes, seconds }
}

export function pad(value: number): string {
  return String(Math.max(0, value)).padStart(2, '0')
}

export function formatWhen(iso: string, lang: 'ru' | 'en'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function toLocalInput(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`
}

export function waitProgress(createdAt: number, at: string, now: number): number {
  const end = new Date(at).getTime()
  if (!Number.isFinite(end)) return 0
  if (end <= now) return 1
  if (end <= createdAt) return 0
  return Math.min(1, Math.max(0, (now - createdAt) / (end - createdAt)))
}

export function splitWishes<T extends { at: string; createdAt: number }>(list: T[], now: number) {
  const upcoming = list
    .filter((item) => new Date(item.at).getTime() > now)
    .sort((a, b) => a.at.localeCompare(b.at) || a.createdAt - b.createdAt)
  const passed = list
    .filter((item) => !(new Date(item.at).getTime() > now))
    .sort((a, b) => b.at.localeCompare(a.at) || b.createdAt - a.createdAt)
  if (upcoming.length === 0) return { next: null, rest: passed }
  return { next: upcoming[0], rest: [...upcoming.slice(1), ...passed] }
}
