import { useState } from 'react'
import {
  PlusCircle, CheckCircle, Clock, AlertCircle, Loader2,
  Paperclip, Calendar, Edit3, Save, ChevronDown, ChevronUp
} from 'lucide-react'
import { createMilestone, updateMilestone, uploadDocument } from '../services/api.js'

// ─── Milestone Status helpers ─────────────────────────────────────────────────

const MILESTONE_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Delayed']

const STATUS_CONFIG = {
  'Completed':   { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700 border-green-200',  Icon: CheckCircle },
  'In Progress': { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700 border-blue-200',     Icon: Clock },
  'Delayed':     { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-700 border-red-200',         Icon: AlertCircle },
  'Not Started': { dot: 'bg-gray-300',   badge: 'bg-gray-100 text-gray-600 border-gray-200',      Icon: Clock },
}

function MilestoneStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Not Started']
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  )
}

function isOverdue(targetDate, status) {
  if (!targetDate || status === 'Completed') return false
  return new Date(targetDate) < new Date()
}

// ─── Single Milestone Card (editable by Academic Office) ───────────────────────

function MilestoneCard({ milestone, onSave, busy }) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus]   = useState(milestone.status || 'Not Started')
  const [evidence, setEvidence] = useState(milestone.evidence_reference || '')
  const [error, setError]     = useState('')
  const overdue = isOverdue(milestone.target_date, milestone.status)

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    try {
      await onSave(milestone.id, { status, evidence_reference: evidence })
      setEditing(false)
    } catch (err) {
      setError(err.message || 'Failed to update milestone.')
    }
  }

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['Not Started']
  const StatusIcon = cfg.Icon

  return (
    <div className={`rounded-xl border p-4 transition-colors ${
      overdue && status !== 'Completed'
        ? 'border-red-200 bg-red-50'
        : status === 'Completed'
          ? 'border-green-200 bg-green-50'
          : 'border-gray-100 bg-gray-50'
    }`}>
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          status === 'Completed'   ? 'bg-green-100 text-green-600' :
          status === 'In Progress' ? 'bg-blue-100 text-blue-600'  :
          status === 'Delayed'     ? 'bg-red-100 text-red-600'    :
          'bg-gray-100 text-gray-400'
        }`}>
          <StatusIcon className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900">{milestone.title || milestone.name || 'Milestone'}</p>
              {milestone.description && (
                <p className="text-xs text-gray-500 mt-0.5">{milestone.description}</p>
              )}
            </div>
            {onSave && (
              <button
                onClick={() => setEditing(v => !v)}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-white text-gray-500 flex-shrink-0"
                title={editing ? 'Cancel' : 'Edit milestone'}
              >
                {editing ? <ChevronUp className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <MilestoneStatusBadge status={milestone.status || 'Not Started'} />
            {milestone.target_date && (
              <span className={`flex items-center gap-1 text-xs ${overdue && status !== 'Completed' ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                <Calendar className="w-3 h-3" />
                Due {new Date(milestone.target_date).toLocaleDateString()}
                {overdue && status !== 'Completed' && ' — OVERDUE'}
              </span>
            )}
            {milestone.evidence_reference && (
              <span className="text-xs text-gray-500 italic">Evidence: {milestone.evidence_reference}</span>
            )}
          </div>

          {/* Edit form */}
          {editing && (
            <form onSubmit={handleSave} className="mt-3 space-y-3 p-3 bg-white rounded-lg border border-gray-200">
              {error && (
                <div className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" /> {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  aria-label="Milestone status"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  {MILESTONE_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Evidence Reference
                  {status === 'Completed' && <span className="text-red-500 ml-1">*</span>}
                </label>
                <input
                  aria-label="Evidence reference"
                  type="text"
                  value={evidence}
                  onChange={e => setEvidence(e.target.value)}
                  placeholder="e.g., Document No. or URL confirming completion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
                {status === 'Completed' && !evidence.trim() && (
                  <p className="text-xs text-amber-600 mt-1">Evidence is required when marking a milestone as completed.</p>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || (status === 'Completed' && !evidence.trim())}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-800 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
                >
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main MilestoneEditor export ──────────────────────────────────────────────

export function MilestoneEditor({ proposal, milestones, onRefresh }) {
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy]     = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
    setBusy(true); setError(''); setSuccess('')
    try {
      await createMilestone(proposal.id, data)
      e.target.reset()
      setShowForm(false)
      setSuccess('Milestone created.')
      await onRefresh()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to create milestone.')
    } finally {
      setBusy(false)
    }
  }

  async function handleUpdate(id, data) {
    setBusy(true); setError(''); setSuccess('')
    try {
      await updateMilestone(id, data)
      setSuccess('Milestone updated.')
      await onRefresh()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'Failed to update milestone.')
      throw err
    } finally {
      setBusy(false)
    }
  }

  const completed  = milestones.filter(m => m.status === 'Completed').length
  const total      = milestones.length
  const progress   = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Progress bar */}
      {total > 0 && (
        <div className="p-4 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Implementation Progress</p>
            <span className="text-sm font-bold text-primary-700">{completed}/{total} complete</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{progress}%</p>
        </div>
      )}

      {/* Add milestone button / form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-primary-300 text-primary-700 hover:bg-primary-50 rounded-xl text-sm font-medium transition-colors w-full justify-center"
        >
          <PlusCircle className="w-4 h-4" />
          Add Implementation Milestone
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="p-4 bg-primary-50 border border-primary-200 rounded-xl space-y-3"
        >
          <h4 className="text-sm font-semibold text-primary-800">New Milestone</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              aria-label="Milestone title"
              required
              name="title"
              placeholder="Milestone title *"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <input
              aria-label="Target date"
              required
              name="target_date"
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <input
            aria-label="Milestone description"
            name="description"
            placeholder="Description (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 text-sm text-gray-600">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 bg-primary-800 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
              Add Milestone
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ─── DocumentUploader export (unchanged logic, improved styling) ───────────────

export function DocumentUploader({ proposalId, onRefresh }) {
  const [error, setError]   = useState('')
  const [busy, setBusy]     = useState(false)
  const [uploaded, setUploaded] = useState('')

  async function upload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Maximum file size is 5 MB.'); return }

    const allowed = ['application/pdf', 'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) {
      setError('Only PDF, plain text (.txt) and DOCX files are accepted.')
      return
    }

    setBusy(true); setError(''); setUploaded('')
    try {
      const file_data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      await uploadDocument(proposalId, {
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_data,
      })
      setUploaded(file.name)
      await onRefresh()
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
        <Paperclip className="w-4 h-4" />
        Attach Supporting Document
      </div>
      <p className="text-xs text-blue-600">PDF, plain text (.txt) or DOCX — maximum 5 MB</p>
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          aria-label="Supporting document"
          type="file"
          accept=".pdf,.txt,.docx"
          disabled={busy}
          onChange={upload}
          className="sr-only"
        />
        <span className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          busy
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-blue-700 hover:bg-blue-600 text-white cursor-pointer'
        }`}>
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
          {busy ? 'Uploading…' : 'Choose file'}
        </span>
      </label>
      {uploaded && (
        <p className="text-xs text-green-700 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" /> "{uploaded}" uploaded successfully.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  )
}
