import { getImage, listWishes, putImage, putWish } from './db.ts'
import { blobToDataUrl, dataUrlToBlob, isHttpUrl } from './media.ts'
import { DEFAULT_ACCENT, type Wish } from './types.ts'

export type Shared = {
  v: 1
  title: string
  note: string
  at: string
  accent: string
  imageUrl: string
}

const MAX_CODE = 8000

function bytesToB64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/g, '')
}

function b64urlToBytes(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4))
  const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/') + pad)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function encodeShare(wish: Pick<Wish, 'title' | 'note' | 'at' | 'accent' | 'imageUrl'>): string {
  const payload: Shared = {
    v: 1,
    title: wish.title,
    note: wish.note,
    at: wish.at,
    accent: wish.accent,
    imageUrl: isHttpUrl(wish.imageUrl) ? wish.imageUrl : '',
  }
  return bytesToB64url(new TextEncoder().encode(JSON.stringify(payload)))
}

export function decodeShare(code: string): Shared | null {
  if (!code || code.length > MAX_CODE) return null
  try {
    const json = new TextDecoder().decode(b64urlToBytes(code))
    const value = JSON.parse(json) as Partial<Shared>
    if (value.v !== 1 || typeof value.title !== 'string' || typeof value.at !== 'string') return null
    const at = new Date(value.at)
    if (Number.isNaN(at.getTime())) return null
    const title = value.title.trim().slice(0, 80)
    if (!title) return null
    const imageUrl = typeof value.imageUrl === 'string' && isHttpUrl(value.imageUrl) ? value.imageUrl : ''
    const accent = typeof value.accent === 'string' && /^#[\da-f]{6}$/i.test(value.accent) ? value.accent : DEFAULT_ACCENT
    return {
      v: 1,
      title,
      note: typeof value.note === 'string' ? value.note.trim().slice(0, 280) : '',
      at: at.toISOString(),
      accent,
      imageUrl,
    }
  } catch {
    return null
  }
}

export function idForShare(code: string): string {
  return `share:${code}`
}

export function wishFromShare(code: string, shared: Shared, createdAt = Date.now()): Wish {
  return {
    id: idForShare(code),
    title: shared.title,
    note: shared.note,
    at: shared.at,
    accent: shared.accent,
    imageUrl: shared.imageUrl,
    imageWidth: 0,
    imageHeight: 0,
    createdAt,
    updatedAt: Date.now(),
  }
}

export function shareUrl(code: string): string {
  const url = new URL(location.href)
  url.hash = `#/s/${code}`
  return url.toString()
}

export async function copyText(text: string): Promise<void> {
  const viaClipboard = Promise.resolve()
    .then(() => navigator.clipboard.writeText(text))
    .then(() => true)
    .catch(() => false)
  const copied = await Promise.race([
    viaClipboard,
    new Promise<boolean>((resolve) => window.setTimeout(() => resolve(false), 500)),
  ])
  if (copied) return
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.left = '-9999px'
  document.body.appendChild(area)
  area.select()
  document.execCommand('copy')
  area.remove()
}

type BackupWish = Wish & { image?: string }

type BackupFile = {
  v: 1
  exportedAt: string
  wishes: BackupWish[]
}

function cleanWish(value: unknown): { wish: Wish; image: string } | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Partial<BackupWish>
  if (typeof row.id !== 'string' || typeof row.title !== 'string' || typeof row.at !== 'string') return null
  if (!row.id || row.id.length > 9000) return null
  const at = new Date(row.at)
  if (Number.isNaN(at.getTime())) return null
  const accent = typeof row.accent === 'string' && /^#[\da-f]{6}$/i.test(row.accent) ? row.accent : DEFAULT_ACCENT
  const imageUrl = typeof row.imageUrl === 'string' && isHttpUrl(row.imageUrl) ? row.imageUrl.slice(0, 2000) : ''
  const wish: Wish = {
    id: row.id,
    title: row.title.trim().slice(0, 80),
    note: typeof row.note === 'string' ? row.note.trim().slice(0, 280) : '',
    at: at.toISOString(),
    accent,
    imageUrl,
    imageWidth: typeof row.imageWidth === 'number' && row.imageWidth > 0 ? Math.round(row.imageWidth) : 0,
    imageHeight: typeof row.imageHeight === 'number' && row.imageHeight > 0 ? Math.round(row.imageHeight) : 0,
    createdAt: typeof row.createdAt === 'number' ? row.createdAt : Date.now(),
    updatedAt: typeof row.updatedAt === 'number' ? row.updatedAt : Date.now(),
  }
  if (!wish.title) return null
  return { wish, image: typeof row.image === 'string' ? row.image : '' }
}

export async function buildBackup(): Promise<BackupFile> {
  const wishes = await listWishes()
  const packed: BackupWish[] = []
  for (const wish of wishes) {
    const blob = await getImage(wish.id)
    packed.push(blob ? { ...wish, image: await blobToDataUrl(blob) } : wish)
  }
  return { v: 1, exportedAt: new Date().toISOString(), wishes: packed }
}

export async function importBackup(file: File): Promise<number> {
  const text = await file.text()
  const parsed = JSON.parse(text) as Partial<BackupFile>
  if (parsed.v !== 1 || !Array.isArray(parsed.wishes)) throw new Error('format')
  if (parsed.wishes.length > 500) throw new Error('format')
  let count = 0
  for (const row of parsed.wishes) {
    const clean = cleanWish(row)
    if (!clean) continue
    await putWish(clean.wish)
    const blob = clean.image ? dataUrlToBlob(clean.image) : null
    if (blob) await putImage(clean.wish.id, blob)
    count += 1
  }
  return count
}
