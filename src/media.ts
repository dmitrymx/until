const MAX_EDGE = 1600
const MAX_BYTES = 25 * 1024 * 1024

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function hex(n: number): string {
  return n.toString(16).padStart(2, '0')
}

function rgbHex(r: number, g: number, b: number): string {
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

function parseHex(value: string): { r: number; g: number; b: number } | null {
  const match = /^#([\da-f]{6})$/i.exec(value.trim())
  if (!match) return null
  const n = Number.parseInt(match[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function tuneAccent(value: string, theme: 'dark' | 'light'): string {
  const rgb = parseHex(value)
  if (!rgb) return theme === 'dark' ? '#f0c7a4' : '#9a4e2c'
  const lum = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
  const toward = theme === 'dark' ? 255 : 40
  const amount = theme === 'dark' ? (lum < 0.62 ? 0.48 : 0) : lum > 0.42 ? 0.46 : 0
  if (!amount) return rgbHex(rgb.r, rgb.g, rgb.b)
  const mix = (channel: number) => Math.round(channel + (toward - channel) * amount)
  return rgbHex(mix(rgb.r), mix(rgb.g), mix(rgb.b))
}

function blobFromCanvas(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality))
}

export async function prepareImage(file: File): Promise<{ blob: Blob; accent: string; width: number; height: number }> {
  if (!file.type.startsWith('image/')) throw new Error('type')
  if (file.size > MAX_BYTES) throw new Error('size')
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) throw new Error('canvas')
    ctx.drawImage(bitmap, 0, 0, width, height)

    const sample = document.createElement('canvas')
    sample.width = 1
    sample.height = 1
    const sampleCtx = sample.getContext('2d', { willReadFrequently: true })
    if (!sampleCtx) throw new Error('canvas')
    sampleCtx.drawImage(canvas, 0, 0, 1, 1)
    const pixel = sampleCtx.getImageData(0, 0, 1, 1).data
    const accent = rgbHex(pixel[0] ?? 212, pixel[1] ?? 137, pixel[2] ?? 92)

    const webp = await blobFromCanvas(canvas, 'image/webp', 0.82)
    const blob = webp && webp.size > 0 ? webp : await blobFromCanvas(canvas, 'image/jpeg', 0.86)
    if (!blob) throw new Error('encode')
    return { blob, accent, width, height }
  } finally {
    bitmap.close()
  }
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([a-z0-9+/=\s]+)$/i.exec(dataUrl)
  if (!match) return null
  const mime = match[1]
  const body = match[2].replace(/\s/g, '')
  if (body.length > 12_000_000) return null
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}
