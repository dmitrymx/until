import { useState, type CSSProperties } from 'react'
import { downloadCalendar } from './calendar.ts'
import { Countdown } from './Countdown.tsx'
import { t } from './i18n.ts'
import { tuneAccent } from './media.ts'
import { formatWhen, waitProgress } from './time.ts'
import type { Lang, Theme, Wish } from './types.ts'

export function Stage({
  lang,
  theme,
  wish,
  photo,
  now,
  mode,
  onEdit,
  onDelete,
  onShare,
  onSaveShared,
}: {
  lang: Lang
  theme: Theme
  wish: Wish
  photo: string
  now: number
  mode: 'saved' | 'shared'
  onEdit: () => void
  onDelete: () => void
  onShare: () => void
  onSaveShared: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const accent = tuneAccent(wish.accent, photo ? 'dark' : theme)
  const done = new Date(wish.at).getTime() <= now
  return (
    <article className={photo ? 'stage has-photo' : 'stage'} style={{ '--tile-accent': accent, '--glow': wish.accent } as CSSProperties}>
      {photo ? <img className="stage-img" src={photo} alt="" referrerPolicy="no-referrer" /> : null}
      <span className="hero-shade" />
      <div className="stage-top">
        <a className="btn" href="#/">{t(lang, 'back')}</a>
      </div>
      <div className="stage-copy">
        <p className="eyebrow">{formatWhen(wish.at, lang)}</p>
        <h1>{wish.title}</h1>
        {wish.note ? <p className="lede">{wish.note}</p> : null}
        {done ? <p className="arrived-soft">{t(lang, 'arrivedSoft')}</p> : null}
        <Countdown at={wish.at} now={now} lang={lang} variant="stage" accent={accent} />
        <Progress value={waitProgress(wish.createdAt, wish.at, now)} label={t(lang, 'waited')} />
        {mode === 'shared' ? <p className="hint on-stage">{t(lang, 'sharedHint')}</p> : null}
        <div className="row">
          {mode === 'shared' ? (
            <button type="button" className="btn primary" onClick={onSaveShared}>{t(lang, 'saveMine')}</button>
          ) : (
            <button type="button" className="btn primary" onClick={onEdit}>{t(lang, 'edit')}</button>
          )}
          <button type="button" className="btn" onClick={onShare}>{t(lang, 'share')}</button>
          <button type="button" className="btn" onClick={() => downloadCalendar(wish)}>{t(lang, 'calendar')}</button>
          {mode === 'saved' && !confirming ? (
            <button type="button" className="btn danger" onClick={() => setConfirming(true)}>{t(lang, 'delete')}</button>
          ) : null}
          {mode === 'saved' && confirming ? (
            <>
              <span className="confirm-copy">{t(lang, 'confirmDelete')}</span>
              <button type="button" className="btn danger" onClick={onDelete}>{t(lang, 'yesDelete')}</button>
              <button type="button" className="btn" onClick={() => setConfirming(false)}>{t(lang, 'cancel')}</button>
            </>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function Progress({ value, label }: { value: number; label: string }) {
  const percent = Math.round(value * 100)
  return (
    <div className="progress" aria-label={`${label} ${percent}%`}>
      <span style={{ width: `${percent}%` }} />
    </div>
  )
}

export function Quiet({ text, action }: { text: string; action: string }) {
  return (
    <section className="empty">
      <h2>{text}</h2>
      <a className="btn primary" href="#/">{action}</a>
    </section>
  )
}
