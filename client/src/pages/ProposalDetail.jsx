import { MilestoneEditor, DocumentUploader } from '../components/ProposalTools.jsx'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Loader2, AlertCircle, CheckCircle, Clock, RefreshCw,
  FileText, GitBranch, History, Paperclip, Target, Send,
  ThumbsUp, ThumbsDown, RotateCcw, ChevronRight, User, Calendar,
  Hash, Building, BookOpen, CreditCard, MessageSquare
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  getProposalById, getTimeline, compareVersions, getMilestones,
  reviewProposal, recordDecision, submitProposal
} from '../services/api.js'

const STATUS_BADGE = {
  draft:                  'bg-gray-100 text-gray-700 border-gray-200',
  submitted:              'bg-blue-100 text-blue-700 border-blue-200',
  under_review:           'bg-blue-100 text-blue-700 border-blue-200',
  committee_review:       'bg-purple-100 text-purple-700 border-purple-200',
  approved:               'bg-green-100 text-green-700 border-green-200',
  conditionally_approved: 'bg-teal-100 text-teal-700 border-teal-200',
  returned_for_revision:  'bg-amber-100 text-amber-700 border-amber-200',
  rejected:               'bg-red-100 text-red-700 border-red-200',
}

function StatusBadge({ status, large }) {
  const cls = STATUS_BADGE[status] || 'bg-gray-100 text-gray-600 border-gray-200'
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'
  return (
    <span className={`inline-block border rounded-full font-medium ${large ? 'text-sm px-3 py-1' : 'text-xs px-2 py-0.5'} ${cls}`}>
      {label}
    </span>
  )
}

function Tab({ id, label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-3 border-b border-gray-50 last:border-0">
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-48 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900">{value || '—'}</dd>
    </div>
  )
}

