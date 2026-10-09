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
  const [preset, setPreset] = useState<'full' | 'campaign' | 'dmz' | null>(null)
  const [hourOfficial, setHourOfficial] = useState(true)
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
  const [year, month, day] = date.split('-').map((part) => Number(part))
  const hour = clock === '12' ? to24(hour12, pm) : hour24
  const utc = /^\d{4}-\d{2}-\d{2}$/.test(date) ? wallToUtc(year, month, day, hour, minute, source.zone) : null
  const sourceWhen = utc ? formatWhenIn(utc, source.zone, lang) : null
  const utcWhen = utc ? formatWhenIn(utc, 'UTC', lang) : null

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
    setPreset(null)
    setHourOfficial(true)
  }

  function markOwn() {
    setPreset(null)
    setHourOfficial(true)
  }

  function applyPreset(kind: 'full' | 'campaign' | 'dmz') {
    setZoneId('pt')
    setClock('12')
    setPreset(kind)
    if (kind === 'full') {
      setDate('2026-10-22')
      setHour12(9)
      setHour24(21)
      setMinute(0)
      setPm(true)
      setTitle(t(lang, 'mw4Title'))
      setHourOfficial(true)
      return
    }
    setDate(kind === 'campaign' ? '2026-10-16' : '2026-10-20')
    setTitle(t(lang, kind === 'campaign' ? 'campTitle' : 'dmzTitle'))
    setHourOfficial(false)
  }

  function useCountdown() {
    if (!utc) return
    onUse({
      title: title.trim() || t(lang, 'eventTitle'),
      note: preset === 'full' ? t(lang, 'mw4Wish') : preset === 'campaign' ? t(lang, 'campWish') : preset === 'dmz' ? t(lang, 'dmzWish') : '',
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
        className="sheet sheet-convert"
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
        <div className="row examples">
          <button type="button" className="btn slim" onClick={() => applyPreset('full')}>{t(lang, 'exampleMw4')}</button>
          <button type="button" className="btn slim" onClick={() => applyPreset('campaign')}>{t(lang, 'exampleCamp')}</button>
          <button type="button" className="btn slim" onClick={() => applyPreset('dmz')}>{t(lang, 'exampleDmz')}</button>
        </div>

        <div className="convert-split">
          <section className="convert-pane">
            <p className="eyebrow">{t(lang, 'asWritten')}</p>
            <div className="zone-grid">
              {SOURCE_ZONES.map((zone) => (
                <button
                  key={zone.id}
                  type="button"
                  className="zone-chip"
                  aria-pressed={zone.id === zoneId}
                  onClick={() => { setZoneId(zone.id); markOwn() }}
                >
                  <strong>{zone.short}</strong>
                  <span>{lang === 'ru' ? zone.ru : zone.en}</span>
                </button>
              ))}
            </div>
            <p className="hint">{lang === 'ru' ? source.placeRu : source.placeEn}</p>

            <div className="clock-face">
              <input
                aria-label={t(lang, 'hour')}
                inputMode="numeric"
                value={String(clock === '12' ? hour12 : hour24).padStart(2, '0')}
                onChange={(event) => {
                  const value = Number(event.target.value.replace(/\D/g, ''))
                  if (clock === '12') setHour12(Math.min(12, Math.max(1, value || 1)))
                  else setHour24(Math.min(23, Math.max(0, Number.isFinite(value) ? value : 0)))
                  markOwn()
                }}
              />
              <span aria-hidden="true">:</span>
              <input
                aria-label={t(lang, 'minute')}
                inputMode="numeric"
                value={String(minute).padStart(2, '0')}
                onChange={(event) => {
                  setMinute(Math.min(59, Math.max(0, Number(event.target.value.replace(/\D/g, '')) || 0)))
                  markOwn()
                }}
              />
              {clock === '12' ? (
                <div className="ampm" role="group" aria-label="AM PM">
                  <button type="button" aria-pressed={!pm} onClick={() => { setPm(false); markOwn() }}>AM</button>
                  <button type="button" aria-pressed={pm} onClick={() => { setPm(true); markOwn() }}>PM</button>
                </div>
              ) : null}
            </div>
            <div className="row">
              <button type="button" className={clock === '12' ? 'text-toggle is-on' : 'text-toggle'} onClick={() => pickClock('12')}>{t(lang, 'h12')}</button>
              <button type="button" className={clock === '24' ? 'text-toggle is-on' : 'text-toggle'} onClick={() => pickClock('24')}>{t(lang, 'h24')}</button>
            </div>
            <label className="field">
              {t(lang, 'date')}
              <input type="date" value={date} onChange={(event) => { setDate(event.target.value); markOwn() }} />
            </label>
          </section>

          <section className="convert-pane convert-yours">
            <p className="eyebrow">{t(lang, 'yours')}</p>
            <div className="city-grid">
              {HOME_ZONES.map((zone) => {
                const when = utc ? formatWhenIn(utc, zone.zone, lang) : null
                const shift = utc ? dayShift(utc, source.zone, zone.zone) : 0
                const shiftWord = shift > 0 ? t(lang, 'nextDay') : shift < 0 ? t(lang, 'prevDay') : t(lang, 'sameDay')
                return (
                  <button
                    key={zone.id}
                    type="button"
                    className="city-card"
                    aria-pressed={zone.id === home}
                    onClick={() => pickHome(zone.id)}
                  >
                    <span className="eyebrow">{lang === 'ru' ? zone.ru : zone.en} · {zone.hint}</span>
                    <span className="result-time">{when ? when.time : '—'}</span>
                    <span className="result-day">{when ? when.day : '—'}</span>
                    {when ? <span className="hint">{shiftWord}</span> : null}
                  </button>
                )
              })}
            </div>
            {utc && sourceWhen && utcWhen ? (
              <p className="hint proof">
                {source.short} {sourceWhen.time} ({offsetLabel(utc, source.zone)}) → UTC {utcWhen.time}
              </p>
            ) : (
              <p className={date ? 'form-error' : 'hint'}>{date ? t(lang, 'badConvert') : t(lang, 'convertEmpty')}</p>
            )}
            {!hourOfficial && utc ? <p className="warn">{t(lang, 'hourUnknown')}</p> : null}
            {preset === 'full' ? <p className="hint">{t(lang, 'mw4Note')}</p> : null}
            {preset === 'campaign' ? <p className="hint">{t(lang, 'campNote')}</p> : null}
            {preset === 'dmz' ? <p className="hint">{t(lang, 'dmzNote')}</p> : null}
            <label className="field">
              {t(lang, 'title')}
              <input value={title} maxLength={80} placeholder={t(lang, 'titleEventPh')} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <button className="btn primary" type="submit" disabled={!utc}>{t(lang, 'addCountdown')}</button>
          </section>
        </div>
      </form>
    </div>
  )
}
