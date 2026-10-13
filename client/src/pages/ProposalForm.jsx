import { useState, useEffect } from 'react'
import {
  Save, Send, AlertCircle, CheckCircle, Loader2, ArrowLeft, Info
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  createProposal, saveDraft, submitProposal,
  getDepartments, getProgrammes, getProposalById
} from '../services/api.js'

const PROPOSAL_TYPES = [
  { value: 'new_course',                label: 'New Course' },
  { value: 'course_modification',       label: 'Course Modification' },
  { value: 'course_discontinuation',    label: 'Course Discontinuation' },
  { value: 'programme_structure_change',label: 'Programme Structure Change' },
]

const INITIAL_FORM = {
  proposal_type: '',
  title: '',
  department_id: '',
  affected_programmes: '',
  proposed_implementation_session: '',
  academic_rationale: '',
  prerequisites: '',
  credits: '',
  syllabus_change_description: '',
  resource_implications: '',
}

const Field = ({ label, required, error: fe, children }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {fe && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fe}</p>}
    </div>
  )


export default function ProposalForm({ proposalId, onBack, onProposalCreated }) {
  const { user } = useAuth()
  const [form, setForm]           = useState(INITIAL_FORM)
  const [departments, setDepts]   = useState([])
  const [programmes, setProgs]    = useState([])
  const [saving, setSaving]       = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const [currentId, setCurrentId] = useState(proposalId || null)
  const [loading, setLoading]     = useState(!!proposalId)
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    getDepartments()
      .then(d => setDepts(Array.isArray(d) ? d : d.departments || []))
      .catch(() => {})
    getProgrammes()
      .then(d => setProgs(Array.isArray(d) ? d : d.programmes || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!proposalId) { setLoading(false); return }
    setLoading(true)
    getProposalById(proposalId)
      .then(data => {
        const p = data.proposal || data
        setForm({
          proposal_type: {'New Course':'new_course','Course Modification':'course_modification','Course Discontinuation':'course_discontinuation','Programme Structure Change':'programme_structure_change'}[p.proposal_type] || p.proposal_type || '',
          title: p.title || '',
          department_id: String(p.department_id || ''),
          affected_programmes: Array.isArray(p.affected_programmes)
            ? p.affected_programmes.join(', ')
            : p.affected_programmes || '',
          proposed_implementation_session: p.proposed_implementation_session || '',
          academic_rationale: p.academic_rationale || '',
          prerequisites: p.prerequisites || '',
          credits: p.credits != null ? String(p.credits) : '',
          syllabus_change_description: p.syllabus_change_description || '',
          resource_implications: p.resource_implications || '',
        })
        setCurrentId(proposalId)
      })
      .catch(() => setError('Failed to load proposal.'))
      .finally(() => setLoading(false))
  }, [proposalId])

  function set(field) {
    return e => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      if (validationErrors[field]) {
        setValidationErrors(v => { const n = { ...v }; delete n[field]; return n })
      }
    }
  }

  function validate() {
    const errs = {}
    if (!form.proposal_type)  errs.proposal_type = 'Proposal type is required'
    if (form.title.trim().length < 5) errs.title = 'Title must contain at least 5 characters'
    if (!form.department_id)  errs.department_id = 'Department is required'
    if (!form.proposed_implementation_session.trim())
      errs.proposed_implementation_session = 'Implementation session is required'
    if (form.academic_rationale.trim().length < 15) errs.academic_rationale = 'Academic rationale must contain at least 15 characters'
    if (!Number.isInteger(Number(form.credits)) || Number(form.credits)<1) errs.credits = 'A positive whole credit count is required'
    if (form.syllabus_change_description.trim().length<10) errs.syllabus_change_description = 'Syllabus description must contain at least 10 characters'
    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSaveDraft() {
    setError(''); setSuccess(''); setSaving(true)
    try {
      if (!currentId) {
        // Create first
        if (!form.proposal_type || !form.title.trim() || !form.department_id) {
          setError('Please fill in type, title, and department to save a draft.')
          setSaving(false); return
        }
        const created = await createProposal({
          proposal_type: form.proposal_type,
          title: form.title,
          department_id: form.department_id,
          affected_programmes: form.affected_programmes,
          proposed_implementation_session: form.proposed_implementation_session,
        })
        const newId = created.proposal?.id || created.id || created.proposal_id
        setCurrentId(newId)
        await saveDraft(newId, buildPayload())
        setSuccess('Draft saved successfully!')
        onProposalCreated?.(newId)
      } else {
        await saveDraft(currentId, buildPayload())
        setSuccess('Draft saved successfully!')
      }
    } catch (e) {
      setError(e.message || 'Failed to save draft.')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit() {
    if (!validate()) { setError('Please fix the errors below.'); return }
    setError(''); setSuccess(''); setSubmitting(true)
    try {
      let id = currentId
      if (!id) {
        const created = await createProposal({
          proposal_type: form.proposal_type,
          title: form.title,
          department_id: form.department_id,
          affected_programmes: form.affected_programmes,
          proposed_implementation_session: form.proposed_implementation_session,
        })
        id = created.proposal?.id || created.id || created.proposal_id
        setCurrentId(id)
      }
      await saveDraft(id, buildPayload())
      await submitProposal(id)
      setSuccess('Proposal submitted successfully! It is now under review.')
      onProposalCreated?.(id)
    } catch (e) {
      setError(e.message || 'Failed to submit proposal.')
    } finally {
      setSubmitting(false)
    }
  }

  function buildPayload() {
    return {
      proposal_type: form.proposal_type,
      title: form.title,
      department_id: form.department_id,
      affected_programmes: form.affected_programmes,
      proposed_implementation_session: form.proposed_implementation_session,
      academic_rationale: form.academic_rationale,
      prerequisites: form.prerequisites,
      credits: form.credits ? Number(form.credits) : undefined,
      syllabus_changes: form.syllabus_change_description,
      resource_implications: form.resource_implications,
    }
  }

  const inputCls = (field) => `w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${
    validationErrors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
  }`

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {proposalId ? 'Edit Proposal' : 'New Proposal'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Fill in the details to create a curriculum revision proposal</p>
        </div>
      </div>

      {/* Alert messages */}
      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {success}
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {/* Section: Basic Info */}
        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary-600" /> Basic Information
          </h2>

          <Field label="Proposal Type" required error={validationErrors.proposal_type}>
            <select value={form.proposal_type} onChange={set('proposal_type')} className={inputCls('proposal_type')}>
              <option value="">Select proposal type…</option>
              {PROPOSAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          <Field label="Title" required error={validationErrors.title}>
            <input
              type="text"
              value={form.title}
              onChange={set('title')}
              placeholder="e.g., Introduction to Machine Learning (CS401)"
              className={inputCls('title')}
            />
          </Field>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Department" required error={validationErrors.department_id}>
              <select value={form.department_id} onChange={set('department_id')} className={inputCls('department_id')}>
                <option value="">Select department…</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name || d.department_name}</option>
                ))}
              </select>
            </Field>

            <Field label="Implementation Session" required error={validationErrors.proposed_implementation_session}>
              <input
                type="text"
                value={form.proposed_implementation_session}
                onChange={set('proposed_implementation_session')}
                placeholder="e.g., 2024-25 Even Semester"
                className={inputCls('proposed_implementation_session')}
              />
            </Field>
          </div>

          <Field label="Affected Programmes">
            <input
              type="text"
              value={form.affected_programmes}
              onChange={set('affected_programmes')}
              placeholder="e.g., B.Tech CSE, B.Tech ECE (comma-separated)"
              className={inputCls('affected_programmes')}
            />
            <p className="text-xs text-gray-400 mt-1">Enter programme names separated by commas</p>
          </Field>

          <div className="grid md:grid-cols-2 gap-5">
            <Field label="Credits">
              <input
                type="number"
                value={form.credits}
                onChange={set('credits')}
                placeholder="e.g., 4"
                min="0"
                max="12"
                className={inputCls('credits')}
              />
            </Field>
            <Field label="Prerequisites">
              <input
                type="text"
                value={form.prerequisites}
                onChange={set('prerequisites')}
                placeholder="e.g., CS201, MA101"
                className={inputCls('prerequisites')}
              />
            </Field>
          </div>
        </div>

        {/* Section: Academic Content */}
        <div className="p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900">Academic Content</h2>

          <Field label="Academic Rationale" required error={validationErrors.academic_rationale}>
            <textarea
              rows={4}
              value={form.academic_rationale}
              onChange={set('academic_rationale')}
              placeholder="Describe the academic need, relevance, and objectives of this proposal…"
              className={inputCls('academic_rationale')}
            />
          </Field>

          <Field label="Syllabus Change Description">
            <textarea
              rows={4}
              value={form.syllabus_change_description}
              onChange={set('syllabus_change_description')}
              placeholder="Describe the changes to the syllabus, topics added/removed, teaching methodology…"
              className={inputCls('syllabus_change_description')}
            />
          </Field>

          <Field label="Resource Implications">
            <textarea
              rows={3}
              value={form.resource_implications}
              onChange={set('resource_implications')}
              placeholder="Lab requirements, faculty expertise, software licenses, financial implications…"
              className={inputCls('resource_implications')}
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="p-6 flex items-center justify-between bg-gray-50 rounded-b-xl">
          <button onClick={onBack} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800 font-medium">
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={saving || submitting}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary-800 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Submitting…' : 'Submit Proposal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
