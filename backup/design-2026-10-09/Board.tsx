import type { CSSProperties } from 'react'
import { Countdown } from './Countdown.tsx'
import { t } from './i18n.ts'
import { tuneAccent } from './media.ts'
import { formatWhen, splitWishes } from './time.ts'
import type { Lang, Theme, Wish } from './types.ts'

function cover(wish: Wish, photos: Record<string, string>): string {
  return photos[wish.id] || wish.imageUrl
}

export function Board({
  lang,
  theme,
  wishes,
  photos,
  now,
  onCreate,
  onGta,
  onYear,
}: {
  lang: Lang
  theme: Theme
  wishes: Wish[]
  photos: Record<string, string>
  now: number
  onCreate: () => void
  onGta: () => void
  onYear: () => void
}) {
  const { next, rest } = splitWishes(wishes, now)

  if (wishes.length === 0) {
    return (
      <section className="empty">
        <p className="eyebrow">Until</p>
        <h2>{t(lang, 'emptyTitle')}</h2>
        <p className="lede">{t(lang, 'emptyText')}</p>
        <div className="row">
          <button type="button" className="btn primary" onClick={onCreate}>{t(lang, 'newWish')}</button>
        </div>
        <div className="row chips">
          <button type="button" className="btn" onClick={onGta}>{t(lang, 'exampleGta')}</button>
          <button type="button" className="btn" onClick={onYear}>{t(lang, 'exampleYear')}</button>
        </div>
      </section>
    )
  }

  return (
    <div className="mosaic">
      {next ? <Hero wish={next} lang={lang} theme={theme} photo={cover(next, photos)} now={now} /> : null}
      {rest.length > 0 ? (
        <div className="board">
          {rest.map((wish) => (
            <Tile key={wish.id} wish={wish} lang={lang} theme={theme} photo={cover(wish, photos)} now={now} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Hero({ wish, lang, theme, photo, now }: { wish: Wish; lang: Lang; theme: Theme; photo: string; now: number }) {
  const accent = tuneAccent(wish.accent, photo ? 'dark' : theme)
  return (
    <a className={photo ? 'hero has-photo' : 'hero'} href={`#/w/${encodeURIComponent(wish.id)}`} style={{ '--tile-accent': accent, '--glow': wish.accent } as CSSProperties}>
      {photo ? <img className="hero-img" src={photo} alt="" referrerPolicy="no-referrer" /> : null}
      <span className="hero-shade" />
      <span className="hero-copy">
        <span className="eyebrow">{formatWhen(wish.at, lang)}</span>
        <h2>{wish.title}</h2>
        {wish.note ? <p className="lede">{wish.note}</p> : null}
        <Countdown at={wish.at} now={now} lang={lang} variant="hero" accent={accent} />
      </span>
    </a>
  )
}

function Tile({ wish, lang, theme, photo, now }: { wish: Wish; lang: Lang; theme: Theme; photo: string; now: number }) {
  const accent = tuneAccent(wish.accent, theme)
  const ratio = wish.imageWidth > 0 && wish.imageHeight > 0 ? wish.imageWidth / wish.imageHeight : undefined
  const past = new Date(wish.at).getTime() <= now
  return (
    <a
      className={past ? 'tile is-past' : 'tile'}
      href={`#/w/${encodeURIComponent(wish.id)}`}
      style={{ '--tile-accent': accent, '--glow': wish.accent } as CSSProperties}
      aria-label={`${t(lang, 'openWish')}: ${wish.title}`}
    >
      {photo ? (
        <span className="media" style={ratio ? { aspectRatio: String(ratio) } : undefined}>
          <img src={photo} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" width={wish.imageWidth || undefined} height={wish.imageHeight || undefined} />
        </span>
      ) : null}
      <span className="tile-body">
        <span className="eyebrow">{formatWhen(wish.at, lang)}</span>
        <h2>{wish.title}</h2>
        {wish.note ? <p className="note">{wish.note}</p> : null}
        <Countdown at={wish.at} now={now} lang={lang} variant="tile" accent={accent} />
      </span>
    </a>
  )
}
