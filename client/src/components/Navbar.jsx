import { useState, useEffect } from 'react'
import { Bell, LogOut, ChevronDown, GraduationCap } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { getNotifications } from '../services/api.js'

const ROLE_LABELS = {
  faculty_proposer:       { label: 'Faculty',     color: 'bg-blue-100 text-blue-800' },
  programme_coordinator:  { label: 'Coordinator', color: 'bg-purple-100 text-purple-800' },
  hod:                    { label: 'HoD',          color: 'bg-indigo-100 text-indigo-800' },
  dcc_reviewer:           { label: 'DCC',          color: 'bg-orange-100 text-orange-800' },
  academic_office:        { label: 'Academics',   color: 'bg-teal-100 text-teal-800' },
  senate_member:          { label: 'Senate',      color: 'bg-pink-100 text-pink-800' },
  admin:                  { label: 'Admin',       color: 'bg-red-100 text-red-800' },
}

export default function Navbar({ onPageChange, currentPage }) {
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount]   = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    if (!user) return
    getNotifications()
      .then(data => {
        const list = Array.isArray(data) ? data : (data.notifications || [])
        setUnreadCount(list.filter(n => !n.read && !n.is_read).length)
      })
      .catch(() => {})
  }, [user, currentPage])

  const primaryRole = user?.roles?.[0]
  const roleInfo = ROLE_LABELS[primaryRole] || { label: primaryRole || 'User', color: 'bg-gray-100 text-gray-800' }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary-800 shadow-lg">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-white rounded-lg">
            <GraduationCap className="w-5 h-5 text-primary-800" />
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-bold text-sm leading-tight">CRMS</p>
            <p className="text-primary-200 text-xs leading-tight">LNMIIT Jaipur</p>
          </div>
          <div className="hidden md:block ml-2 pl-3 border-l border-primary-600">
            <p className="text-primary-100 text-xs font-medium">Curriculum Revision Management System</p>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notifications bell */}
          <button
            aria-label="Notifications"
            onClick={() => onPageChange('notifications')}
            className={`relative p-2 rounded-full transition-colors ${
              currentPage === 'notifications'
                ? 'bg-primary-600 text-white'
                : 'text-primary-200 hover:bg-primary-700 hover:text-white'
            }`}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-xs font-bold bg-red-500 text-white rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              aria-label="User menu"
              onClick={() => setShowUserMenu(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-primary-100 hover:bg-primary-700 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-white leading-tight">{user?.name || 'User'}</p>
                <span className={`inline-block text-xs px-1.5 py-0.5 rounded font-medium ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); logout() }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
