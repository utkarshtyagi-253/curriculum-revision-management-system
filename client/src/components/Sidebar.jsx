import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  ClipboardCheck,
  Bell,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const ALL_ITEMS = [
  {id:'administration',label:'Administration',icon:ShieldCheck,roles:['admin']},
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: null, // visible to all
  },
  {
    id: 'proposals',
    label: 'All Proposals',
    icon: BookOpen,
    roles: null,
  },
  {
    id: 'my-proposals',
    label: 'My Proposals',
    icon: FileText,
    roles: ['faculty_proposer', 'programme_coordinator', 'hod'],
  },
  {
    id: 'new-proposal',
    label: 'New Proposal',
    icon: PlusCircle,
    roles: ['faculty_proposer'],
  },
  {
    id: 'pending-reviews',
    label: 'Pending Reviews',
    icon: ClipboardCheck,
    roles: ['programme_coordinator', 'hod', 'dcc_reviewer', 'academic_office', 'senate_member'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    roles: null,
  },
  {
    id: 'audit',
    label: 'Audit Log',
    icon: ShieldCheck,
    roles: ['admin', 'academic_office'],
  },
]

export default function Sidebar({ currentPage, onPageChange, collapsed, onToggle }) {
  const { user } = useAuth()

  const visibleItems = ALL_ITEMS.filter(item => {
    if (!item.roles) return true
    return item.roles.some(r => user?.roles?.includes(r))
  })

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 z-40 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <ul className="space-y-1 px-2">
          {visibleItems.map(item => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <li key={item.id}>
                <button
                  onClick={() => onPageChange(item.id)}
                  aria-label={item.label}
                  title={item.label}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-600' : ''}`} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {item.id === 'new-proposal' && !collapsed && (
                    <span className="ml-auto text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full font-semibold">New</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Toggle collapse button */}
      <div className="p-2 border-t border-gray-100">
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}
