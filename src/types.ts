export type Lang = 'ru' | 'en'
export type Theme = 'dark' | 'light'

export type Wish = {
  id: string
  title: string
  note: string
  at: string
  accent: string
  imageUrl: string
  imageWidth: number
  imageHeight: number
  createdAt: number
  updatedAt: number
}

export type Parts = {
  done: boolean
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export type Unit = 'months' | 'days' | 'hours' | 'minutes' | 'seconds'

export const UNITS: Unit[] = ['months', 'days', 'hours', 'minutes', 'seconds']

export const ACCENTS = ['#d4895c', '#d97b8c', '#6f9a78', '#6f8fbf', '#a78bda', '#d4a24c'] as const

export const DEFAULT_ACCENT: string = ACCENTS[0]
