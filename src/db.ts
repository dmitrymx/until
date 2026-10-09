import { DEFAULT_ACCENT, type Wish } from './types.ts'

const DB_NAME = 'until'
const DB_VERSION = 1

let opening: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (opening) return opening
  opening = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      opening = null
      reject(new Error('idb'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('wishes')) db.createObjectStore('wishes', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('images')) db.createObjectStore('images')
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      opening = null
      reject(request.error ?? new Error('idb'))
    }
  })
  return opening
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

function asWish(value: unknown): Wish | null {
  if (!value || typeof value !== 'object') return null
  const row = value as Partial<Wish>
  if (typeof row.id !== 'string' || typeof row.title !== 'string' || typeof row.at !== 'string') return null
  return {
    id: row.id,
    title: row.title,
    note: typeof row.note === 'string' ? row.note : '',
    at: row.at,
    accent: typeof row.accent === 'string' && row.accent ? row.accent : DEFAULT_ACCENT,
    imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : '',
    imageWidth: typeof row.imageWidth === 'number' ? row.imageWidth : 0,
    imageHeight: typeof row.imageHeight === 'number' ? row.imageHeight : 0,
    createdAt: typeof row.createdAt === 'number' ? row.createdAt : Date.now(),
    updatedAt: typeof row.updatedAt === 'number' ? row.updatedAt : Date.now(),
  }
}

export async function listWishes(): Promise<Wish[]> {
  const db = await openDb()
  const tx = db.transaction('wishes', 'readonly')
  const request = tx.objectStore('wishes').getAll()
  const rows = await new Promise<unknown[]>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as unknown[])
    request.onerror = () => reject(request.error)
  })
  return rows.map(asWish).filter((wish): wish is Wish => wish !== null)
}

export async function putWish(wish: Wish): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('wishes', 'readwrite')
  tx.objectStore('wishes').put(wish)
  await done(tx)
}

export async function getImage(id: string): Promise<Blob | null> {
  const db = await openDb()
  const tx = db.transaction('images', 'readonly')
  const request = tx.objectStore('images').get(id)
  const result = await new Promise<unknown>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return result instanceof Blob ? result : null
}

export async function putImage(id: string, blob: Blob): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('images', 'readwrite')
  tx.objectStore('images').put(blob, id)
  await done(tx)
}

export async function deleteImage(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction('images', 'readwrite')
  tx.objectStore('images').delete(id)
  await done(tx)
}

export async function deleteWish(id: string): Promise<void> {
  const db = await openDb()
  const tx = db.transaction(['wishes', 'images'], 'readwrite')
  tx.objectStore('wishes').delete(id)
  tx.objectStore('images').delete(id)
  await done(tx)
}
