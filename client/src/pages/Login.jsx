import { useState, useEffect } from 'react'
import { GraduationCap, Mail, Lock, Zap, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getDemoUsers } from '../services/api.js'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [demoUsers, setDemoUsers] = useState([])
  const [demoLoading, setDemoLoading] = useState(true)

  useEffect(() => {
    getDemoUsers()
      .then(data => setDemoUsers(Array.isArray(data) ? data : (data.users || [])))
      .catch(() => {})
      .finally(() => setDemoLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter email and password.'); return }
    setError(''); setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  async function quickLogin(u) {
    setError(''); setLoading(true)
    setEmail(u.email)
    setPassword(u.password || u.default_password || '')
    try {
      await login(u.email, u.password || u.default_password || '')
    } catch (err) {
      setError(err.message || 'Quick login failed.')
    } finally {
      setLoading(false)
    }
  }

  const ROLE_COLORS = {
    faculty_proposer: 'bg-blue-50 border-blue-200 text-blue-700',
    programme_coordinator: 'bg-purple-50 border-purple-200 text-purple-700',
    hod: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    dcc_reviewer: 'bg-orange-50 border-orange-200 text-orange-700',
    academic_office: 'bg-teal-50 border-teal-200 text-teal-700',
    senate_member: 'bg-pink-50 border-pink-200 text-pink-700',
    admin: 'bg-red-50 border-red-200 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">

        {/* Left panel – Branding */}
        <div className="hidden md:flex flex-col justify-center text-white p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <GraduationCap className="w-8 h-8 text-primary-800" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CRMS</h1>
              <p className="text-primary-200 text-sm">LNMIIT Jaipur</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-4 leading-tight">
            Curriculum Revision<br />Management System
          </h2>
          <p className="text-primary-200 text-sm leading-relaxed mb-8">
            Streamline curriculum proposals, reviews, and approvals across departments, 
            committees, and academic bodies — all in one unified platform.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Team', value: 'T017' },
              { label: 'Course', value: 'CS314' },
              { label: 'Institute', value: 'LNMIIT' },
              { label: 'Location', value: 'Jaipur' },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-primary-200 text-xs font-medium">{item.label}</p>
                <p className="text-white font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel – Login form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Mobile header */}
          <div className="md:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary-800 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-primary-800">CRMS – LNMIIT</h1>
              <p className="text-xs text-gray-500">Curriculum Revision Management</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to your account to continue</p>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@lnmiit.ac.in"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-800 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Demo users */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Quick Login (Demo)
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {demoLoading ? (
              <div className="flex justify-center py-2">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {demoUsers.map(u => {
                  const role = u.role || u.roles?.[0] || ''
                  const colorClass = ROLE_COLORS[role] || 'bg-gray-50 border-gray-200 text-gray-700'
                  return (
                    <button
                      key={u.email}
                      onClick={() => quickLogin(u)}
                      disabled={loading}
                      className={`flex flex-col items-start p-2.5 rounded-lg border text-xs font-medium transition-all hover:shadow-sm disabled:opacity-60 ${colorClass}`}
                    >
                      <span className="font-semibold truncate w-full">{u.name}</span>
                      <span className="opacity-70 truncate w-full">{u.role_label || role}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
