export function downloadCalendar(wish: { title: string; note: string; at: string }) {
  const start = new Date(wish.at)
  if (Number.isNaN(start.getTime())) return
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const clean = (value: string) => value.replace(/[\r\n]/g, ' ')
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Until//Countdown//RU',
    'BEGIN:VEVENT',
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${clean(wish.title)}`,
    `DESCRIPTION:${clean(wish.note)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const blob = new Blob([body], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${wish.title.slice(0, 40) || 'until'}.ics`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
