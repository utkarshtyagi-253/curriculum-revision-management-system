import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck, Settings, Building, BookOpen, Users, Layers,
  RefreshCw, PlusCircle, AlertCircle, CheckCircle, Loader2,
  GraduationCap, ChevronRight
} from 'lucide-react'
import { getMasterData, getWorkflowStages, addDepartment, addCourse } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary-600" />
          <h2 className="font-semibold text-gray-900">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function AddForm({ fields, onSubmit, busy }) {
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap gap-3 mb-5 p-4 bg-primary-50 border border-primary-100 rounded-xl">
      {fields.map(f => (
        f.type === 'select' ? (
          <select
            key={f.name}
            aria-label={f.label}
            name={f.name}
            required={f.required}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
          >
            <option value="">{f.placeholder}</option>
            {(f.options || []).map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : (
          <input
            key={f.name}
            type={f.type || 'text'}
            aria-label={f.label}
            name={f.name}
            required={f.required}
            placeholder={f.placeholder}
            min={f.min}
            max={f.max}
            className={`px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 ${f.width || 'flex-1 min-w-36'}`}
          />
        )
      ))}
      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-2 px-4 py-2 bg-primary-800 hover:bg-primary-700 text-white text-sm font-medium rounded-lg disabled:opacity-60 transition-colors"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
        Add
      </button>
    </form>
  )
}

export default function Administration() {
  const { hasRole } = useAuth()
  const [data, setData]       = useState(null)
  const [stages, setStages]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [d, s] = await Promise.all([getMasterData(), getWorkflowStages()])
      setData(d)
      setStages(Array.isArray(s) ? s : s.stages || [])
    } catch (e) {
      setError(e.message || 'Failed to load administration data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(e, kind) {
    e.preventDefault()
    const form = e.currentTarget
    const values = Object.fromEntries(new FormData(form))
    if (kind === 'course') values.credits = Number(values.credits)
    setBusy(true); setError(''); setSuccess('')
    try {
      await (kind === 'course' ? addCourse : addDepartment)(values)
      form.reset()
      setSuccess(`${kind === 'course' ? 'Course' : 'Department'} added successfully.`)
      await load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.message || `Failed to add ${kind}.`)
    } finally {
      setBusy(false)
    }
  }

  if (!hasRole('admin')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <ShieldCheck className="w-12 h-12 mb-3 text-gray-300" />
        <p className="text-lg font-semibold">Administrator access required.</p>
        <p className="text-sm mt-1">This section is restricted to System Administrators.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage academic master data, configured review workflow and system settings.
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

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

      {loading && !data ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-40 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Review Workflow (read-only per SRS) */}
          <SectionCard title="Review Workflow (read-only)" icon={Layers}>
            <p className="text-xs text-gray-400 mb-4">
              The configured approval sequence is displayed for reference. Workflow configuration is read-only in this implementation.
            </p>
            {stages.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No active workflow stages configured.</p>
            ) : (
              <ol className="space-y-3">
                {stages.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-4 p-4 bg-primary-50 border border-primary-100 rounded-xl"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {s.sequence_no || i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        <span className="font-medium">Responsible Role:</span> {s.responsible_role}
                      </p>
                      {s.permitted_actions && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="font-medium">Permitted Actions:</span> {s.permitted_actions}
                        </p>
                      )}
                      {s.workflow_name && (
                        <p className="text-xs text-gray-400 mt-1">Workflow: {s.workflow_name}</p>
                      )}
                    </div>
                    {i < stages.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-primary-400 mt-2 flex-shrink-0" />
                    )}
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>

          {/* Departments */}
          <SectionCard title="Departments" icon={Building}>
            <AddForm
              busy={busy}
              onSubmit={e => handleSave(e, 'department')}
              fields={[
                { name: 'name', label: 'Department name', placeholder: 'e.g., Computer Science & Engineering', required: true },
                { name: 'code', label: 'Department code', placeholder: 'Code e.g., CSE', required: true, width: 'w-28' },
              ]}
            />
            {!data?.departments?.length ? (
              <p className="text-sm text-gray-400 italic">No departments found.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.departments.map(d => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {d.code?.slice(0, 3) || '—'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{d.name}</p>
                      <p className="text-xs text-gray-500">{d.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Courses */}
          <SectionCard title="Courses" icon={BookOpen}>
            <AddForm
              busy={busy}
              onSubmit={e => handleSave(e, 'course')}
              fields={[
                { name: 'code',  label: 'Course code',  placeholder: 'e.g., CS401', required: true, width: 'w-32' },
                { name: 'title', label: 'Course title',  placeholder: 'Course title', required: true },
                { name: 'credits', label: 'Credits', type: 'number', placeholder: 'Credits', required: true, min: '1', max: '30', width: 'w-24' },
                {
                  name: 'department_id', label: 'Department', type: 'select', placeholder: 'Select department', required: true,
                  options: (data?.departments || []).map(d => ({ value: d.id, label: `${d.code} — ${d.name}` }))
                },
              ]}
            />
            {!data?.courses?.length ? (
              <p className="text-sm text-gray-400 italic">No courses found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Credits</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.courses.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-xs text-gray-700">{c.code}</td>
                        <td className="px-3 py-2 text-gray-900">{c.title}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{c.credits}</td>
                        <td className="px-3 py-2 text-xs text-gray-500">{c.department_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Programmes */}
          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard title="Programmes" icon={GraduationCap}>
              {!data?.programmes?.length ? (
                <p className="text-sm text-gray-400 italic">No programmes configured.</p>
              ) : (
                <ul className="space-y-2">
                  {data.programmes.map(p => (
                    <li key={p.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900">{p.name}</span>
                      {p.department_name && (
                        <span className="text-xs text-gray-400 ml-auto">{p.department_name}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Committees" icon={Users}>
              {!data?.committees?.length ? (
                <p className="text-sm text-gray-400 italic">No committees configured.</p>
              ) : (
                <ul className="space-y-2">
                  {data.committees.map(c => (
                    <li key={c.id} className="flex items-start gap-2 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        {c.scope && <p className="text-xs text-gray-500">{c.scope}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>

          {/* User Management Placeholder */}
          <SectionCard title="User & Role Management" icon={ShieldCheck}>
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Out of scope for this implementation</p>
                <p className="text-xs text-amber-700 mt-1">
                  Institutional SSO, user account creation and role administration are external integrations not connected
                  in this demonstration. Demo accounts are seeded automatically. See the SRS (Section 11.7) and README for details.
                </p>
              </div>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3 text-xs text-gray-500">
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50">
                <p className="font-semibold text-gray-700 mb-1">Roles in the system</p>
                {['Faculty Proposer','Programme Coordinator / HOD','DCC Reviewer','Academic Office','Senate / Academic Council','System Administrator']
                  .map(r => (
                    <div key={r} className="flex items-center gap-2 py-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                      <span>{r}</span>
                    </div>
                  ))
                }
              </div>
              <div className="p-3 border border-gray-100 rounded-lg bg-gray-50">
                <p className="font-semibold text-gray-700 mb-1">Demo accounts</p>
                {[
                  ['Faculty', 'faculty@lnmiit.ac.in'],
                  ['HOD', 'hod@lnmiit.ac.in'],
                  ['DCC', 'dcc@lnmiit.ac.in'],
                  ['Academic Office', 'academics@lnmiit.ac.in'],
                  ['Senate', 'senate@lnmiit.ac.in'],
                  ['Admin', 'admin@lnmiit.ac.in'],
                ].map(([role, email]) => (
                  <div key={email} className="flex justify-between py-0.5">
                    <span className="font-medium text-gray-600">{role}</span>
                    <span className="font-mono text-gray-400">{email}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
