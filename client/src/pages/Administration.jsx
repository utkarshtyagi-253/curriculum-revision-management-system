import { useState, useEffect, useCallback } from 'react'
import {
  ShieldCheck, Settings, Building, BookOpen, Users, Layers,
  RefreshCw, PlusCircle, AlertCircle, CheckCircle, Loader2, Trash2,
  GraduationCap, ChevronRight
} from 'lucide-react'
import { getMasterData, getWorkflowStages, addDepartment, addCourse, getAdminUsers, createAdminUser, updateAdminUser, addWorkflowStage, updateWorkflowStage, deleteWorkflowStage } from '../services/api.js'
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
            step={f.step}
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
  const [admin, setAdmin] = useState({ users:[], roles:[], departments:[] })

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [d, s, a] = await Promise.all([getMasterData(), getWorkflowStages(), getAdminUsers()])
      setData(d)
      setStages(Array.isArray(s) ? s : s.stages || [])
      setAdmin(a)
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

  async function handleCreateUser(e) {
    e.preventDefault()
    const form=e.currentTarget, values=Object.fromEntries(new FormData(form))
    values.role_ids=Array.from(form.querySelectorAll('[name="role_ids"]:checked')).map(input=>input.value)
    setBusy(true); setError(''); setSuccess('')
    try { await createAdminUser(values); form.reset(); setSuccess('User created.'); await load() }
    catch(error) { setError(error.message || 'Could not create user.') }
    finally { setBusy(false) }
  }

  async function toggleUserRole(user, roleId, checked) {
    const userRoleNames=(user.roles || '').split(', ').filter(Boolean)
    const current=admin.roles.filter(r=>userRoleNames.includes(r.name)).map(r=>r.id)
    const next=checked ? [...new Set([...current,roleId])] : current.filter(id=>id!==roleId)
    if (!next.length) { setError('Each account must keep at least one role.'); return }
    try { await updateAdminUser(user.id,{role_ids:next}); await load() }
    catch(error) { setError(error.message || 'Could not update roles.') }
  }

  async function toggleUserStatus(user) {
    try { await updateAdminUser(user.id,{account_status:user.account_status==='ACTIVE'?'INACTIVE':'ACTIVE'}); await load() }
    catch(error) { setError(error.message || 'Could not update account.') }
  }

  async function handleAddStage(e) {
    e.preventDefault(); const form=e.currentTarget, values=Object.fromEntries(new FormData(form))
    setBusy(true); setError('')
    try { await addWorkflowStage(values); form.reset(); setSuccess('Workflow stage added.'); await load() }
    catch(error) { setError(error.message || 'Could not add workflow stage.') }
    finally { setBusy(false) }
  }

  async function handleRemoveStage(stage) {
    setError('')
    try { await deleteWorkflowStage(stage.id); setSuccess('Workflow stage removed.'); await load() }
    catch(error) { setError(error.message || 'Could not remove workflow stage.') }
  }

  async function handleUpdateStage(e, stage) {
    e.preventDefault(); const values=Object.fromEntries(new FormData(e.currentTarget)); values.is_mandatory=values.is_mandatory==='on'
    setBusy(true); setError('')
    try { await updateWorkflowStage(stage.id,values); setSuccess('Workflow stage updated.'); await load() }
    catch(error) { setError(error.message || 'Could not update workflow stage.') }
    finally { setBusy(false) }
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
          <SectionCard title="Review Workflow" icon={Layers}>
            <p className="text-xs text-gray-500 mb-4">Manage stages, responsible roles, permitted actions and sequence. Active proposals prevent changes to their current stage role or sequence.</p>
            <form onSubmit={handleAddStage} className="flex flex-wrap gap-3 mb-5 p-4 bg-primary-50 border border-primary-100 rounded-xl">
              <input name="name" required placeholder="Stage name" className="flex-1 min-w-40 px-3 py-2 border rounded-lg text-sm" />
              <select name="responsible_role" required className="px-3 py-2 border rounded-lg text-sm"><option value="">Responsible role</option>{admin.roles.map(r=><option key={r.id}>{r.name}</option>)}</select>
              <input name="permitted_actions" required placeholder="Permitted actions (comma separated)" className="flex-1 min-w-52 px-3 py-2 border rounded-lg text-sm" />
              <button disabled={busy} className="px-4 py-2 bg-primary-800 text-white rounded-lg text-sm disabled:opacity-50">Add stage</button>
            </form>
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
                    <form onSubmit={e=>handleUpdateStage(e,s)} className="flex-1 grid sm:grid-cols-2 gap-2">
                      <input name="name" required defaultValue={s.name} aria-label="Stage name" className="px-2 py-1 border rounded text-sm" />
                      <select name="responsible_role" defaultValue={s.responsible_role} aria-label="Responsible role" className="px-2 py-1 border rounded text-sm">{admin.roles.map(r=><option key={r.id}>{r.name}</option>)}</select>
                      <input name="permitted_actions" required defaultValue={s.permitted_actions} aria-label="Permitted actions" className="px-2 py-1 border rounded text-xs sm:col-span-2" />
                      <label className="flex items-center gap-2 text-xs text-gray-600"><span>Sequence</span><input name="sequence_no" type="number" min="1" required defaultValue={s.sequence_no} className="w-16 px-2 py-1 border rounded" /><input name="is_mandatory" type="checkbox" defaultChecked={Boolean(s.is_mandatory)} /> Mandatory</label>
                      <button disabled={busy} className="justify-self-start px-3 py-1 bg-white border rounded text-xs text-primary-700 disabled:opacity-50">Save stage</button>
                      {s.workflow_name && <span className="sm:col-span-2 text-xs text-gray-400">Workflow: {s.workflow_name}</span>}
                    </form>
                    <button onClick={()=>handleRemoveStage(s)} className="p-2 text-gray-400 hover:text-red-600" title="Remove stage"><Trash2 className="w-4 h-4" /></button>
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
                { name: 'credits', label: 'Credits (0.5 increments)', type: 'number', placeholder: 'e.g., 4.5', required: true, min: '0.5', max: '12', step: '0.5', width: 'w-28' },
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

          <SectionCard title="User & Role Management" icon={ShieldCheck}>
            <p className="text-xs text-gray-500 mb-4">Create local demonstration accounts, assign one or more approved roles, and deactivate access when needed.</p>
            <form onSubmit={handleCreateUser} className="p-4 mb-5 bg-primary-50 border border-primary-100 rounded-xl space-y-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input name="name" required minLength="2" placeholder="Full name" className="px-3 py-2 border rounded-lg text-sm" />
                <input name="email" type="email" required placeholder="Email address" className="px-3 py-2 border rounded-lg text-sm" />
                <input name="password" type="password" required minLength="10" placeholder="Initial password (10+ chars)" className="px-3 py-2 border rounded-lg text-sm" />
                <select name="department_id" className="px-3 py-2 border rounded-lg text-sm"><option value="">No department</option>{admin.departments.map(d=><option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}</select>
              </div>
              <div className="flex flex-wrap gap-3">{admin.roles.map(role=><label key={role.id} className="flex gap-2 items-center text-xs text-gray-700"><input name="role_ids" type="checkbox" value={role.id} />{role.name}</label>)}</div>
              <button disabled={busy} className="px-4 py-2 rounded-lg bg-primary-800 text-white text-sm disabled:opacity-50">Create user</button>
            </form>
            <div className="overflow-x-auto">
              <table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-gray-500 border-b"><th className="py-2">Account</th><th>Roles (toggle to update)</th><th>Status</th><th /></tr></thead>
                <tbody className="divide-y">{admin.users.map(user=><tr key={user.id} className="align-top"><td className="py-3 pr-4"><div className="font-medium">{user.name}</div><div className="text-xs text-gray-500">{user.email}{user.department_name?` · ${user.department_name}`:''}</div></td><td className="py-3"><div className="flex flex-wrap gap-x-3 gap-y-2">{admin.roles.map(role=><label key={role.id} className="flex gap-1.5 items-center text-xs"><input type="checkbox" checked={(user.roles||'').split(', ').includes(role.name)} onChange={e=>toggleUserRole(user,role.id,e.target.checked)} />{role.name}</label>)}</div></td><td className="py-3 text-xs">{user.account_status}</td><td className="py-3 text-right"><button onClick={()=>toggleUserStatus(user)} className="text-xs text-primary-700 hover:underline">{user.account_status==='ACTIVE'?'Deactivate':'Reactivate'}</button></td></tr>)}</tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
