const DB_NAME = 'pour-offline-v1'
const DB_VERSION = 1

const STORES = {
  requests: 'requests',
  details: 'details',
  listSnapshots: 'listSnapshots',
  mutations: 'mutations',
} as const

type StoreName = (typeof STORES)[keyof typeof STORES]

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORES.requests)) {
        db.createObjectStore(STORES.requests, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.details)) {
        db.createObjectStore(STORES.details, { keyPath: 'requestId' })
      }
      if (!db.objectStoreNames.contains(STORES.listSnapshots)) {
        db.createObjectStore(STORES.listSnapshots, { keyPath: 'cacheKey' })
      }
      if (!db.objectStoreNames.contains(STORES.mutations)) {
        const mut = db.createObjectStore(STORES.mutations, { keyPath: 'id' })
        mut.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }
  })
  return dbPromise
}

export async function idbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function idbPut<T extends { id?: string; cacheKey?: string; requestId?: string }>(
  store: StoreName,
  value: T,
): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function idbDelete(store: StoreName, key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve((req.result ?? []) as T[])
    req.onerror = () => reject(req.error)
  })
}

export async function idbClearStore(store: StoreName): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    tx.objectStore(store).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export { STORES }
