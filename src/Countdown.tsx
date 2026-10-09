import type { CSSProperties } from 'react'
import { countdownLabel, unitWord } from './i18n.ts'
import { breakdown, pad } from './time.ts'
import { UNITS, type Lang } from './types.ts'

function Digits({ value }: { value: string }) {
  return (
    <span className="digits">
      {value.split('').map((char, index) => (
        <span className="digit" key={`${index}-${char}`}>
          <span className="digit-in">{char}</span>
        </span>
      ))}
    </span>
  )
}

export function Countdown({
  at,
  now,
  lang,
  variant,
  accent,
}: {
  at: string
  now: number
  lang: Lang
  variant: 'tile' | 'hero' | 'stage'
  accent: string
}) {
  const parts = breakdown(new Date(at), new Date(now))
  const style = { '--tile-accent': accent } as CSSProperties
  if (parts.done) {
    return (
      <div className={`count count-${variant} is-done`} style={style} role="timer" aria-label={countdownLabel(parts, lang)}>
        <p className="arrived">{countdownLabel(parts, lang)}</p>
      </div>
    )
  }
  return (
    <div className={`count count-${variant}`} style={style} role="timer" aria-label={countdownLabel(parts, lang)}>
      {UNITS.map((unit) => (
        <div className="unit" key={unit}>
          <Digits value={pad(parts[unit])} />
          <span className="unit-label">{unitWord(lang, unit, parts[unit], variant === 'tile')}</span>
        </div>
      ))}
    </div>
  )
}
