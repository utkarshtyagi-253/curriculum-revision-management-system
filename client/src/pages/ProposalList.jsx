import { useState, useEffect, useCallback } from 'react'
import {
  Search, Filter, RefreshCw, Eye, ChevronUp, ChevronDown, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getProposals, getDepartments } from '../services/api.js'

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'committee_review', label: 'Committee Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'conditionally_approved', label: 'Conditionally Approved' },
  { value: 'returned_for_revision', label: 'Returned for Revision' },
  { value: 'rejected', label: 'Rejected' },
]

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'new_course', label: 'New Course' },
  { value: 'course_modification', label: 'Course Modification' },
  { value: 'course_discontinuation', label: 'Course Discontinuation' },
  { value: 'programme_structure_change', label: 'Programme Structure Change' },
]

const STATUS_BADGE = {
  draft:                  'bg-gray-100 text-gray-700',
  submitted:              'bg-blue-100 text-blue-700',
  under_review:           'bg-blue-100 text-blue-700',
  committee_review:       'bg-purple-100 text-purple-700',
  approved:               'bg-green-100 text-green-700',
  conditionally_approved: 'bg-teal-100 text-teal-700',
  returned_for_revision:  'bg-amber-100 text-amber-700',
  rejected:               'bg-red-100 text-red-700',
}

function StatusBadge({ status }) {
  const cls = STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'
  return <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>
}

function SortIcon({ field, sortBy, sortDir }) {
  if (sortBy !== field) return <ChevronUp className="w-3 h-3 opacity-30" />
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-primary-600" />
    : <ChevronDown className="w-3 h-3 text-primary-600" />
}

export default function ProposalList({ onSelectProposal, mine = false }) {
  const { user } = useAuth()
  const [proposals, setProposals]     = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType]   = useState('')
  const [filterDept, setFilterDept]   = useState('')
  const [sortBy, setSortBy]           = useState('updated_at')
  const [sortDir, setSortDir]         = useState('desc')

  useEffect(() => {
    getDepartments()
      .then(d => setDepartments(Array.isArray(d) ? d : d.departments || []))
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const data = await getProposals({
        search,
        status: filterStatus,
        type: filterType,
        department: filterDept,
      })
      const arr = Array.isArray(data) ? data : data.proposals || []
      setProposals(mine ? arr.filter(p=>p.owner_id === user.id) : arr)
    } catch (e) {
      setError(e.message || 'Failed to load proposals.')
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, filterType, filterDept, mine, user.id])

  useEffect(() => { load() }, [load])

  function toggleSort(field) {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('asc') }
  }

  const sorted = [...proposals].sort((a, b) => {
    const av = a[sortBy] || ''
    const bv = b[sortBy] || ''
    const cmp = String(av).localeCompare(String(bv))
    return sortDir === 'asc' ? cmp : -cmp
  })

  const hasFilters = search || filterStatus || filterType || filterDept

  function clearFilters() {
    setSearch(''); setFilterStatus(''); setFilterType(''); setFilterDept('')
  }

  const TH = ({ field, children }) => (
    <th
      onClick={() => toggleSort(field)}
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none whitespace-nowrap"
    >
      <span className="flex items-center gap-1">
        {children} <SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
      </span>
    </th>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-sm text-gray-500 mt-0.5">{proposals.length} proposal{proposals.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search proposals…"
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
          >
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Department filter */}
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name || d.department_name}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <TH field="proposal_code">ID</TH>
                <TH field="title">Title</TH>
                <TH field="proposal_type">Type</TH>
                <TH field="department_name">Department</TH>
                <TH field="status">Status</TH>
                <TH field="current_stage">Stage</TH>
                <TH field="updated_at">Updated</TH>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-400 text-sm">
                    No proposals match your filters.
                  </td>
                </tr>
              ) : (
                sorted.map(p => (
                  <tr key={p.id || p.proposal_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 whitespace-nowrap">
                      {p.proposal_code || `#${p.id || p.proposal_id}`}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 max-w-xs truncate">{p.title || '—'}</p>
                      {p.proposer_name && (
                        <p className="text-xs text-gray-400 mt-0.5">{p.proposer_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {p.proposal_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {p.department_name || p.department || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {p.current_stage?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onSelectProposal(p.id || p.proposal_id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