// Review form for HOD/DCC/Academic/Senate
function ReviewForm({ proposalId, userRoles, proposalStatus, responsibleRole, onRefresh }) {
  const [actionType, setActionType] = useState('')
  const [comment, setComment]       = useState('')
  const [reason, setReason]         = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const isCommittee = ['DCC Reviewer','Senate / Academic Council'].includes(responsibleRole)

  // Decision form fields
  const [decisionType, setDecisionType]     = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingRef, setMeetingRef]         = useState('')
  const [conditions, setConditions]         = useState('')
  const [votingSummary, setVotingSummary]   = useState('')

  async function handleReview() {
    if (!actionType) { setError('Please select an action.'); return }
    if (!comment.trim()) { setError('Please provide a comment.'); return }
    setError(''); setLoading(true)
    try {
      await reviewProposal(proposalId, { action_type: actionType, comment, reason })
      setSuccess('Review submitted successfully!')
      setActionType(''); setComment(''); setReason('')
      onRefresh()
    } catch (e) {
      setError(e.message || 'Failed to submit review.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDecision() {
    if (!decisionType) { setError('Please select a decision.'); return }
    if (!meetingDate) { setError('Please provide a meeting date.'); return }
    if (!meetingRef.trim()) { setError('Please provide a meeting reference.'); return }
    setError(''); setLoading(true)
    try {
      await recordDecision(proposalId, {
        decision_type: {approved:'Final Approval',conditionally_approved:'Conditional Approval',rejected:'Rejection',returned_for_revision:'Return for Revision',recommendation:'Recommendation'}[decisionType],
        meeting_date: meetingDate,
        meeting_ref: meetingRef,
        decision_reason: reason,
        conditions,
        voting_summary: votingSummary,
      })
      setSuccess('Decision recorded successfully!')
      setDecisionType(''); setMeetingRef(''); setConditions(''); setVotingSummary(''); setReason('')
      onRefresh()
    } catch (e) {
      setError(e.message || 'Failed to record decision.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {success}
        </div>
      )}

      {isCommittee ? (
        /* Committee / Senate Decision form */
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-purple-800 flex items-center gap-2">
            <ThumbsUp className="w-4 h-4" /> Committee Decision
          </h3>

          <label className="block text-sm">Meeting Date<input aria-label="Meeting Date" type="date" value={meetingDate} onChange={e=>setMeetingDate(e.target.value)} className="block border rounded-lg p-2 mt-1" /></label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Decision Type <span className="text-red-500">*</span></label>
              <select
                value={decisionType}
                onChange={e => setDecisionType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">Select decision…</option>
                {responsibleRole === 'Senate / Academic Council' ? <option value="approved">Final Approval</option> : <option value="recommendation">Recommendation</option>}
                <option value="conditionally_approved">Conditional Approval</option>
                <option value="rejected">Rejection</option>
                <option value="returned_for_revision">Return for Revision</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Reference <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={meetingRef}
                onChange={e => setMeetingRef(e.target.value)}
                placeholder="e.g., BOS/2024/03/07"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voting Summary</label>
            <input
              type="text"
              value={votingSummary}
              onChange={e => setVotingSummary(e.target.value)}
              placeholder="e.g., 8 in favour, 1 against, 0 abstain"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          {decisionType === 'conditionally_approved' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conditions</label>
              <textarea
                rows={2}
                value={conditions}
                onChange={e => setConditions(e.target.value)}
                placeholder="Specify conditions for approval…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason / Notes</label>
            <textarea
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Additional notes or rationale for this decision…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <button
            onClick={handleDecision}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-700 hover:bg-purple-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Submitting…' : 'Record Decision'}
          </button>
        </div>
      ) : (
        /* Reviewer (HOD / DCC) form */
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-blue-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Submit Review
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action <span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'recommend_forward', label: 'Recommend & Forward', Icon: ThumbsUp, color: 'green' },
                { value: 'return_for_revision', label: 'Return for Revision', Icon: RotateCcw, color: 'amber' },
                
              ].map(opt => {
                const active = actionType === opt.value
                const colors = {
                  green: active ? 'bg-green-600 text-white border-green-600' : 'border-green-300 text-green-700 hover:bg-green-50',
                  amber: active ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-300 text-amber-700 hover:bg-amber-50',
                  red:   active ? 'bg-red-600 text-white border-red-600'     : 'border-red-300 text-red-700 hover:bg-red-50',
                }[opt.color]
                return (
                  <button
                    key={opt.value}
                    onClick={() => setActionType(opt.value)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${colors}`}
                  >
                    <opt.Icon className="w-4 h-4" /> {opt.label}
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
              placeholder="Provide your review comments…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {(actionType === 'return_for_revision' || actionType === 'reject') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea
                rows={2}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Specific reason for returning/rejecting…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}

          <button
            onClick={handleReview}
            disabled={loading || !actionType}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-800 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function ProposalDetail({ proposalId, onBack, onEdit }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData]           = useState(null)
  const [timeline, setTimeline]   = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [compareV1, setCompareV1] = useState('')
  const [compareV2, setCompareV2] = useState('')
  const [compareResult, setCompareResult] = useState(null)
  const [compareLoading, setCompareLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [propData, tlData, msData] = await Promise.allSettled([
        getProposalById(proposalId),
        getTimeline(proposalId),
        getMilestones(proposalId),
      ])
      if (propData.status === 'fulfilled') {
        setData(propData.value?.proposal || propData.value)
      } else {
        setError('Failed to load proposal.')
      }
      if (tlData.status === 'fulfilled') {
        const arr = Array.isArray(tlData.value) ? tlData.value : tlData.value?.timeline || []
        setTimeline(arr)
      }
      if (msData.status === 'fulfilled') {
        const arr = Array.isArray(msData.value) ? msData.value : msData.value?.milestones || []
        setMilestones(arr)
      }
    } catch {
      setError('Failed to load proposal details.')
    } finally {
      setLoading(false)
    }
  }, [proposalId])

  useEffect(() => { load() }, [load])

  async function handleCompare() {
    if (!compareV1 || !compareV2) return
    setCompareLoading(true); setCompareResult(null)
    try {
      const result = await compareVersions(proposalId, compareV1, compareV2)
      setCompareResult(result)
    } catch (e) {
      setCompareResult({ error: e.message })
    } finally {
      setCompareLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      </div>
    )
  }

  const proposal = data || {}
  const userRoles = user?.roles || []
  const versions = proposal.versions || []
  const documents = proposal.documents || []
  const reviewHistory = proposal.review_history || []

  const roleNames = {hod:'Programme Coordinator / HOD',dcc_reviewer:'DCC Reviewer',academic_office:'Academic Office',senate_member:'Senate / Academic Council'}
  const canReview = ['under_review','committee_review','senate_review'].includes(proposal.status) && (userRoles.includes('admin') || userRoles.some(r=>roleNames[r] === proposal.current_responsible_role))
  const isOwner = user?.id === proposal.proposer_id || user?.id === proposal.created_by
  const isDraft = ['draft','returned_for_revision'].includes(proposal.status)

  const TABS = [
    { id: 'overview',  label: 'Overview',   icon: BookOpen },
    { id: 'versions',  label: `Versions (${versions.filter(v=>v.is_immutable).length})`, icon: GitBranch },
    { id: 'reviews',   label: 'Reviews',    icon: History },
    { id: 'documents', label: `Documents (${documents.length})`, icon: Paperclip },
    { id: 'milestones', label: 'Milestones', icon: Target },
    ...(canReview ? [{ id: 'action', label: 'Review Action', icon: MessageSquare }] : []),
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={onBack} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 mt-0.5">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{proposal.title || 'Untitled Proposal'}</h1>
              <StatusBadge status={proposal.status} large />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {proposal.proposal_code || `Proposal #${proposalId}`} •{' '}
              {proposal.proposal_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} •{' '}
              {proposal.department_name || '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isDraft && isOwner && (
            <>
              <button
                onClick={() => onEdit(proposalId)}
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Edit
              </button>
              <button
                onClick={async () => { await submitProposal(proposalId); load() }}
                className="px-4 py-2 text-sm font-medium bg-primary-800 hover:bg-primary-700 text-white rounded-lg"
              >
                Submit
              </button>
            </>
          )}
          <button onClick={load} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 px-2">
          {TABS.map(tab => (
            <Tab key={tab.id} {...tab} active={activeTab === tab.id} onClick={setActiveTab} />
          ))}
        </div>

        <div className="p-6">
          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="font-semibold text-gray-900 text-base">Proposal Details</h3>
                <dl>
                  <InfoRow label="Proposal Code" value={proposal.proposal_code} />
                  <InfoRow label="Type" value={proposal.proposal_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
                  <InfoRow label="Title" value={proposal.title} />
                  <InfoRow label="Department" value={proposal.department_name} />
                  <InfoRow label="Proposer" value={proposal.proposer_name} />
                  <InfoRow label="Affected Programmes" value={
                    Array.isArray(proposal.affected_programmes)
                      ? proposal.affected_programmes.join(', ')
                      : proposal.affected_programmes
                  } />
                  <InfoRow label="Implementation Session" value={proposal.proposed_implementation_session} />
                  <InfoRow label="Credits" value={proposal.credits} />
                  <InfoRow label="Prerequisites" value={proposal.prerequisites} />
                  <InfoRow label="Current Stage" value={proposal.current_stage?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} />
                  <InfoRow label="Created" value={proposal.created_at ? new Date(proposal.created_at).toLocaleString() : '—'} />
                  <InfoRow label="Last Updated" value={proposal.updated_at ? new Date(proposal.updated_at).toLocaleString() : '—'} />
                </dl>

                {proposal.academic_rationale && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Academic Rationale</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg leading-relaxed whitespace-pre-wrap">
                      {proposal.academic_rationale}
                    </p>
                  </div>
                )}
                {proposal.syllabus_change_description && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Syllabus Changes</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg leading-relaxed whitespace-pre-wrap">
                      {proposal.syllabus_change_description}
                    </p>
                  </div>
                )}
                {proposal.resource_implications && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Resource Implications</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg leading-relaxed whitespace-pre-wrap">
                      {proposal.resource_implications}
                    </p>
                  </div>
                )}
              </div>

              {/* Timeline sidebar */}
              <div>
                <h3 className="font-semibold text-gray-900 text-base mb-4">Timeline</h3>
                {timeline.length === 0 ? (
                  <p className="text-sm text-gray-400">No timeline events yet.</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {timeline.map((event, i) => (
                        <div key={i} className="relative flex gap-4 pl-8">
                          <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-primary-100 border-2 border-primary-300 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary-500" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800">{event.action || event.event_type || 'Event'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{event.actor_name || event.user_name || '—'}</p>
                            {(event.comment || event.details) && <p className="text-xs text-gray-600 mt-1 italic">{event.comment || event.details}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {event.created_at ? new Date(event.created_at).toLocaleString() : '—'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Versions tab */}
          {activeTab === 'versions' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-gray-900">Version History</h3>
              {versions.length === 0 ? (
                <p className="text-sm text-gray-400">No versions available.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {versions.map((v, i) => (
                    <div key={v.version_number || i} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                          v{v.version_number || i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{v.title || `Version ${v.version_number || i + 1}`}</p>
                          <p className="text-xs text-gray-500">
                            {v.created_by_name || '—'} • {v.created_at ? new Date(v.created_at).toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setCompareV1(v.version_number || i + 1); setActiveTab('versions') }}
                          className="text-xs px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600"
                        >
                          v{v.version_number || i + 1}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Compare versions */}
              {versions.length >= 2 && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Compare Versions</h4>
                  <div className="flex items-center gap-3">
                    <select
                      value={compareV1}
                      onChange={e => setCompareV1(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="">Version 1…</option>
                      {versions.map((v, i) => (
                        <option key={i} value={v.version_number || i + 1}>v{v.version_number || i + 1}</option>
                      ))}
                    </select>
                    <span className="text-gray-400">vs</span>
                    <select
                      value={compareV2}
                      onChange={e => setCompareV2(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      <option value="">Version 2…</option>
                      {versions.map((v, i) => (
                        <option key={i} value={v.version_number || i + 1}>v{v.version_number || i + 1}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleCompare}
                      disabled={!compareV1 || !compareV2 || compareLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-800 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
                    >
                      {compareLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      Compare
                    </button>
                  </div>
                  {compareResult && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm">
                      {compareResult.error ? (
                        <p className="text-red-600">{compareResult.error}</p>
                      ) : (
                        <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th className="p-2">Field</th><th className="p-2">Version {compareV1}</th><th className="p-2">Version {compareV2}</th></tr></thead><tbody>{Object.entries(compareResult.diffs || {}).map(([field,diff])=><tr key={field} className={diff.isChanged ? 'bg-amber-50' : ''}><td className="p-2 font-medium">{field.replace(/_/g,' ')}</td><td className="p-2 whitespace-pre-wrap">{diff.from || '—'}</td><td className="p-2 whitespace-pre-wrap">{diff.to || '—'}</td></tr>)}</tbody></table></div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Review History</h3>
              {(proposal.decisions || []).map(d=><div key={d.id} className="border rounded-xl p-4 bg-purple-50"><p className="font-semibold">{d.decision_type} · {d.recorded_by_name}</p><p className="text-sm">{d.meeting_ref} · {d.meeting_date}</p><p className="text-sm mt-2">{d.decision_reason || d.conditions || d.voting_summary}</p></div>)}
              {reviewHistory.length === 0 ? (
                <p className="text-sm text-gray-400">No reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {reviewHistory.map((r, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                            {(r.reviewer_name || r.actor_name || 'U')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.reviewer_name || r.actor_name || '—'}</p>
                            <p className="text-xs text-gray-500">{r.role_label || r.role || '—'}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={r.action_type || r.action || r.status} />
                          <p className="text-xs text-gray-400">
                            {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                          </p>
                        </div>
                      </div>
                      {(r.comment || r.reason) && (
                        <p className="mt-3 text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-100 italic">
                          {r.comment || r.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Documents tab */}
          {activeTab === 'documents' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Attached Documents</h3>
              {isOwner && isDraft && <DocumentUploader proposalId={proposalId} onRefresh={load} />}
              {documents.length === 0 ? (
                <p className="text-sm text-gray-400">No documents attached.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{doc.file_name || doc.name || `Document ${i + 1}`}</p>
                        <p className="text-xs text-gray-500">{doc.document_type || '—'} • {doc.file_size || '—'}</p>
                      </div>
                      {doc.file_path && (
                        <a
                          href={doc.file_path}
                          download={doc.file_name}
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:underline"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Milestones tab */}
          {activeTab === 'milestones' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Implementation Milestones</h3>
              {userRoles.includes('academic_office') && ['approved','conditionally_approved','implemented'].includes(proposal.status) && <MilestoneEditor proposal={proposal} milestones={milestones} onRefresh={load} />}
              {milestones.length === 0 ? (
                <p className="text-sm text-gray-400">No milestones defined yet.</p>
              ) : (
                <div className="space-y-3">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        m.status === 'Completed' ? 'bg-green-100 text-green-600' :
                        m.status === 'In Progress' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {m.status === 'Completed' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{m.title || m.name || `Milestone ${i + 1}`}</p>
                        {m.description && <p className="text-xs text-gray-500 mt-1">{m.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          {m.target_date && <span>Due: {new Date(m.target_date).toLocaleDateString()}</span>}
                          {m.status && (
                            <span className={`px-2 py-0.5 rounded-full font-medium ${
                              m.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              m.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {m.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Review action tab */}
          {activeTab === 'action' && canReview && (
            <div className="max-w-2xl">
              <h3 className="font-semibold text-gray-900 mb-4">Submit Review / Decision</h3>
              <ReviewForm
                proposalId={proposalId}
                userRoles={userRoles}
                proposalStatus={proposal.status}
                responsibleRole={proposal.current_responsible_role}
                onRefresh={load}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
