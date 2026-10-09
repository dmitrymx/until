import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { t } from './i18n.ts'
import { isHttpUrl, prepareImage } from './media.ts'
import { ACCENTS, DEFAULT_ACCENT, type Lang } from './types.ts'

export type EditorSeed = {
  id?: string
  title: string
  note: string
  atLocal: string
  accent: string
  imageUrl: string
  preview: string
  imageWidth: number
  imageHeight: number
}

export type EditorResult = {
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
}

export function Editor({
  lang,
  initial,
  onClose,
  onSave,
}: {
  lang: Lang
  initial: EditorSeed
  onClose: () => void
  onSave: (result: EditorResult) => Promise<void>
}) {
  const [title, setTitle] = useState(initial.title)
  const [note, setNote] = useState(initial.note)
  const [atLocal, setAtLocal] = useState(initial.atLocal)
  const [accent, setAccent] = useState(initial.accent || DEFAULT_ACCENT)
  const [accentTouched, setAccentTouched] = useState(false)
  const [imageUrl, setImageUrl] = useState(initial.imageUrl)
  const [preview, setPreview] = useState(initial.preview)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [width, setWidth] = useState(initial.imageWidth)
  const [height, setHeight] = useState(initial.imageHeight)
  const [removeImage, setRemoveImage] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState('')
  const previewRef = useRef<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useEffect(() => {
    titleRef.current?.focus()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  async function takeFile(file: File) {
    setCompressing(true)
    setError('')
    try {
      const prepared = await prepareImage(file)
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
      const url = URL.createObjectURL(prepared.blob)
      previewRef.current = url
      setPreview(url)
      setBlob(prepared.blob)
      setWidth(prepared.width)
      setHeight(prepared.height)
      setRemoveImage(false)
      if (!accentTouched) setAccent(prepared.accent)
    } catch {
      setError(t(lang, 'badImage'))
    } finally {
      setCompressing(false)
    }
  }

  function clearPicture() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setPreview('')
    setBlob(null)
    setWidth(0)
    setHeight(0)
    setImageUrl('')
    setRemoveImage(true)
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file) void takeFile(file)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (saving.current) return
    saving.current = true
    const nextTitle = title.trim()
    const nextUrl = imageUrl.trim()
    if (!nextTitle || !atLocal) {
      saving.current = false
      setError(t(lang, 'required'))
      return
    }
    const when = new Date(atLocal)
    if (Number.isNaN(when.getTime())) {
      saving.current = false
      setError(t(lang, 'badDate'))
      return
    }
    if (nextUrl && !isHttpUrl(nextUrl)) {
      saving.current = false
      setError(t(lang, 'badUrl'))
      return
    }
    setBusy(true)
    setError('')
    try {
      await onSave({
        id: initial.id,
        title: nextTitle.slice(0, 80),
        note: note.trim().slice(0, 280),
        at: when.toISOString(),
        accent,
        imageUrl: nextUrl,
        imageBlob: blob,
        imageWidth: width,
        imageHeight: height,
        removeImage,
      })
    } catch {
      saving.current = false
      setBusy(false)
      setError(t(lang, 'storageFail'))
    }
  }

  return (
    <div className="modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <form className="sheet" role="dialog" aria-modal="true" aria-labelledby="editor-title" onSubmit={(event) => void onSubmit(event)}>
        <div className="sheet-head">
          <h2 id="editor-title">{initial.id ? t(lang, 'edit') : t(lang, 'newWish')}</h2>
          <button type="button" className="btn" onClick={onClose}>{t(lang, 'close')}</button>
        </div>

        <label
          className={dragOver ? 'drop is-over' : 'drop'}
          onDragOver={(event) => { event.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {preview ? <img src={preview} alt="" /> : <span>{compressing ? t(lang, 'compressing') : t(lang, 'drop')}</span>}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0]
              event.target.value = ''
              if (file) void takeFile(file)
            }}
          />
        </label>
        <p className="hint">{t(lang, 'pictureHint')}</p>
        {preview || imageUrl ? (
          <button type="button" className="btn slim" onClick={clearPicture}>{t(lang, 'removeImage')}</button>
        ) : null}

        <label className="field">
          {t(lang, 'title')}
          <input ref={titleRef} value={title} maxLength={80} placeholder={t(lang, 'titlePh')} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="field">
          {t(lang, 'when')}
          <input type="datetime-local" value={atLocal} onChange={(event) => setAtLocal(event.target.value)} />
        </label>
        <label className="field">
          {t(lang, 'note')}
          <textarea value={note} maxLength={280} placeholder={t(lang, 'notePh')} onChange={(event) => setNote(event.target.value)} />
        </label>
        <label className="field">
          {t(lang, 'imageUrl')}
          <input value={imageUrl} maxLength={2000} placeholder="https://" inputMode="url" onChange={(event) => setImageUrl(event.target.value)} />
        </label>
        <p className="hint">{t(lang, 'imageUrlHint')}</p>

        <fieldset className="swatches">
          <legend>{t(lang, 'accent')}</legend>
          {ACCENTS.map((color) => (
            <button
              key={color}
              type="button"
              className="swatch"
              style={{ background: color }}
              aria-label={color}
              aria-pressed={accent.toLowerCase() === color}
              onClick={() => { setAccent(color); setAccentTouched(true) }}
            />
          ))}
        </fieldset>

        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <div className="row">
          <button className="btn primary" type="submit" disabled={busy || compressing}>{t(lang, 'save')}</button>
          <button className="btn" type="button" onClick={onClose}>{t(lang, 'cancel')}</button>
        </div>
      </form>
    </div>
  )
}
