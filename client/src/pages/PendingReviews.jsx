import { useState, useEffect, useCallback } from 'react'
import {
  ClipboardCheck, RefreshCw, AlertCircle, Eye, CheckCircle,
  Loader2, ArrowRight, ThumbsUp, ThumbsDown, RotateCcw
} from 'lucide-react'
import { getPendingActions, reviewProposal } from '../services/api.js'

const STATUS_BADGE = {
  draft:               'bg-gray-100 text-gray-700',
  submitted:           'bg-blue-100 text-blue-700',
  under_review:        'bg-blue-100 text-blue-700',
  committee_review:    'bg-purple-100 text-purple-700',
  approved:            'bg-green-100 text-green-700',
  returned_for_revision:'bg-amber-100 text-amber-700',
  rejected:            'bg-red-100 text-red-700',
}

function StatusBadge({ status }) {
  const cls = STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
}

function QuickReviewModal({ proposal, onClose, onSuccess }) {
  const [actionType, setActionType] = useState('')
  const [comment, setComment]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  async function handleSubmit() {
    if (!actionType) { setError('Please select an action.'); return }
    if (!comment.trim()) { setError('Comment is required.'); return }
    setError(''); setLoading(true)
    try {
      await reviewProposal(proposal.proposal_id || proposal.id, { action_type: actionType, comment })
      onSuccess()
    } catch (e) {
      setError(e.message || 'Failed to submit review.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Quick Review</h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">{proposal.proposal_title || proposal.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'recommend_forward', label: 'Recommend & Forward', Icon: ThumbsUp, color: 'green' },
              { value: 'return_for_revision', label: 'Return', Icon: RotateCcw, color: 'amber' },
              
            ].map(opt => {
              const active = actionType === opt.value
              const cls = {
                green: active ? 'bg-green-600 text-white border-green-600' : 'border-green-300 text-green-700 hover:bg-green-50',
                amber: active ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-300 text-amber-700 hover:bg-amber-50',
                red:   active ? 'bg-red-600 text-white border-red-600'   : 'border-red-300 text-red-700 hover:bg-red-50',
              }[opt.color]
              return (
                <button
                  key={opt.value}
                  onClick={() => setActionType(opt.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-medium transition-colors ${cls}`}
                >
                  <opt.Icon className="w-3 h-3" /> {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Comment <span className="text-red-500">*</span></label>
          <textarea
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Review comments…"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-primary-800 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Submit Review
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PendingReviews({ onSelectProposal }) {
  const [pending, setPending]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [modal, setModal]       = useState(null)
  const [successId, setSuccessId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await getPendingActions()
      const arr = Array.isArray(data) ? data : data.pending || []
      setPending(arr)
    } catch (e) {
      setError(e.message || 'Failed to load pending reviews.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleReviewSuccess() {
    setSuccessId(modal?.proposal_id || modal?.id)
    setModal(null)
    load()
    setTimeout(() => setSuccessId(null), 3000)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Reviews</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pending.length} proposal{pending.length !== 1 ? 's' : ''} awaiting your review
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {successId && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle className="w-4 h-4" /> Review submitted successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : pending.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-3" />
            <p className="text-gray-500 font-medium">You're all caught up!</p>
            <p className="text-sm text-gray-400 mt-1">No proposals pending your review.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action Required</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pending.map((p, i) => (
                  <tr key={p.id || i} className={`hover:bg-gray-50 transition-colors ${successId === (p.proposal_id || p.id) ? 'bg-green-50' : ''}`}>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {p.proposal_title || p.title || `Proposal #${p.proposal_id || p.id}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.proposal_code || `#${p.proposal_id || p.id}`}</p>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-600 whitespace-nowrap">
                      {p.proposal_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {p.department_name || p.department || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block text-xs px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg font-medium">
                        {p.action_required || p.stage || 'Review required'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectProposal(p.proposal_id || p.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg transition-colors"
                        >
                          <ClipboardCheck className="w-3 h-3" /> Quick Review
                        </button>
                        <button
                          onClick={() => onSelectProposal(p.proposal_id || p.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <QuickReviewModal
          proposal={modal}
          onClose={() => setModal(null)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  )
}
