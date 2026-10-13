const BASE = '/api'
const roles = {'System Administrator':'admin','Faculty Proposer':'faculty_proposer','Programme Coordinator / HOD':'hod','DCC Reviewer':'dcc_reviewer','Academic Office':'academic_office','Senate / Academic Council':'senate_member'}
const statuses = {'Draft':'draft','Submitted / Under Review':'under_review','Under Review':'under_review','Committee Review':'committee_review','Senate Review':'senate_review','Approved':'approved','Conditional Approval':'conditionally_approved','Returned for Revision':'returned_for_revision','Rejected':'rejected','Implemented':'implemented'}
const types = {'new_course':'New Course','course_modification':'Course Modification','course_discontinuation':'Course Discontinuation','programme_structure_change':'Programme Structure Change'}
function normalize(data) {
  if (Array.isArray(data)) return data.map(normalize)
  if (!data || typeof data !== 'object') return data
  const result = Object.fromEntries(Object.entries(data).map(([k,v])=>[k,normalize(v)]))
  if (result.roles) result.roles = (Array.isArray(result.roles) ? result.roles : result.roles.split(', ')).map(r=>roles[r] || r)
  if (result.current_status) result.status = statuses[result.current_status] || result.current_status
  if (result.owner_id) result.proposer_id = result.owner_id
  if (result.owner_name) result.proposer_name = result.owner_name
  if (result.stage_name) {result.stage = result.stage_name; result.current_stage = result.stage_name}
  if (result.owner_id) result.proposal_code = result.id
  if (result.details) result.description = result.details
  if (result.object_type) result.entity_type = result.object_type
  if (result.object_id) result.entity_id = result.object_id
  for (const key of ['created_at','updated_at','timestamp','action_timestamp','decision_timestamp','submission_timestamp']) {
    if (typeof result[key] === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(result[key])) result[key] = result[key].replace(' ','T') + 'Z'
  }
  if (result.timestamp) result.created_at = result.timestamp.replace(' ','T').replace(/(?<!Z)$/, 'Z')
  if (result.action_timestamp) result.created_at = result.action_timestamp.replace(' ','T').replace(/(?<!Z)$/, 'Z')
  if (result.read_status !== undefined) result.is_read = Boolean(result.read_status)
  if (result.event_type) result.type = result.event_type.toLowerCase()
  if (result.author_name) result.created_by_name = result.author_name
  if (result.versions) {
    const latest = result.versions.find(v=>!v.is_immutable) || result.versions[0] || {}
    for (const field of ['academic_rationale','prerequisites','credits','syllabus_changes','resource_implications']) result[field] = latest[field]
    result.syllabus_change_description = latest.syllabus_changes
  }
  return result
}
function payload(data) { return {...data, proposal_type:types[data.proposal_type] || data.proposal_type} }


function getToken() {
  return localStorage.getItem('crms_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('crms_token')
    window.dispatchEvent(new Event('crms:unauthorized'))
    throw new Error('Unauthorized')
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`)
  return normalize(data)
}

// Auth
export function login(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getMe() {
  return request('/auth/me')
}

export function getDemoUsers() {
  return request('/auth/demo-users').then(users=>users.map(u=>({...u,password: {'faculty@lnmiit.ac.in':'Faculty@123','hod@lnmiit.ac.in':'Hod@123','dcc@lnmiit.ac.in':'Dcc@123','academics@lnmiit.ac.in':'Academic@123','senate@lnmiit.ac.in':'Senate@123','admin@lnmiit.ac.in':'Admin@123'}[u.email]})))
}

// Proposals
export function getProposals(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k,v]) => { if(v) params.set(k, k === 'status' ? (Object.keys(statuses).find(s=>statuses[s]===v) || v) : k === 'type' ? (types[v] || v) : v) })
  const qs = params.toString()
  return request(`/proposals${qs ? `?${qs}` : ''}`)
}

export function getProposalStats() {
  return request('/proposals/stats')
}

export function getProposalById(id) {
  return request(`/proposals/${id}`)
}

export function createProposal(data) {
  return request('/proposals', { method: 'POST', body: JSON.stringify(payload(data)) })
}

export function saveDraft(id, data) {
  return request(`/proposals/${id}/draft`, { method: 'PUT', body: JSON.stringify(payload(data)) })
}

export function submitProposal(id) {
  return request(`/proposals/${id}/submit`, { method: 'POST' })
}

export function compareVersions(id, v1, v2) {
  return request(`/proposals/${id}/compare?v1=${v1}&v2=${v2}`)
}

export function getTimeline(id) {
  return request(`/proposals/${id}/timeline`)
}

// Workflow
export function getPendingActions() {
  return request('/workflow/pending')
}

export function reviewProposal(id, data) {
  return request(`/workflow/proposals/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({...data, action_type: {recommend_forward:'Recommend/Forward',recommend:'Recommend/Forward',forward:'Recommend/Forward',return_for_revision:'Return for Revision',returned_for_revision:'Return for Revision'}[data.action_type] || data.action_type, reason:data.reason || data.comment}),
  })
}

export function recordDecision(id, data) {
  return request(`/workflow/proposals/${id}/decision`, {
    method: 'POST',
    body: JSON.stringify(payload(data)),
  })
}

export function getWorkflowStages() {
  return request('/workflow/stages')
}

// Master Data
export function getDepartments() {
  return request('/master-data/departments')
}

export function getProgrammes() {
  return request('/master-data/programmes')
}

// Notifications
export function getNotifications() {
  return request('/notifications')
}

// Audit
export function getAuditLog(filters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
  const qs = params.toString()
  return request(`/audit${qs ? `?${qs}` : ''}`)
}

// Milestones
export function getMilestones(proposalId) {
  return request(`/milestones/${proposalId}`)
}

export const markNotificationRead = id => request(`/notifications/${id}/read`, {method:'PUT'})
export const markAllNotificationsRead = () => request('/notifications/read-all', {method:'PUT'})
export const createMilestone = (id,data) => request(`/milestones/proposal/${id}`, {method:'POST',body:JSON.stringify(data)})
export const updateMilestone = (id,data) => request(`/milestones/${id}`, {method:'PUT',body:JSON.stringify(data)})
export const uploadDocument = (id,data) => request(`/proposals/${id}/documents`, {method:'POST',body:JSON.stringify(data)})
export const getMasterData = () => request('/master-data/summary')
export const addDepartment = data => request('/master-data/departments', {method:'POST',body:JSON.stringify(data)})
export const addCourse = data => request('/master-data/courses', {method:'POST',body:JSON.stringify(data)})
