import { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, RefreshCw, AlertCircle, Search, Filter } from 'lucide-react'
import { getAuditLog } from '../services/api.js'

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(dateStr).toLocaleString()
}

const ACTION_BADGE = {
  create: 'bg-blue-100 text-blue-700',
  submit: 'bg-indigo-100 text-indigo-700',
  review: 'bg-purple-100 text-purple-700',
  approve: 'bg-green-100 text-green-700',
  reject: 'bg-red-100 text-red-700',
  return: 'bg-amber-100 text-amber-700',
  update: 'bg-gray-100 text-gray-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-teal-100 text-teal-700',
}

export default function AuditLog() {
  const [events, setEvents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await getAuditLog()
      const arr = Array.isArray(data) ? data : data.events || data.audit || []
      setEvents(arr)
    } catch (e) {
      setError(e.message || 'Failed to load audit log.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = events.filter(e => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      (e.action || '').toLowerCase().includes(s) ||
      (e.actor_name || e.user_name || '').toLowerCase().includes(s) ||
      (e.entity_type || '').toLowerCase().includes(s) ||
      (e.description || '').toLowerCase().includes(s)
    )
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">{events.length} events recorded</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events, actors, actions…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                    No audit events found.
                  </td>
                </tr>
              ) : (
                filtered.map((e, i) => {
                  const action = (e.action || e.event_type || '').toLowerCase()
                  const badgeCls = Object.entries(ACTION_BADGE).find(([k]) => action.includes(k))?.[1] || 'bg-gray-100 text-gray-600'
                  return (
                    <tr key={e.id || i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        <span title={new Date(e.created_at).toLocaleString()}>{timeAgo(e.created_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(e.actor_name || e.user_name || 'S')[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-900 whitespace-nowrap">{e.actor_name || e.user_name || 'System'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${badgeCls}`}>
                          {e.action || e.event_type || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {e.entity_type && <span className="font-medium">{e.entity_type}</span>}
                        {e.entity_id && <span className="text-gray-400"> #{e.entity_id}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {e.description || e.details || '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
