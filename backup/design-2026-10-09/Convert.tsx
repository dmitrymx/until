import { useEffect, useRef, useState } from 'react'
import type { EditorSeed } from './Editor.tsx'
import { t } from './i18n.ts'
import { toLocalInput } from './time.ts'
import { DEFAULT_ACCENT, type Lang } from './types.ts'
import {
  HOME_ZONES,
  SOURCE_ZONES,
  dayShift,
  formatWhenIn,
  offsetLabel,
  readHome,
  saveHome,
  to24,
  wallToUtc,
  type HomeId,
  type ZoneId,
} from './zones.ts'

export function Convert({
  lang,
  onClose,
  onUse,
}: {
  lang: Lang
  onClose: () => void
  onUse: (seed: EditorSeed) => void
}) {
  const [zoneId, setZoneId] = useState<ZoneId>('pt')
  const [clock, setClock] = useState<'12' | '24'>('12')
  const [date, setDate] = useState('')
  const [hour12, setHour12] = useState(12)
  const [hour24, setHour24] = useState(12)
  const [minute, setMinute] = useState(0)
  const [pm, setPm] = useState(false)
  const [home, setHome] = useState<HomeId>(readHome)
  const [title, setTitle] = useState('')
  const [showMw4, setShowMw4] = useState(false)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const source = SOURCE_ZONES.find((zone) => zone.id === zoneId) ?? SOURCE_ZONES[0]
  const chosen = HOME_ZONES.find((zone) => zone.id === home) ?? HOME_ZONES[0]
  const other = HOME_ZONES.find((zone) => zone.id !== home) ?? HOME_ZONES[1]
  const [year, month, day] = date.split('-').map((part) => Number(part))
  const hour = clock === '12' ? to24(hour12, pm) : hour24
  const utc = /^\d{4}-\d{2}-\d{2}$/.test(date) ? wallToUtc(year, month, day, hour, minute, source.zone) : null
  const sourceWhen = utc ? formatWhenIn(utc, source.zone, lang) : null
  const utcWhen = utc ? formatWhenIn(utc, 'UTC', lang) : null
  const mainWhen = utc ? formatWhenIn(utc, chosen.zone, lang) : null
  const otherWhen = utc ? formatWhenIn(utc, other.zone, lang) : null
  const shift = utc ? dayShift(utc, source.zone, chosen.zone) : 0
  const shiftWord = shift > 0 ? t(lang, 'nextDay') : shift < 0 ? t(lang, 'prevDay') : t(lang, 'sameDay')

  function pickHome(id: HomeId) {
    setHome(id)
    saveHome(id)
  }

  function pickClock(next: '12' | '24') {
    if (next === clock) return
    if (next === '24') setHour24(to24(hour12, pm))
    else {
      const base = hour24 % 12
      setPm(hour24 >= 12)
      setHour12(base === 0 ? 12 : base)
    }
    setClock(next)
    setShowMw4(false)
  }

  function applyMw4() {
    setZoneId('pt')
    setClock('12')
    setDate('2026-10-22')
    setHour12(9)
    setHour24(21)
    setMinute(0)
    setPm(true)
    setTitle(t(lang, 'mw4Title'))
    setShowMw4(true)
  }

  function useCountdown() {
    if (!utc) return
    onUse({
      title: title.trim() || t(lang, 'eventTitle'),
      note: showMw4 ? t(lang, 'mw4Wish') : '',
      atLocal: toLocalInput(utc.toISOString()),
      accent: DEFAULT_ACCENT,
      imageUrl: '',
      preview: '',
      imageWidth: 0,
      imageHeight: 0,
    })
  }

  return (
    <div className="modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="convert-title"
        onSubmit={(event) => {
          event.preventDefault()
          useCountdown()
        }}
      >
        <div className="sheet-head">
          <h2 id="convert-title">{t(lang, 'convertTitle')}</h2>
          <button type="button" className="btn" onClick={onClose}>{t(lang, 'close')}</button>
        </div>
        <p className="hint">{t(lang, 'convertLead')}</p>
        <button type="button" className="btn slim" onClick={applyMw4}>{t(lang, 'exampleMw4')}</button>

        <div className="field">
          {t(lang, 'sourceZone')}
          <div className="zone-grid">
            {SOURCE_ZONES.map((zone) => (
              <button
                key={zone.id}
                type="button"
                className="zone-chip"
                aria-pressed={zone.id === zoneId}
                onClick={() => { setZoneId(zone.id); setShowMw4(false) }}
              >
                <strong>{zone.short}</strong>
                <span>{lang === 'ru' ? zone.ru : zone.en}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          {t(lang, 'clock')}
          <div className="seg" role="group" aria-label={t(lang, 'clock')}>
            <button type="button" aria-pressed={clock === '12'} onClick={() => pickClock('12')}>{t(lang, 'h12')}</button>
            <button type="button" aria-pressed={clock === '24'} onClick={() => pickClock('24')}>{t(lang, 'h24')}</button>
          </div>
        </div>

        <label className="field">
          {t(lang, 'date')}
          <input type="date" value={date} onChange={(event) => { setDate(event.target.value); setShowMw4(false) }} />
        </label>

        <div className="clock-row">
          <label className="field">
            {t(lang, 'hour')}
            <input
              className="clock-num"
              type="number"
              inputMode="numeric"
              min={clock === '12' ? 1 : 0}
              max={clock === '12' ? 12 : 23}
              value={clock === '12' ? hour12 : hour24}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (clock === '12') setHour12(Math.min(12, Math.max(1, value || 1)))
                else setHour24(Math.min(23, Math.max(0, value || 0)))
                setShowMw4(false)
              }}
            />
          </label>
          <span className="clock-colon" aria-hidden="true">:</span>
          <label className="field">
            {t(lang, 'minute')}
            <input
              className="clock-num"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              value={minute}
              onChange={(event) => {
                setMinute(Math.min(59, Math.max(0, Number(event.target.value) || 0)))
                setShowMw4(false)
              }}
            />
          </label>
          {clock === '12' ? (
            <div className="seg" role="group" aria-label="AM PM">
              <button type="button" aria-pressed={!pm} onClick={() => { setPm(false); setShowMw4(false) }}>AM</button>
              <button type="button" aria-pressed={pm} onClick={() => { setPm(true); setShowMw4(false) }}>PM</button>
            </div>
          ) : null}
        </div>

        <div className="field">
          {t(lang, 'home')}
          <div className="seg" role="group" aria-label={t(lang, 'home')}>
            {HOME_ZONES.map((zone) => (
              <button key={zone.id} type="button" aria-pressed={zone.id === home} onClick={() => pickHome(zone.id)}>
                {lang === 'ru' ? zone.ru : zone.en}
              </button>
            ))}
          </div>
        </div>

        {mainWhen && otherWhen && utc ? (
          <div className="result-card">
            <p className="eyebrow">{lang === 'ru' ? chosen.ru : chosen.en} · {offsetLabel(utc, chosen.zone)}</p>
            <p className="result-time">{mainWhen.time}</p>
            <p className="result-day">{mainWhen.day}</p>
            <p className="hint">{shiftWord}</p>
            <p className="result-other">
              {lang === 'ru' ? other.ru : other.en} · {otherWhen.time} · {otherWhen.day}
            </p>
            {sourceWhen && utcWhen ? (
              <p className="hint">
                {lang === 'ru' ? source.ru : source.en} {sourceWhen.time} ({offsetLabel(utc, source.zone)}) → UTC {utcWhen.time}
              </p>
            ) : null}
          </div>
        ) : (
          <p className={date ? 'form-error' : 'hint'} role={date ? 'alert' : undefined}>
            {date ? t(lang, 'badConvert') : t(lang, 'convertEmpty')}
          </p>
        )}
        {showMw4 ? <p className="hint">{t(lang, 'mw4Note')}</p> : null}

        <label className="field">
          {t(lang, 'title')}
          <input value={title} maxLength={80} placeholder={t(lang, 'titleEventPh')} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <div className="row">
          <button className="btn primary" type="submit" disabled={!utc}>{t(lang, 'addCountdown')}</button>
          <button className="btn" type="button" onClick={onClose}>{t(lang, 'cancel')}</button>
        </div>
      </form>
    </div>
  )
}
