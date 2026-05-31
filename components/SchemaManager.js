'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getSchemaSnapshot,
  refreshSchema,
  executeSql,
  addColumn,
  dropColumn,
  toggleRLS,
  createRLSPolicy,
  updateRLSPolicy,
  deleteRLSPolicy,
  upsertFunction,
  dropFunction,
  createIndex,
  dropIndex,
} from '../lib/schema.js'

const SUB_TABS = ['Tables', 'RLS Policies', 'Functions', 'SQL Console']

export function SchemaManager({ toast }) {
  const [activeTab, setActiveTab] = useState('Tables')
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadSnapshot = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSchemaSnapshot()
      setSnapshot(data)
    } catch (err) {
      toast({ message: `Failed to load schema: ${err.message}`, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadSnapshot() }, [loadSnapshot])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await refreshSchema()
      await loadSnapshot()
      toast({ message: 'Schema snapshot refreshed', type: 'success' })
    } catch (err) {
      toast({ message: `Refresh failed: ${err.message}`, type: 'error' })
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {SUB_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-violet-600 text-white dark:bg-violet-500'
                  : 'text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
        >
          <span className={refreshing ? 'inline-block animate-spin' : ''}>↻</span>
          {refreshing ? 'Refreshing…' : 'Refresh Snapshot'}
        </button>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-stone-500 dark:text-slate-400 text-sm animate-pulse">
          Loading schema…
        </div>
      ) : !snapshot ? (
        <div className="card p-10 text-center text-stone-500 dark:text-slate-400 text-sm">
          Snapshot unavailable — click Refresh Snapshot.
        </div>
      ) : (
        <>
          {activeTab === 'Tables'       && <TablesPanel    snapshot={snapshot} toast={toast} onRefresh={loadSnapshot} />}
          {activeTab === 'RLS Policies' && <RLSPanel       snapshot={snapshot} toast={toast} onRefresh={loadSnapshot} />}
          {activeTab === 'Functions'    && <FunctionsPanel snapshot={snapshot} toast={toast} onRefresh={loadSnapshot} />}
          {activeTab === 'SQL Console'  && <SQLConsole     toast={toast} />}
        </>
      )}
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function groupBy(items, key) {
  const out = {}
  for (const item of items) {
    const k = item[key]
    if (!out[k]) out[k] = []
    out[k].push(item)
  }
  return out
}

// ─── Tables ──────────────────────────────────────────────────────────────────

const BLANK_COL = { column_name: '', data_type: 'text', nullable: true, default: '' }

