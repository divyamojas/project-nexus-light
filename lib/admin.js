import { apiFetch } from './api.js'

export async function getStats() {
  return apiFetch('/admin/stats')
}

export async function getUsers() {
  return apiFetch('/admin/users')
}

export async function updateUserRole(id, role) {
  return apiFetch(`/admin/users/${id}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  })
}

export async function updateUserApproval(id, approval_status) {
  return apiFetch(`/admin/users/${id}/approval`, {
    method: 'PUT',
    body: JSON.stringify({ approval_status }),
  })
}

export async function deleteUser(id) {
  return apiFetch(`/admin/users/${id}`, { method: 'DELETE' })
}

export async function getAdminBooks() {
  return apiFetch('/admin/books')
}

export async function toggleBookArchive(id, archived) {
  return apiFetch(`/admin/books/${id}/archive`, {
    method: 'PATCH',
    body: JSON.stringify({ archived }),
  })
}

export async function getAdminRequests() {
  return apiFetch('/admin/requests')
}

export async function updateRequestStatus(id, status) {
  return apiFetch(`/admin/requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export async function getAdminLoans() {
  return apiFetch('/admin/loans')
}

export async function completeLoan(id) {
  return apiFetch(`/admin/loans/${id}/complete`, { method: 'POST' })
}

export async function getRequestLogs({ limit = 100, offset = 0, method, path, status_gte, status_lte, user_id } = {}) {
  const p = new URLSearchParams({ limit, offset })
  if (method)      p.set('method', method)
  if (path)        p.set('path', path)
  if (status_gte != null) p.set('status_gte', status_gte)
  if (status_lte != null) p.set('status_lte', status_lte)
  if (user_id)     p.set('user_id', user_id)
  return apiFetch(`/admin/logs?${p}`)
}

export async function getRequestLogStats() {
  return apiFetch('/admin/logs/stats')
}
