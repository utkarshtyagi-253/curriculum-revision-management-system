import { useEffect, useState } from 'react'
import { getStakeholderInvitation, submitStakeholderFeedback } from '../services/api.js'

export default function InvitationFeedback({token}) {
  const [invite,setInvite]=useState(null),[email,setEmail]=useState(''),[text,setText]=useState(''),[error,setError]=useState(''),[done,setDone]=useState(false),[busy,setBusy]=useState(true)
  useEffect(()=>{getStakeholderInvitation(token).then(data=>{setInvite(data);setEmail(data.email)}).catch(e=>setError(e.message)).finally(()=>setBusy(false))},[token])
  async function submit(e){e.preventDefault();setBusy(true);setError('');try{await submitStakeholderFeedback({token,email,feedback_text:text});setDone(true)}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5"><section className="w-full max-w-2xl bg-white border rounded-2xl p-6 space-y-4">
    <h1 className="text-xl font-bold">Curriculum proposal feedback</h1>
    {busy&&!invite&&!error?<p className="text-sm text-gray-500">Checking invitation…</p>:null}
    {error&&<p role="alert" className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</p>}
    {done?<p className="p-4 bg-green-50 text-green-800 rounded-lg">Thank you. Your feedback has been recorded.</p>:invite&&<>
      <div className="p-4 bg-gray-50 rounded-xl space-y-2"><p><span className="font-medium">Proposal:</span> {invite.title}</p><p><span className="font-medium">Type:</span> {invite.proposal_type}</p><p><span className="font-medium">Programmes:</span> {invite.affected_programmes||'—'}</p><p><span className="font-medium">Academic rationale:</span> {invite.academic_rationale||'—'}</p><p className="text-xs text-gray-500">Invitation for {invite.category}; expires {new Date(invite.expiry_date).toLocaleString()}.</p></div>
      <form onSubmit={submit} className="space-y-3"><label className="block text-sm">Invited email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" /></label><label className="block text-sm">Your feedback<textarea required minLength="20" maxLength="5000" rows="6" value={text} onChange={e=>setText(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Share your perspective (20–5,000 characters)" /></label><button disabled={busy} className="px-4 py-2 bg-primary-800 text-white rounded-lg disabled:opacity-50">Submit feedback</button></form>
    </>}
  </section></main>
}
