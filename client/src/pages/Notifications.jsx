import { useState, useEffect, useCallback } from 'react'
import { Bell, RefreshCw, CheckCheck, AlertCircle, Mail, MailOpen, Loader2 } from 'lucide-react'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/api.js'

const TYPE_ICON = {
  proposal_submitted:   '📤',
  proposal_approved:    '✅',
  proposal_rejected:    '❌',
  proposal_returned:    '↩️',
  review_requested:     '🔍',
  decision_recorded:    '⚖️',
  milestone_due:        '📅',
  comment_added:        '💬',
}

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [filter, setFilter]               = useState('all') // all | unread

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await getNotifications()
      const arr = Array.isArray(data) ? data : data.notifications || []
      setNotifications(arr)
    } catch (e) {
      setError(e.message || 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function markRead(id) {
    try { await markNotificationRead(id) } catch(e) { setError(e.message); return }
    setNotifications(prev => prev.map(n =>
      (n.id === id) ? { ...n, is_read: true, read: true } : n
    ))
  }

  async function markAllRead() {
    try { await markAllNotificationsRead() } catch(e) { setError(e.message); return }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read: true })))
  }

  const filtered = notifications.filter(n =>
    filter === 'all' || (!n.is_read && !n.read)
  )

  const unreadCount = notifications.filter(n => !n.is_read && !n.read).length

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <CheckCheck className="w-4 h-4" /> Mark all read
            </button>
          )}
          <button onClick={load} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { value: 'all',    label: `All (${notifications.length})` },
          { value: 'unread', label: `Unread (${unreadCount})` },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              filter === f.value ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Notifications list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 mx-auto text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((n, i) => {
              const isRead = n.is_read || n.read
              return (
                <div
                  key={n.id || i}
                  onClick={() => markRead(n.id)}
                  className={`flex items-start gap-4 p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !isRead ? 'bg-blue-50/40' : ''
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                    !isRead ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    {TYPE_ICON[n.notification_type] || TYPE_ICON[n.type] || '🔔'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {n.message || n.title || 'New notification'}
                    </p>
                    {n.proposal_title && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        Re: {n.proposal_title}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>

                  {/* Read indicator */}
                  <div className="flex-shrink-0 mt-1">
                    {!isRead ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                    ) : (
                      <MailOpen className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
