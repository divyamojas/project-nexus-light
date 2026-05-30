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
