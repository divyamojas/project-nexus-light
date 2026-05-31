import { apiFetch } from './api.js'

export async function getLibraries() {
  return apiFetch('/library')
}

export async function createLibrary(data) {
  return apiFetch('/library', { method: 'POST', body: JSON.stringify(data) })
}

export async function getLibrary(id) {
  return apiFetch(`/library/${id}`)
}

export async function addBookToLibrary(libraryId, data) {
  return apiFetch(`/library/${libraryId}/books`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function removeBookFromLibrary(libraryId, bookId) {
  return apiFetch(`/library/${libraryId}/books/${bookId}`, { method: 'DELETE' })
}

export async function pickupLibraryBook(bookId) {
  return apiFetch(`/library/books/${bookId}/pickup`, { method: 'POST' })
}

export async function reserveLibraryBook(bookId, message) {
  return apiFetch('/requests', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId, ...(message ? { message } : {}) }),
  })
}

export async function returnLibraryBook(bookId) {
  return apiFetch('/returns', {
    method: 'POST',
    body: JSON.stringify({ book_id: bookId }),
  })
}
