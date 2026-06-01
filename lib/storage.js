// Persistent storage for form drafts only.
// All server-data caching (books, profile, requests, etc.) is handled by SWR.
const DB_NAME = 'leaflet-db'
const DB_VERSION = 3  // bumped from 2; old stores are dropped on upgrade

function isSSR() {
  return typeof window === 'undefined'
}

let _dbPromise = null

function openDB() {
  if (isSSR()) return Promise.resolve(null)
  if (!_dbPromise) {
    _dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        // Drop legacy stores from previous versions
        for (const name of ['books', 'profile', 'cache']) {
          if (db.objectStoreNames.contains(name)) db.deleteObjectStore(name)
        }
        if (!db.objectStoreNames.contains('drafts')) {
          db.createObjectStore('drafts', { keyPath: 'key' })
        }
      }
      request.onsuccess = (event) => resolve(event.target.result)
      request.onerror = (event) => {
        _dbPromise = null
        reject(event.target.error)
      }
    })
  }
  return _dbPromise
}

export async function saveDraft(key, data) {
  if (isSSR()) return
  try {
    const db = await openDB()
    if (!db) return
    await new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite')
      const req = tx.objectStore('drafts').put({ key, data, savedAt: Date.now() })
      req.onsuccess = resolve
      req.onerror = reject
    })
  } catch (err) {
    console.warn('[storage] saveDraft error:', err)
  }
}

export async function getDraft(key) {
  if (isSSR()) return null
  try {
    const db = await openDB()
    if (!db) return null
    return new Promise((resolve) => {
      const tx = db.transaction('drafts', 'readonly')
      const req = tx.objectStore('drafts').get(key)
      req.onsuccess = () => resolve(req.result?.data || null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function clearDraft(key) {
  if (isSSR()) return
  try {
    const db = await openDB()
    if (!db) return
    await new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite')
      const req = tx.objectStore('drafts').delete(key)
      req.onsuccess = resolve
      req.onerror = reject
    })
  } catch (err) {
    console.warn('[storage] clearDraft error:', err)
  }
}

export async function clearAll() {
  if (isSSR()) return
  try {
    const db = await openDB()
    if (!db) return
    await new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite')
      tx.objectStore('drafts').clear()
      tx.oncomplete = resolve
      tx.onerror = reject
    })
  } catch (err) {
    console.warn('[storage] clearAll error:', err)
  }
}
