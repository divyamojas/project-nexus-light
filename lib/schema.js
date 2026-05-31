import { apiFetch } from './api.js'

export function getSchemaSnapshot() {
  return apiFetch('/schema/snapshot')
}

export function refreshSchema() {
  return apiFetch('/schema/refresh', { method: 'POST' })
}

export function executeSql(sql) {
  return apiFetch('/schema/sql', {
    method: 'POST',
    body: JSON.stringify({ sql }),
  })
}

export function addColumn(tableName, data) {
  return apiFetch(`/schema/tables/${encodeURIComponent(tableName)}/columns`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function dropColumn(tableName, columnName) {
  return apiFetch(
    `/schema/tables/${encodeURIComponent(tableName)}/columns/${encodeURIComponent(columnName)}`,
    { method: 'DELETE' }
  )
}

export function toggleRLS(tableName, enabled) {
  return apiFetch(`/schema/tables/${encodeURIComponent(tableName)}/rls`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  })
}

export function createRLSPolicy(data) {
  return apiFetch('/schema/rls', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateRLSPolicy(tableName, policyName, data) {
  return apiFetch(
    `/schema/rls/${encodeURIComponent(tableName)}/${encodeURIComponent(policyName)}`,
    { method: 'PUT', body: JSON.stringify(data) }
  )
}

export function deleteRLSPolicy(tableName, policyName) {
  return apiFetch(
    `/schema/rls/${encodeURIComponent(tableName)}/${encodeURIComponent(policyName)}`,
    { method: 'DELETE' }
  )
}

export function upsertFunction(definition) {
  return apiFetch('/schema/functions', {
    method: 'POST',
    body: JSON.stringify({ definition }),
  })
}

export function dropFunction(schemaName, functionName) {
  return apiFetch(
    `/schema/functions/${encodeURIComponent(schemaName)}/${encodeURIComponent(functionName)}`,
    { method: 'DELETE' }
  )
}

export function createIndex(tableName, data) {
  return apiFetch(`/schema/tables/${encodeURIComponent(tableName)}/indexes`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function dropIndex(indexName) {
  return apiFetch(`/schema/indexes/${encodeURIComponent(indexName)}`, { method: 'DELETE' })
}
