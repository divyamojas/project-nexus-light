const DB_NAME = 'leaflet-db'
const DB_VERSION = 1

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
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' })
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

async function withStore(storeName, mode, callback) {
  if (isSSR()) return null
  try {
    const db = await openDB()
    if (!db) return null
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode)
      const store = tx.objectStore(storeName)
      const result = callback(store)
      result.onsuccess = () => resolve(result.result)
      result.onerror = () => reject(result.error)
    })
  } catch (err) {
    console.warn('[storage]', storeName, err)
    return null
  }
}

export async function cacheBooks(books) {
  if (isSSR() || !Array.isArray(books)) return
  try {
    const db = await openDB()
    if (!db) return
    await new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readwrite')
      const store = tx.objectStore('books')
      store.clear()
      books.forEach(book => store.put(book))
      tx.oncomplete = resolve
      tx.onerror = reject
    })
  } catch (err) {
    console.warn('[storage] cacheBooks error:', err)
  }
}

export async function getCachedBooks() {
  if (isSSR()) return []
  try {
    const db = await openDB()
    if (!db) return []
    return new Promise((resolve, reject) => {
      const tx = db.transaction('books', 'readonly')
      const store = tx.objectStore('books')
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => resolve([])
    })
  } catch {
    return []
  }
}

export async function cacheProfile(profile) {
  if (isSSR() || !profile) return
  try {
    const db = await openDB()
    if (!db) return
    await new Promise((resolve, reject) => {
      const tx = db.transaction('profile', 'readwrite')
      const store = tx.objectStore('profile')
      store.clear()
      store.put(profile)
      tx.oncomplete = resolve
      tx.onerror = reject
    })
  } catch (err) {
    console.warn('[storage] cacheProfile error:', err)
  }
}

export async function getCachedProfile() {
  if (isSSR()) return null
  try {
    const db = await openDB()
    if (!db) return null
    return new Promise((resolve, reject) => {
      const tx = db.transaction('profile', 'readonly')
      const store = tx.objectStore('profile')
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result?.[0] || null)
      req.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export async function saveDraft(key, data) {
  if (isSSR()) return
  try {
    const db = await openDB()
    if (!db) return
    await new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite')
      const store = tx.objectStore('drafts')
      const req = store.put({ key, data, savedAt: Date.now() })
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
      const store = tx.objectStore('drafts')
      const req = store.get(key)
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
    await withStore('drafts', 'readwrite', store => store.delete(key))
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
      const tx = db.transaction(['books', 'profile', 'drafts'], 'readwrite')
      tx.objectStore('books').clear()
      tx.objectStore('profile').clear()
      tx.objectStore('drafts').clear()
      tx.oncomplete = resolve
      tx.onerror = reject
    })
  } catch (err) {
    console.warn('[storage] clearAll error:', err)
  }
}
