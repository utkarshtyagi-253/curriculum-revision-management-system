import { useState } from 'react'
import { createMilestone, updateMilestone, uploadDocument } from '../services/api.js'

export function MilestoneEditor({ proposal, milestones, onRefresh }) {
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(false)
  async function create(e) {
    e.preventDefault(); const form = new FormData(e.currentTarget)
    setBusy(true); setError('')
    try { await createMilestone(proposal.id,Object.fromEntries(form)); await onRefresh() }
    catch(e) {setError(e.message)} finally {setBusy(false)}
  }
  async function update(e,m) {
    e.preventDefault(); const data = Object.fromEntries(new FormData(e.currentTarget))
    setBusy(true); setError('')
    try { await updateMilestone(m.id,data); await onRefresh() }
    catch(e) {setError(e.message)} finally {setBusy(false)}
  }
  return <div className="space-y-4">
    {error && <p role="alert" className="text-red-700">{error}</p>}
    <form onSubmit={create} className="grid sm:grid-cols-3 gap-3 p-4 bg-primary-50 rounded-xl">
      <input aria-label="Milestone title" required name="title" placeholder="Milestone title" className="border rounded-lg p-2" />
      <input aria-label="Target date" required name="target_date" type="date" className="border rounded-lg p-2" />
      <button disabled={busy} className="bg-primary-700 text-white rounded-lg p-2">Add milestone</button>
    </form>
    {milestones.map(m=><form key={m.id} onSubmit={e=>update(e,m)} className="border rounded-xl p-4 space-y-3">
      <p className="font-semibold">{m.title} <span className="text-xs text-gray-500">Due {m.target_date || 'unscheduled'}</span></p>
      <div className="flex flex-wrap gap-3">
        <select aria-label={`${m.title} status`} name="status" defaultValue={m.status} className="border rounded-lg p-2">{['Not Started','In Progress','Completed','Delayed'].map(s=><option key={s}>{s}</option>)}</select>
        <input aria-label="Evidence reference" name="evidence_reference" defaultValue={m.evidence_reference} placeholder="Evidence reference" className="border rounded-lg p-2 flex-1" />
        <button disabled={busy} className="bg-primary-700 text-white rounded-lg px-4">Save status</button>
      </div>
    </form>)}
  </div>
}
export function DocumentUploader({ proposalId,onRefresh }) {
  const [error,setError] = useState(''); const [busy,setBusy] = useState(false)
  async function upload(e) {
    const file=e.target.files[0]; if(!file) return
    if(file.size>5*1024*1024) {setError('Maximum file size is 5 MB.'); return}
    setBusy(true); setError('')
    try {
      const file_data = await new Promise((resolve,reject)=>{const reader=new FileReader(); reader.onload=()=>resolve(reader.result); reader.onerror=reject; reader.readAsDataURL(file)})
      await uploadDocument(proposalId,{file_name:file.name,file_type:file.type,file_size:file.size,file_data}); await onRefresh()
    } catch(e) {setError(e.message)} finally {setBusy(false)}
  }
  return <div className="p-4 bg-primary-50 rounded-xl"><label className="text-sm font-medium">Attach supporting document (PDF, text, DOCX; up to 5 MB)<input aria-label="Supporting document" type="file" accept=".pdf,.txt,.docx" disabled={busy} onChange={upload} className="block mt-2" /></label>{busy && <p>Uploading…</p>}{error && <p role="alert" className="text-red-700">{error}</p>}</div>
}