function TablesPanel({ snapshot, toast, onRefresh }) {
  const [expanded, setExpanded]     = useState({})
  const [busy, setBusy]             = useState({})
  const [addColTable, setAddColTable] = useState(null)
  const [newCol, setNewCol]         = useState(BLANK_COL)

  const colsByTable = groupBy(snapshot.columns || [], 'table_name')
  const rlsByTable  = groupBy(snapshot.rls_policies || [], 'table_name')
  const idxByTable  = groupBy(snapshot.indexes || [], 'table_name')
  const tables = (snapshot.tables || []).filter(
    t => t.table_schema === 'public' && t.table_type === 'BASE TABLE'
  )

  function toggle(name) {
    setExpanded(p => ({ ...p, [name]: !p[name] }))
  }

  async function handleToggleRLS(tableName, current) {
    const key = `${tableName}__rls`
    setBusy(p => ({ ...p, [key]: true }))
    try {
      await toggleRLS(tableName, !current)
      await onRefresh()
      toast({ message: `RLS ${!current ? 'enabled' : 'disabled'} on ${tableName}`, type: 'success' })
    } catch (err) {
      toast({ message: err.message, type: 'error' })
    } finally {
      setBusy(p => ({ ...p, [key]: false }))
    }
  }

  async function handleDropCol(tableName, colName) {
    if (!confirm(`Drop column "${colName}" from "${tableName}"? This cannot be undone.`)) return
    const key = `${tableName}__${colName}`
    setBusy(p => ({ ...p, [key]: true }))
    try {
      await dropColumn(tableName, colName)
      await onRefresh()
      toast({ message: `Column "${colName}" dropped`, type: 'success' })
    } catch (err) {
      toast({ message: err.message, type: 'error' })
    } finally {
      setBusy(p => ({ ...p, [key]: false }))
    }
  }

  async function handleAddCol() {
    if (!newCol.column_name.trim() || !newCol.data_type.trim()) {
      toast({ message: 'Column name and type are required', type: 'error' })
      return
    }
    setBusy(p => ({ ...p, addCol: true }))
    try {
      await addColumn(addColTable, {
        column_name: newCol.column_name.trim(),
        data_type:   newCol.data_type.trim(),
        nullable:    newCol.nullable,
        default:     newCol.default.trim() || null,
      })
      await onRefresh()
      toast({ message: `Column "${newCol.column_name}" added`, type: 'success' })
      setAddColTable(null)
      setNewCol(BLANK_COL)
    } catch (err) {
      toast({ message: err.message, type: 'error' })
    } finally {
      setBusy(p => ({ ...p, addCol: false }))
    }
  }

  if (!tables.length) return (
    <div className="card p-8 text-center text-stone-500 dark:text-slate-400 text-sm">
      No base tables found in public schema.
    </div>
  )

  return (
    <div className="flex flex-col gap-2">
      {tables.map(table => {
        const cols     = colsByTable[table.table_name]  || []
        const policies = rlsByTable[table.table_name]   || []
        const indexes  = idxByTable[table.table_name]   || []
        const isOpen   = expanded[table.table_name]

        return (
          <div key={table.table_name} className="card overflow-hidden">
            {/* row header */}
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-700/30 select-none"
              onClick={() => toggle(table.table_name)}
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {table.table_name}
                </span>
                <span className="text-xs text-stone-400 dark:text-slate-500">
                  {cols.length} col{cols.length !== 1 ? 's' : ''}
                </span>
                {indexes.length > 0 && (
                  <span className="text-xs text-stone-400 dark:text-slate-500">
                    {indexes.length} idx
                  </span>
                )}
                {policies.length > 0 && (
                  <span className="badge badge-blue text-xs">{policies.length} policies</span>
                )}
                {table.rls_enabled && (
                  <span className="badge badge-green text-xs">RLS ON</span>
                )}
              </div>

              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => handleToggleRLS(table.table_name, table.rls_enabled)}
                  disabled={busy[`${table.table_name}__rls`]}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-40 px-2 py-1 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20"
                >
                  {table.rls_enabled ? 'Disable RLS' : 'Enable RLS'}
                </button>
                <button
                  onClick={() => { setAddColTable(table.table_name); setNewCol(BLANK_COL) }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                >
                  + Column
                </button>
                <span className="text-stone-400 dark:text-slate-500 text-xs pl-1">
                  {isOpen ? '▲' : '▼'}
                </span>
              </div>
            </div>

            {/* expanded: columns + indexes */}
            {isOpen && (
              <div className="border-t border-stone-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead className="bg-stone-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="text-left px-4 py-2 text-stone-500 dark:text-slate-400 font-medium">Column</th>
                      <th className="text-left px-4 py-2 text-stone-500 dark:text-slate-400 font-medium">Type</th>
                      <th className="text-left px-4 py-2 text-stone-500 dark:text-slate-400 font-medium">Nullable</th>
                      <th className="text-left px-4 py-2 text-stone-500 dark:text-slate-400 font-medium hidden sm:table-cell">Default</th>
                      <th className="text-right px-4 py-2 text-stone-500 dark:text-slate-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-slate-700/60">
                    {cols.map(col => (
                      <tr key={col.column_name} className="hover:bg-stone-50 dark:hover:bg-slate-700/20">
                        <td className="px-4 py-2 font-mono font-medium text-slate-800 dark:text-slate-200">
                          {col.column_name}
                        </td>
                        <td className="px-4 py-2 font-mono text-violet-600 dark:text-violet-400">
                          {col.udt_name || col.data_type}
                        </td>
                        <td className="px-4 py-2 text-stone-500 dark:text-slate-400">
                          {col.is_nullable === 'YES'
                            ? 'YES'
                            : <span className="text-amber-600 dark:text-amber-400 font-medium">NO</span>
                          }
                        </td>
                        <td className="px-4 py-2 font-mono text-stone-400 dark:text-slate-500 truncate max-w-[160px] hidden sm:table-cell">
                          {col.column_default || '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() => handleDropCol(table.table_name, col.column_name)}
                            disabled={busy[`${table.table_name}__${col.column_name}`]}
                            className="text-red-500 dark:text-red-400 hover:underline disabled:opacity-40"
                          >
                            Drop
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {indexes.length > 0 && (
                  <div className="border-t border-stone-100 dark:border-slate-700/60 px-4 py-3 bg-stone-50/50 dark:bg-slate-900/30">
                    <p className="text-xs font-medium text-stone-500 dark:text-slate-400 mb-2">Indexes</p>
                    <div className="flex flex-col gap-1">
                      {indexes.map(idx => (
                        <div key={idx.indexname} className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-300 truncate">{idx.indexname}</span>
                          <button
                            onClick={() => {
                              if (!confirm(`Drop index "${idx.indexname}"?`)) return
                              setBusy(p => ({ ...p, [idx.indexname]: true }))
                              dropIndex(idx.indexname)
                                .then(onRefresh)
                                .then(() => toast({ message: `Index "${idx.indexname}" dropped`, type: 'success' }))
                                .catch(err => toast({ message: err.message, type: 'error' }))
                                .finally(() => setBusy(p => ({ ...p, [idx.indexname]: false })))
                            }}
                            disabled={busy[idx.indexname]}
                            className="text-xs text-red-500 dark:text-red-400 hover:underline flex-shrink-0 disabled:opacity-40"
                          >
                            Drop
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {addColTable && (
        <Modal title={`Add Column — ${addColTable}`} onClose={() => setAddColTable(null)}>
          <div className="flex flex-col gap-4">
            <Field label="Column Name">
              <input
                className="input-field"
                value={newCol.column_name}
                onChange={e => setNewCol(p => ({ ...p, column_name: e.target.value }))}
                placeholder="e.g. display_name"
                autoFocus
              />
            </Field>
            <Field label="Data Type">
              <input
                className="input-field"
                value={newCol.data_type}
                onChange={e => setNewCol(p => ({ ...p, data_type: e.target.value }))}
                placeholder="e.g. text, integer, boolean, uuid, timestamptz"
              />
            </Field>
            <Field label="Default Value (optional SQL expression)">
              <input
                className="input-field"
                value={newCol.default}
                onChange={e => setNewCol(p => ({ ...p, default: e.target.value }))}
                placeholder="e.g. now(), false, gen_random_uuid()"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newCol.nullable}
                onChange={e => setNewCol(p => ({ ...p, nullable: e.target.checked }))}
                className="rounded accent-violet-600"
              />
              <span className="text-slate-700 dark:text-slate-300">Allow NULL</span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn-secondary text-sm" onClick={() => setAddColTable(null)}>Cancel</button>
              <button className="btn-primary text-sm" onClick={handleAddCol} disabled={busy.addCol}>
                {busy.addCol ? 'Adding…' : 'Add Column'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── RLS Policies ────────────────────────────────────────────────────────────

const COMMANDS  = ['ALL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE']
const BLANK_POL = {
  table_name: '', policy_name: '',
  permissive: 'PERMISSIVE', command: 'ALL',
  roles: [], using: '', with_check: '',
}
const CMD_MAP = { r: 'SELECT', a: 'INSERT', w: 'UPDATE', d: 'DELETE', '*': 'ALL' }

function RLSPanel({ snapshot, toast, onRefresh }) {
  const [filter, setFilter]       = useState('')
  const [busy, setBusy]           = useState({})
  const [modal, setModal]         = useState(null) // null | 'create' | policy
  const [form, setForm]           = useState(BLANK_POL)

  const tables = (snapshot.tables || [])
    .filter(t => t.table_schema === 'public' && t.table_type === 'BASE TABLE')
    .map(t => t.table_name).sort()

  const policies = (snapshot.rls_policies || []).filter(
    p => !filter || p.table_name === filter
  )

  function openCreate() {
    setForm({ ...BLANK_POL, table_name: filter })
    setModal('create')
  }

  function openEdit(pol) {
    setForm({
      table_name:  pol.table_name,
      policy_name: pol.policyname,
      permissive:  (pol.permissive || 'PERMISSIVE').toUpperCase(),
      command:     CMD_MAP[(pol.cmd || '*').toLowerCase()] || 'ALL',
      roles:       pol.roles || [],
      using:       pol.qual || '',
      with_check:  pol.with_check || '',
    })
    setModal(pol)
  }

  async function handleDelete(pol) {
    if (!confirm(`Drop policy "${pol.policyname}" on "${pol.table_name}"?`)) return
    const key = `${pol.table_name}__${pol.policyname}`
    setBusy(p => ({ ...p, [key]: true }))
    try {
      await deleteRLSPolicy(pol.table_name, pol.policyname)
      await onRefresh()
      toast({ message: 'Policy deleted', type: 'success' })
    } catch (err) {
      toast({ message: err.message, type: 'error' })
    } finally {
      setBusy(p => ({ ...p, [key]: false }))
    }
  }

  async function handleSave() {
    setBusy(p => ({ ...p, saving: true }))
    try {
      if (modal === 'create') {
        await createRLSPolicy({ ...form, using: form.using || null, with_check: form.with_check || null })
        toast({ message: 'Policy created', type: 'success' })
      } else {
        await updateRLSPolicy(modal.table_name, modal.policyname, {
          permissive:  form.permissive,
          command:     form.command,
          roles:       form.roles,
          using:       form.using || null,
          with_check:  form.with_check || null,
        })
        toast({ message: 'Policy updated', type: 'success' })
      }
      await onRefresh()
      setModal(null)
    } catch (err) {
      toast({ message: err.message, type: 'error' })
    } finally {
      setBusy(p => ({ ...p, saving: false }))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input-field py-1.5 text-sm w-auto min-w-[200px]"
        >
          <option value="">All tables</option>
          {tables.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={openCreate} className="btn-primary text-sm py-1.5">+ New Policy</button>
      </div>

      {policies.length === 0 ? (
        <div className="card p-8 text-center text-stone-500 dark:text-slate-400 text-sm">
          No RLS policies{filter ? ` on "${filter}"` : ''}.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 dark:bg-slate-900/50 border-b border-stone-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Table</th>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Policy</th>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Cmd</th>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-stone-500 dark:text-slate-400 font-medium hidden md:table-cell">USING</th>
                <th className="text-right px-4 py-3 text-stone-500 dark:text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
              {policies.map(pol => {
                const key = `${pol.table_name}__${pol.policyname}`
                return (
                  <tr key={key} className="hover:bg-stone-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{pol.table_name}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{pol.policyname}</td>
                    <td className="px-4 py-3 text-xs uppercase text-stone-500 dark:text-slate-400">
                      {CMD_MAP[(pol.cmd || '*').toLowerCase()] || pol.cmd}
                    </td>
                    <td className="px-4 py-3">
                      <span className={
                        (pol.permissive || '').toUpperCase() === 'PERMISSIVE'
                          ? 'badge badge-green'
                          : 'badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }>
                        {pol.permissive}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-400 dark:text-slate-500 max-w-[200px] truncate hidden md:table-cell">
                      {pol.qual || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => openEdit(pol)} className="text-xs text-violet-600 dark:text-violet-400 hover:underline">Edit</button>
                        <button
                          onClick={() => handleDelete(pol)}
                          disabled={busy[key]}
                          className="text-xs text-red-500 dark:text-red-400 hover:underline disabled:opacity-40"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <Modal
          title={modal === 'create' ? 'New RLS Policy' : `Edit Policy — ${modal.policyname}`}
          onClose={() => setModal(null)}
          wide
        >
          <div className="flex flex-col gap-4">
            {modal === 'create' && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Table">
                  <select
                    className="input-field"
                    value={form.table_name}
                    onChange={e => setForm(p => ({ ...p, table_name: e.target.value }))}
                  >
                    <option value="">Select table…</option>
                    {tables.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Policy Name">
                  <input
                    className="input-field"
                    value={form.policy_name}
                    onChange={e => setForm(p => ({ ...p, policy_name: e.target.value }))}
                    placeholder="e.g. users_select_own"
                  />
                </Field>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Command">
                <select className="input-field" value={form.command} onChange={e => setForm(p => ({ ...p, command: e.target.value }))}>
                  {COMMANDS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Type">
                <select className="input-field" value={form.permissive} onChange={e => setForm(p => ({ ...p, permissive: e.target.value }))}>
                  <option value="PERMISSIVE">PERMISSIVE</option>
                  <option value="RESTRICTIVE">RESTRICTIVE</option>
                </select>
              </Field>
            </div>
            <Field label="Roles (comma-separated; blank = PUBLIC)">
              <input
                className="input-field"
                value={form.roles.join(', ')}
                onChange={e => setForm(p => ({
                  ...p,
                  roles: e.target.value.split(',').map(r => r.trim()).filter(Boolean),
                }))}
                placeholder="e.g. authenticated, anon"
              />
            </Field>
            <Field label="USING expression">
              <textarea
                className="input-field font-mono text-xs"
                rows={3}
                value={form.using}
                onChange={e => setForm(p => ({ ...p, using: e.target.value }))}
                placeholder="e.g. auth.uid() = user_id"
                spellCheck={false}
              />
            </Field>
            <Field label="WITH CHECK expression">
              <textarea
                className="input-field font-mono text-xs"
                rows={3}
                value={form.with_check}
                onChange={e => setForm(p => ({ ...p, with_check: e.target.value }))}
                placeholder="e.g. auth.uid() = user_id"
                spellCheck={false}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn-secondary text-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary text-sm" onClick={handleSave} disabled={busy.saving}>
                {busy.saving ? 'Saving…' : 'Save Policy'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── Functions ───────────────────────────────────────────────────────────────

const NEW_FUNC_TEMPLATE = `CREATE OR REPLACE FUNCTION public.my_function()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- function body
END;
$$;`

function FunctionsPanel({ snapshot, toast, onRefresh }) {
  const [expanded, setExpanded] = useState({})
  const [busy, setBusy]         = useState({})
  const [modal, setModal]       = useState(null) // null | 'create' | fn
  const [definition, setDef]    = useState('')

  const functions = (snapshot.functions || []).filter(
    f => ['public', 'extensions'].includes(f.function_schema)
  )

  function toggle(key) {
    setExpanded(p => ({ ...p, [key]: !p[key] }))
  }

  async function handleDrop(fn) {
    if (!confirm(`Drop function "${fn.function_schema}.${fn.function_name}"?`)) return
    const key = `${fn.function_schema}__${fn.function_name}`
    setBusy(p => ({ ...p, [key]: true }))
    try {
      await dropFunction(fn.function_schema, fn.function_name)
      await onRefresh()
      toast({ message: `Function "${fn.function_name}" dropped`, type: 'success' })
    } catch (err) {
      toast({ message: err.message, type: 'error' })
    } finally {
      setBusy(p => ({ ...p, [key]: false }))
    }
  }

  async function handleSave() {
    if (!definition.trim()) {
      toast({ message: 'Definition cannot be empty', type: 'error' })
      return
    }
    setBusy(p => ({ ...p, saving: true }))
    try {
      await upsertFunction(definition)
      await onRefresh()
      toast({ message: 'Function saved', type: 'success' })
      setModal(null)
    } catch (err) {
      toast({ message: err.message, type: 'error' })
    } finally {
      setBusy(p => ({ ...p, saving: false }))
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <button
          onClick={() => { setDef(NEW_FUNC_TEMPLATE); setModal('create') }}
          className="btn-primary text-sm py-1.5"
        >
          + New Function
        </button>
      </div>

      {functions.length === 0 ? (
        <div className="card p-8 text-center text-stone-500 dark:text-slate-400 text-sm">
          No functions in public/extensions schema.
        </div>
      ) : functions.map(fn => {
        const key = `${fn.function_schema}.${fn.function_name}`
        return (
          <div key={key} className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-stone-50 dark:hover:bg-slate-700/30 select-none"
              onClick={() => toggle(key)}
            >
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {fn.function_name}
                </span>
                <span className="text-xs text-stone-400 dark:text-slate-500">{fn.function_schema}</span>
                <span className="badge badge-blue text-xs">{fn.language}</span>
                {fn.security_definer && (
                  <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                    SECURITY DEFINER
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => { setDef(fn.definition || ''); setModal(fn) }}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline px-2 py-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDrop(fn)}
                  disabled={busy[key]}
                  className="text-xs text-red-500 dark:text-red-400 hover:underline disabled:opacity-40 px-2 py-1"
                >
                  Drop
                </button>
                <span className="text-stone-400 text-xs pl-1">{expanded[key] ? '▲' : '▼'}</span>
              </div>
            </div>

            {expanded[key] && (
              <div className="border-t border-stone-200 dark:border-slate-700 bg-stone-50/50 dark:bg-slate-900/30">
                <div className="px-4 py-2 flex gap-4 text-xs text-stone-500 dark:text-slate-400">
                  <span><span className="font-medium">Returns:</span> {fn.result_type}</span>
                  <span><span className="font-medium">Args:</span> {fn.arguments || 'none'}</span>
                </div>
                <pre className="px-4 pb-4 text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {fn.definition}
                </pre>
              </div>
            )}
          </div>
        )
      })}

      {modal !== null && (
        <Modal
          title={modal === 'create' ? 'New Function' : `Edit — ${modal.function_name}`}
          onClose={() => setModal(null)}
          wide
        >
          <div className="flex flex-col gap-4">
            <Field label="Function DDL (CREATE OR REPLACE FUNCTION …)">
              <textarea
                className="input-field font-mono text-xs leading-relaxed"
                rows={18}
                value={definition}
                onChange={e => setDef(e.target.value)}
                spellCheck={false}
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn-secondary text-sm" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary text-sm" onClick={handleSave} disabled={busy.saving}>
                {busy.saving ? 'Saving…' : 'Save Function'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── SQL Console ─────────────────────────────────────────────────────────────

function SQLConsole({ toast }) {
  const [sql, setSql]     = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleExecute() {
    if (!sql.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)
    try {
      const res = await executeSql(sql)
      setResult(res)
      toast({
        message: `Query OK — ${res.count} row${res.count !== 1 ? 's' : ''}`,
        type: 'success',
      })
    } catch (err) {
      setError(err.message)
      toast({ message: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const cols = result?.rows?.[0] ? Object.keys(result.rows[0]) : []

  return (
    <div className="flex flex-col gap-4">
      <div className="card overflow-hidden">
        <div className="p-4 flex flex-col gap-3">
          <textarea
            className="input-field font-mono text-sm leading-relaxed"
            rows={8}
            value={sql}
            onChange={e => setSql(e.target.value)}
            placeholder="SELECT * FROM public.profiles LIMIT 10;"
            spellCheck={false}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-stone-400 dark:text-slate-500">
              SELECT, INSERT, UPDATE, DELETE, DDL — runs as service role
            </p>
            <button
              onClick={handleExecute}
              disabled={loading || !sql.trim()}
              className="btn-primary text-sm py-2 px-6 disabled:opacity-50"
            >
              {loading ? 'Running…' : 'Execute'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-4 border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <p className="text-sm font-mono text-red-700 dark:text-red-300 whitespace-pre-wrap">{error}</p>
        </div>
      )}

      {result && (
        <div className="card overflow-hidden">
          <div className="px-4 py-2 border-b border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-900/50 flex items-center justify-between">
            <span className="text-xs text-stone-500 dark:text-slate-400">
              {result.count} row{result.count !== 1 ? 's' : ''}
            </span>
          </div>
          {cols.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-stone-50 dark:bg-slate-900/50 border-b border-stone-200 dark:border-slate-700">
                  <tr>
                    {cols.map(c => (
                      <th key={c} className="text-left px-3 py-2 font-mono text-stone-500 dark:text-slate-400 font-medium whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
                  {result.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-stone-50 dark:hover:bg-slate-700/20">
                      {cols.map(c => (
                        <td key={c} className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300 max-w-[240px] truncate">
                          {row[c] === null
                            ? <span className="italic text-stone-400 dark:text-slate-500">null</span>
                            : String(row[c])
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-4 py-3 text-xs text-stone-500 dark:text-slate-400">
              Query executed — no rows returned.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Shared primitives ───────────────────────────────────────────────────────

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full flex flex-col max-h-[90vh] ${
          wide ? 'max-w-2xl' : 'max-w-md'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-slate-700 flex-shrink-0">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          <button
            onClick={onClose}
            className="text-stone-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-stone-600 dark:text-slate-400">{label}</label>
      {children}
    </div>
  )
}

export default SchemaManager
