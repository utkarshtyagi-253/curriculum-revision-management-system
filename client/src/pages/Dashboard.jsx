import { useState, useEffect } from 'react'
import {
  FileText, Clock, CheckCircle, XCircle, RotateCcw,
  AlertTriangle, TrendingUp, PlusCircle, ClipboardCheck,
  ArrowRight, Loader2, RefreshCw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getProposalStats, getProposals, getPendingActions } from '../services/api.js'

const STAT_CARDS = [
  { key: 'total',          label: 'Total Proposals',    icon: FileText,      color: 'blue' },
  { key: 'drafts',         label: 'Drafts',             icon: Clock,         color: 'gray' },
  { key: 'underReview',    label: 'Under Review',       icon: TrendingUp,    color: 'indigo' },
  { key: 'approved',       label: 'Approved',           icon: CheckCircle,   color: 'green' },
  { key: 'returned',       label: 'Returned',           icon: RotateCcw,     color: 'amber' },
  { key: 'rejected',       label: 'Rejected',           icon: XCircle,       color: 'red' },
  { key: 'pendingForUserRole', label: 'Pending My Action', icon: AlertTriangle, color: 'orange' },
]

const COLOR_MAP = {
  blue:   { card: 'bg-blue-50 border-blue-100',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-700'   },
  gray:   { card: 'bg-gray-50 border-gray-100',   icon: 'bg-gray-100 text-gray-600',   text: 'text-gray-700'   },
  indigo: { card: 'bg-indigo-50 border-indigo-100', icon: 'bg-indigo-100 text-indigo-600', text: 'text-indigo-700' },
  green:  { card: 'bg-green-50 border-green-100', icon: 'bg-green-100 text-green-600', text: 'text-green-700'  },
  amber:  { card: 'bg-amber-50 border-amber-100', icon: 'bg-amber-100 text-amber-600', text: 'text-amber-700'  },
  red:    { card: 'bg-red-50 border-red-100',     icon: 'bg-red-100 text-red-600',     text: 'text-red-700'    },
  orange: { card: 'bg-orange-50 border-orange-100', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-700' },
}

function StatusBadge({ status }) {
  const MAP = {
    draft:               'bg-gray-100 text-gray-700',
    submitted:           'bg-blue-100 text-blue-700',
    under_review:        'bg-blue-100 text-blue-700',
    committee_review:    'bg-purple-100 text-purple-700',
    approved:            'bg-green-100 text-green-700',
    conditionally_approved: 'bg-teal-100 text-teal-700',
    returned_for_revision: 'bg-amber-100 text-amber-700',
    rejected:            'bg-red-100 text-red-700',
  }
  const cls = MAP[status] || 'bg-gray-100 text-gray-600'
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label}
    </span>
  )
}

export default function Dashboard({ onPageChange, onSelectProposal }) {
  const { user, hasRole } = useAuth()
  const [stats, setStats]       = useState({})
  const [recent, setRecent]     = useState([])
  const [pending, setPending]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  async function load() {
    setLoading(true); setError('')
    try {
      const [statsData, proposalsData, pendingData] = await Promise.allSettled([
        getProposalStats(),
        getProposals({ limit: 5 }),
        getPendingActions(),
      ])
      const failures = [statsData,proposalsData,pendingData].filter(r=>r.status === 'rejected')
      if (failures.length) setError(failures[0].reason.message || 'Some dashboard data could not load.')
      if (statsData.status === 'fulfilled') {
        setStats(statsData.value?.stats || statsData.value || {})
      }
      if (proposalsData.status === 'fulfilled') {
        const arr = Array.isArray(proposalsData.value)
          ? proposalsData.value
          : proposalsData.value?.proposals || []
        setRecent(arr.slice(0, 6))
      }
      if (pendingData.status === 'fulfilled') {
        const arr = Array.isArray(pendingData.value)
          ? pendingData.value
          : pendingData.value?.pending || []
        setPending(arr)
      }
    } catch {
      setError('Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const canCreateProposal = hasRole('faculty_proposer')
  const canReview = hasRole('programme_coordinator') || hasRole('hod') || hasRole('dcc_reviewer') ||
                    hasRole('academic_office') || hasRole('senate_member')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.replace(/^(Dr\.|Prof\.|Ms\.|Mr\.)\s*/, '').split(' ')[0] || 'User'}!
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Here's what's happening with curriculum proposals today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreateProposal && (
            <button
              onClick={() => onPageChange('new-proposal')}
              className="flex items-center gap-2 px-4 py-2 bg-primary-800 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              New Proposal
            </button>
          )}
          <button onClick={load} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Stats cards */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {STAT_CARDS.map(s => (
            <div key={s.key} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {STAT_CARDS.map(s => {
            const clr = COLOR_MAP[s.color]
            const Icon = s.icon
            const val = stats[s.key] ?? 0
            return (
              <div key={s.key} className={`border rounded-xl p-4 ${clr.card}`}>
                <div className={`inline-flex p-2 rounded-lg mb-2 ${clr.icon}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className={`text-2xl font-bold ${clr.text}`}>{val}</p>
                <p className="text-xs text-gray-600 leading-tight mt-0.5">{s.label}</p>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Proposals */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Proposals</h2>
            <button
              onClick={() => onPageChange('proposals')}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No proposals found.</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map(p => (
                <button
                  key={p.id || p.proposal_id}
                  onClick={() => onSelectProposal(p.id || p.proposal_id)}
                  className="flex items-center gap-4 w-full px-5 py-3 hover:bg-gray-50 text-left transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-700">
                      {p.title || 'Untitled Proposal'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {p.proposal_type?.replace(/_/g, ' ') || '—'} • {p.department_name || p.department || '—'}
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pending actions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Pending Actions</h2>
            {pending.length > 0 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                {pending.length}
              </span>
            )}
          </div>
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : pending.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />
              All caught up!
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto scrollbar-thin">
              {pending.map((a, i) => (
                <button
                  key={a.id || i}
                  onClick={() => onSelectProposal(a.proposal_id || a.id)}
                  className="flex flex-col items-start w-full px-5 py-3 hover:bg-orange-50 text-left transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 truncate w-full">
                    {a.proposal_title || a.title || 'Proposal #' + (a.proposal_id || a.id)}
                  </p>
                  <p className="text-xs text-orange-600 font-medium mt-0.5">{a.action_required || a.stage || 'Review required'}</p>
                </button>
              ))}
            </div>
          )}
          {canReview && (
            <div className="px-5 pb-4 pt-2 border-t border-gray-100">
              <button
                onClick={() => onPageChange('pending-reviews')}
                className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <ClipboardCheck className="w-4 h-4" />
                Open Review Queue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
