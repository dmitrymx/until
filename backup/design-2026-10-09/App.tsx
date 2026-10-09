import { useEffect, useRef, useState } from 'react'
import { Board } from './Board.tsx'
import { Convert } from './Convert.tsx'
import { Editor, type EditorSeed } from './Editor.tsx'
import { tabLeft, t } from './i18n.ts'
import { deleteImage, deleteWish, getImage, listWishes, putImage, putWish } from './db.ts'
import { Quiet, Stage } from './Stage.tsx'
import {
  buildBackup,
  copyText,
  decodeShare,
  encodeShare,
  idForShare,
  importBackup,
  shareUrl,
  wishFromShare,
} from './share.ts'
import { breakdown, splitWishes, toLocalInput } from './time.ts'
import { DEFAULT_ACCENT, type Lang, type Theme, type Wish } from './types.ts'

type Route = { name: 'board' } | { name: 'wish'; id: string } | { name: 'shared'; code: string }

function readRoute(): Route {
  let raw = location.hash.replace(/^#\/?/, '')
  try {
    raw = decodeURIComponent(raw)
  } catch {
    /* keep the raw hash */
  }
  if (raw.startsWith('w/')) {
    const id = raw.slice(2)
    return id ? { name: 'wish', id } : { name: 'board' }
  }
  if (raw.startsWith('s/')) {
    const code = raw.slice(2)
    return code ? { name: 'shared', code } : { name: 'board' }
  }
  return { name: 'board' }
}

function readLang(): Lang {
  try {
    const saved = localStorage.getItem('until-lang')
    if (saved === 'ru' || saved === 'en') return saved
  } catch {
    /* storage blocked */
  }
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en'
}

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('until-theme')
    if (saved === 'dark' || saved === 'light') return saved
  } catch {
    /* storage blocked */
  }
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function blankSeed(): EditorSeed {
  return {
    title: '',
    note: '',
    atLocal: '',
    accent: DEFAULT_ACCENT,
    imageUrl: '',
    preview: '',
    imageWidth: 0,
    imageHeight: 0,
  }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(readLang)
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [now, setNow] = useState(() => Date.now())
  const [route, setRoute] = useState<Route>(readRoute)
  const [wishes, setWishes] = useState<Wish[] | null>(null)
  const [photos, setPhotos] = useState<Record<string, string>>({})
  const [editor, setEditor] = useState<EditorSeed | null>(null)
  const [convertOpen, setConvertOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [loadError, setLoadError] = useState(false)
  const [version, setVersion] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.lang = lang
    try {
      localStorage.setItem('until-theme', theme)
      localStorage.setItem('until-lang', lang)
    } catch {
      /* storage blocked */
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f3efe6' : '#0c0b0a')
  }, [theme, lang])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = window.setInterval(tick, 1000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  useEffect(() => {
    const onHash = () => setRoute(readRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    let cancel = false
    const created: string[] = []
    ;(async () => {
      try {
        const list = await listWishes()
        const map: Record<string, string> = {}
        for (const wish of list) {
          const blob = await getImage(wish.id)
          if (!blob) continue
          const url = URL.createObjectURL(blob)
          created.push(url)
          map[wish.id] = url
        }
        if (cancel) {
          for (const url of created) URL.revokeObjectURL(url)
          return
        }
        setWishes(list)
        setPhotos(map)
        setLoadError(false)
      } catch {
        if (!cancel) setLoadError(true)
      }
    })()
    return () => {
      cancel = true
      for (const url of created) URL.revokeObjectURL(url)
    }
  }, [version])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(id)
  }, [toast])

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      const menu = menuRef.current
      if (!menu?.open) return
      if (event.target instanceof Node && menu.contains(event.target)) return
      menu.open = false
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [])

  const routeKey = route.name === 'board' ? 'board' : route.name === 'wish' ? route.id : route.code
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [routeKey])

  useEffect(() => {
    if (!wishes) return
    const current = route.name === 'wish' ? wishes.find((wish) => wish.id === route.id) : null
    const focus = current ?? splitWishes(wishes, now).next
    if (!focus) {
      document.title = 'Until'
      return
    }
    const parts = breakdown(new Date(focus.at), new Date(now))
    document.title = `${tabLeft(parts, lang)} · ${focus.title} — Until`
  }, [wishes, now, lang, route])

  function openWishEditor(wish: Wish) {
    setEditor({
      id: wish.id,
      title: wish.title,
      note: wish.note,
      atLocal: toLocalInput(wish.at),
      accent: wish.accent,
      imageUrl: wish.imageUrl,
      preview: photos[wish.id] || wish.imageUrl,
      imageWidth: wish.imageWidth,
      imageHeight: wish.imageHeight,
    })
  }

  async function onSave(result: {
    id?: string
    title: string
    note: string
    at: string
    accent: string
    imageUrl: string
    imageBlob: Blob | null
    imageWidth: number
    imageHeight: number
    removeImage: boolean
  }) {
    const id = result.id ?? crypto.randomUUID()
    const existing = wishes?.find((wish) => wish.id === id)
    let imageWidth = existing?.imageWidth ?? 0
    let imageHeight = existing?.imageHeight ?? 0
    if (result.imageBlob) {
      imageWidth = result.imageWidth
      imageHeight = result.imageHeight
    } else if (result.removeImage) {
      imageWidth = 0
      imageHeight = 0
    }
    const wish: Wish = {
      id,
      title: result.title,
      note: result.note,
      at: result.at,
      accent: result.accent,
      imageUrl: result.imageUrl,
      imageWidth,
      imageHeight,
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    }
    await putWish(wish)
    if (result.imageBlob) await putImage(id, result.imageBlob)
    else if (result.removeImage) await deleteImage(id)
    setWishes((list) => [...(list ?? []).filter((item) => item.id !== id), wish])
    setEditor(null)
    setVersion((value) => value + 1)
    location.hash = `#/w/${encodeURIComponent(id)}`
  }

  async function onShare(wish: Wish) {
    await copyText(shareUrl(encodeShare(wish)))
    setToast(photos[wish.id] && !wish.imageUrl ? t(lang, 'copiedLocal') : t(lang, 'copied'))
  }

  async function onExport() {
    const backup = await buildBackup()
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `until-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1500)
    setToast(t(lang, 'exported'))
    if (menuRef.current) menuRef.current.open = false
  }

  function dropLocal(id: string) {
    setPhotos((map) => {
      const photo = map[id]
      if (!photo) return map
      URL.revokeObjectURL(photo)
      const next = { ...map }
      delete next[id]
      return next
    })
    setWishes((list) => (list ?? []).filter((item) => item.id !== id))
  }

  async function onImport(file: File) {
    try {
      const count = await importBackup(file)
      setVersion((value) => value + 1)
      setToast(count > 0 ? t(lang, 'imported') : t(lang, 'importEmpty'))
    } catch {
      setToast(t(lang, 'importFail'))
    }
    if (menuRef.current) menuRef.current.open = false
  }

  let main = <Skeleton />
  if (loadError) {
    main = <Quiet text={t(lang, 'storageFail')} action={t(lang, 'back')} />
  } else if (wishes) {
    if (route.name === 'board') {
      main = (
        <Board
          lang={lang}
          theme={theme}
          wishes={wishes}
          photos={photos}
          now={now}
          onCreate={() => setEditor(blankSeed())}
          onGta={() => setEditor({ ...blankSeed(), title: t(lang, 'gtaTitle'), note: t(lang, 'gtaNote'), atLocal: '2026-11-19T00:00' })}
          onYear={() => setEditor({ ...blankSeed(), title: t(lang, 'yearTitle'), note: t(lang, 'yearNote'), atLocal: '2027-01-01T00:00' })}
        />
      )
    } else if (route.name === 'wish') {
      const wish = wishes.find((item) => item.id === route.id)
      main = wish ? (
        <Stage
          lang={lang}
          theme={theme}
          wish={wish}
          photo={photos[wish.id] || wish.imageUrl}
          now={now}
          mode="saved"
          onEdit={() => openWishEditor(wish)}
          onDelete={() => {
            void deleteWish(wish.id).then(() => {
              dropLocal(wish.id)
              location.hash = '#/'
            })
          }}
          onShare={() => void onShare(wish)}
          onSaveShared={() => undefined}
        />
      ) : (
        <Quiet text={t(lang, 'missing')} action={t(lang, 'back')} />
      )
    } else {
      const shared = decodeShare(route.code)
      if (!shared) {
        main = <Quiet text={t(lang, 'badShare')} action={t(lang, 'back')} />
      } else {
        const id = idForShare(route.code)
        const existing = wishes.find((item) => item.id === id)
        const wish = existing ?? wishFromShare(route.code, shared)
        main = (
          <Stage
            lang={lang}
            theme={theme}
            wish={wish}
            photo={photos[wish.id] || wish.imageUrl}
            now={now}
            mode={existing ? 'saved' : 'shared'}
            onEdit={() => openWishEditor(wish)}
            onDelete={() => {
              void deleteWish(wish.id).then(() => {
                dropLocal(wish.id)
                location.hash = '#/'
              })
            }}
            onShare={() => void onShare(wish)}
            onSaveShared={() => {
              const saved = wishFromShare(route.code, shared, existing?.createdAt)
              void putWish(saved).then(() => {
                setWishes((list) => [...(list ?? []).filter((item) => item.id !== saved.id), saved])
                location.hash = `#/w/${encodeURIComponent(saved.id)}`
                setToast(t(lang, 'savedMine'))
              })
            }}
          />
        )
      }
    }
  }

  const onBoard = route.name === 'board'

  return (
    <>
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="grain" aria-hidden="true" />
      <a className="skip" href="#content">{t(lang, 'skip')}</a>
      <div className="shell">
        <header className={scrolled ? 'topbar is-scrolled' : 'topbar'}>
          <div className="brand-lockup">
            {onBoard ? <h1 className="brand" translate="no">Until</h1> : <a className="brand" href="#/" translate="no">Until</a>}
            <p className="tagline">{t(lang, 'tagline')}</p>
          </div>
          <div className="tools">
            <div className="seg" role="group" aria-label={t(lang, 'language')}>
              <button type="button" aria-pressed={lang === 'ru'} onClick={() => setLang('ru')}>RU</button>
              <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
            </div>
            <div className="seg" role="group" aria-label={t(lang, 'theme')}>
              <button type="button" aria-pressed={theme === 'light'} aria-label={t(lang, 'light')} onClick={() => setTheme('light')}>
                <Sun />
              </button>
              <button type="button" aria-pressed={theme === 'dark'} aria-label={t(lang, 'dark')} onClick={() => setTheme('dark')}>
                <Moon />
              </button>
            </div>
            <button type="button" className="btn" onClick={() => setConvertOpen(true)}>{t(lang, 'convert')}</button>
            <details className="menu" ref={menuRef}>
              <summary>{t(lang, 'devices')}</summary>
              <div className="menu-panel">
                <p>{t(lang, 'storage')}</p>
                <div className="row">
                  <button type="button" className="btn" onClick={() => void onExport()}>{t(lang, 'export')}</button>
                  <button type="button" className="btn" onClick={() => importRef.current?.click()}>{t(lang, 'import')}</button>
                </div>
              </div>
            </details>
            <button type="button" className="btn primary" onClick={() => setEditor(blankSeed())}>{t(lang, 'newWish')}</button>
          </div>
        </header>
        <main id="content">{main}</main>
        <footer className="site-footer">
          {onBoard ? <p className="storage">{t(lang, 'storage')}</p> : null}
          <p>
            {t(lang, 'madeBy')} <span translate="no">Максимов Д.А.</span>
            {' · '}
            <a href="https://t.me/dmitrymx" target="_blank" rel="noreferrer">Telegram</a>
            {' · '}
            <a href="https://mxmvdev.ru" target="_blank" rel="noreferrer">mxmvdev.ru</a>
          </p>
        </footer>
      </div>
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (file) void onImport(file)
        }}
      />
      {convertOpen ? (
        <Convert
          lang={lang}
          onClose={() => setConvertOpen(false)}
          onUse={(seed) => {
            setConvertOpen(false)
            setEditor(seed)
          }}
        />
      ) : null}
      {editor ? <Editor lang={lang} initial={editor} onClose={() => setEditor(null)} onSave={onSave} /> : null}
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </>
  )
}

function Skeleton() {
  return (
    <div className="mosaic" aria-busy="true">
      <div className="hero skeleton" />
      <div className="board">
        <div className="tile skeleton" />
        <div className="tile skeleton" />
      </div>
    </div>
  )
}

function Sun() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function Moon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" fill="currentColor" />
    </svg>
  )
}
