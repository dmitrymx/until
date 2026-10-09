import type { Lang } from './types.ts'

export type ZoneId = 'pt' | 'mt' | 'ct' | 'et' | 'utc' | 'uk'
export type HomeId = 'samara' | 'moscow'

export type ZoneOption = {
  id: ZoneId
  zone: string
  short: string
  ru: string
  en: string
  placeRu: string
  placeEn: string
}

export type HomeOption = {
  id: HomeId
  zone: string
  ru: string
  en: string
  hint: string
}

export const SOURCE_ZONES: ZoneOption[] = [
  { id: 'pt', zone: 'America/Los_Angeles', short: 'PT', ru: 'Тихий океан', en: 'Pacific', placeRu: 'Калифорния, Лос-Анджелес', placeEn: 'California, Los Angeles' },
  { id: 'mt', zone: 'America/Denver', short: 'MT', ru: 'Горный', en: 'Mountain', placeRu: 'Денвер, Юта', placeEn: 'Denver, Utah' },
  { id: 'ct', zone: 'America/Chicago', short: 'CT', ru: 'Центр', en: 'Central', placeRu: 'Чикаго, Техас', placeEn: 'Chicago, Texas' },
  { id: 'et', zone: 'America/New_York', short: 'ET', ru: 'Восток', en: 'Eastern', placeRu: 'Нью-Йорк, Майами', placeEn: 'New York, Miami' },
  { id: 'utc', zone: 'UTC', short: 'UTC', ru: 'Всемирное', en: 'Universal', placeRu: 'Одно время на весь мир', placeEn: 'The same moment worldwide' },
  { id: 'uk', zone: 'Europe/London', short: 'UK', ru: 'Лондон', en: 'London', placeRu: 'Великобритания', placeEn: 'United Kingdom' },
]

export const HOME_ZONES: HomeOption[] = [
  { id: 'samara', zone: 'Europe/Samara', ru: 'Самара', en: 'Samara', hint: 'UTC+4' },
  { id: 'moscow', zone: 'Europe/Moscow', ru: 'Москва', en: 'Moscow', hint: 'UTC+3' },
]

type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number }

function zoneParts(date: Date, timeZone: string): Parts {
  const bag: Record<string, string> = {}
  for (const part of new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)) {
    if (part.type !== 'literal') bag[part.type] = part.value
  }
  let hour = Number(bag.hour)
  if (hour === 24) hour = 0
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    minute: Number(bag.minute),
    second: Number(bag.second),
  }
}

function zoneOffset(timeZone: string, date: Date): number {
  const parts = zoneParts(date, timeZone)
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - date.getTime()
}

export function to24(hour12: number, pm: boolean): number {
  const hour = ((Math.trunc(hour12) % 12) + 12) % 12
  return pm ? hour + 12 : hour
}

export function wallToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  const probe = new Date(Date.UTC(year, month - 1, day))
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null
  const wall = Date.UTC(year, month - 1, day, hour, minute, 0)
  const first = new Date(wall - zoneOffset(timeZone, new Date(wall)))
  return new Date(wall - zoneOffset(timeZone, first))
}

export function offsetLabel(date: Date, timeZone: string): string {
  const minutes = Math.round(zoneOffset(timeZone, date) / 60000)
  const sign = minutes >= 0 ? '+' : '−'
  const abs = Math.abs(minutes)
  const hours = Math.floor(abs / 60)
  const rest = abs % 60
  return rest ? `UTC${sign}${hours}:${String(rest).padStart(2, '0')}` : `UTC${sign}${hours}`
}

export function formatWhenIn(date: Date, timeZone: string, lang: Lang): { time: string; day: string } {
  const locale = lang === 'ru' ? 'ru-RU' : 'en-GB'
  const time = new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date).replace('24:', '00:')
  const day = new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  return { time, day }
}

export function dayShift(date: Date, fromZone: string, toZone: string): -1 | 0 | 1 {
  const from = zoneParts(date, fromZone)
  const to = zoneParts(date, toZone)
  const a = Date.UTC(from.year, from.month - 1, from.day)
  const b = Date.UTC(to.year, to.month - 1, to.day)
  if (b > a) return 1
  if (b < a) return -1
  return 0
}

export function readHome(): HomeId {
  try {
    return localStorage.getItem('until-home') === 'moscow' ? 'moscow' : 'samara'
  } catch {
    return 'samara'
  }
}

export function saveHome(id: HomeId) {
  try {
    localStorage.setItem('until-home', id)
  } catch {
    /* storage blocked */
  }
}
