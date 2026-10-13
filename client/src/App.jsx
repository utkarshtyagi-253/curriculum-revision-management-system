import Administration from './pages/Administration.jsx'
import { useState, useEffect } from 'react'
import { useAuth } from './context/AuthContext.jsx'

// Components
import Navbar  from './components/Navbar.jsx'
import Sidebar from './components/Sidebar.jsx'

// Pages
import Login          from './pages/Login.jsx'
import Dashboard      from './pages/Dashboard.jsx'
import ProposalList   from './pages/ProposalList.jsx'
import ProposalForm   from './pages/ProposalForm.jsx'
import ProposalDetail from './pages/ProposalDetail.jsx'
import PendingReviews from './pages/PendingReviews.jsx'
import Notifications  from './pages/Notifications.jsx'
import AuditLog       from './pages/AuditLog.jsx'

export default function App() {
  const { user, loading } = useAuth()

  const [page, setPage]                 = useState('dashboard')
  const [selectedProposalId, setSelectedProposalId] = useState(null)
  const [editingProposalId, setEditingProposalId]   = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed]     = useState(false)

  // Reset to dashboard when user changes
  useEffect(() => {
    if (user) setPage('dashboard')
  }, [user?.id])

  // Auth loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading CRMS…</p>
        </div>
      </div>
    )
  }

  // Unauthenticated
  if (!user) return <Login />

  // Page-change handler (centralised navigation)
  function navigate(target, extraId) {
    if (target === 'dashboard') {
      setSelectedProposalId(null)
      setEditingProposalId(null)
      setPage('dashboard')
    } else if (target === 'new-proposal') {
      setEditingProposalId(null)
      setSelectedProposalId(null)
      setPage('new-proposal')
    } else if (target === 'proposal-detail' && extraId) {
      setSelectedProposalId(extraId)
      setEditingProposalId(null)
      setPage('proposal-detail')
    } else if (target === 'edit-proposal' && extraId) {
      setEditingProposalId(extraId)
      setSelectedProposalId(null)
      setPage('edit-proposal')
    } else {
      setSelectedProposalId(null)
      setEditingProposalId(null)
      setPage(target)
    }
  }

  function handleSelectProposal(id) {
    navigate('proposal-detail', id)
  }

  function handleEditProposal(id) {
    navigate('edit-proposal', id)
  }

  function handleProposalCreated(id) {
    navigate('proposal-detail', id)
  }

  const sidebarWidth = sidebarCollapsed ? 'ml-16' : 'ml-56'

  // Render the active page content
  function renderPage() {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            onPageChange={navigate}
            onSelectProposal={handleSelectProposal}
          />
        )

      case 'proposals':
      case 'my-proposals':
        return (
          <ProposalList
            onSelectProposal={handleSelectProposal}
            mine={page === 'my-proposals'}
          />
        )

      case 'new-proposal':
        return (
          <ProposalForm
            proposalId={null}
            onBack={() => navigate('proposals')}
            onProposalCreated={handleProposalCreated}
          />
        )

      case 'edit-proposal':
        return (
          <ProposalForm
            proposalId={editingProposalId}
            onBack={() => navigate('proposal-detail', editingProposalId)}
            onProposalCreated={handleProposalCreated}
          />
        )

      case 'proposal-detail':
        return (
          <ProposalDetail
            proposalId={selectedProposalId}
            onBack={() => navigate('proposals')}
            onEdit={handleEditProposal}
          />
        )

      case 'pending-reviews':
        return (
          <PendingReviews
            onSelectProposal={handleSelectProposal}
          />
        )

      case 'notifications':
        return <Notifications />

      case 'administration':
        return <Administration />

      case 'audit':
        return <AuditLog />

      default:
        return (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <p className="text-lg font-semibold">Page not found</p>
            <button
              onClick={() => navigate('dashboard')}
              className="mt-4 text-sm text-primary-600 hover:underline"
            >
              Go to Dashboard
            </button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navbar */}
      <Navbar onPageChange={navigate} currentPage={page} />

      {/* Sidebar */}
      <Sidebar
        currentPage={page}
        onPageChange={navigate}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(v => !v)}
      />

      {/* Main content */}
      <main className={`transition-all duration-300 pt-16 ${sidebarWidth} min-h-screen`}>
        <div className="p-6 max-w-screen-xl">
          {/* Breadcrumb */}
          <Breadcrumb page={page} onNavigate={navigate} proposalId={selectedProposalId} />

          {/* Page content */}
          <div className="mt-4">
            {renderPage()}
          </div>
        </div>
      </main>
    </div>
  )
}

function Breadcrumb({ page, onNavigate, proposalId }) {
  const crumbs = []

  const pageMap = {
    'dashboard':       'Dashboard',
    'proposals':       'All Proposals',
    'my-proposals':    'My Proposals',
    'new-proposal':    'New Proposal',
    'edit-proposal':   'Edit Proposal',
    'proposal-detail': 'Proposal Detail',
    'pending-reviews': 'Pending Reviews',
    'notifications':   'Notifications',
    'audit':           'Audit Log',
  }

  if (page !== 'dashboard') {
    crumbs.push({ label: 'Dashboard', action: () => onNavigate('dashboard') })
  }

  if (page === 'proposal-detail' || page === 'edit-proposal') {
    crumbs.push({ label: 'All Proposals', action: () => onNavigate('proposals') })
  }

  crumbs.push({ label: pageMap[page] || page, action: null })

  if (crumbs.length <= 1) return null

  return (
    <nav className="flex items-center gap-1 text-xs text-gray-500 mb-1">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300">/</span>}
          {c.action ? (
            <button onClick={c.action} className="hover:text-primary-600 transition-colors">
              {c.label}
            </button>
          ) : (
            <span className="text-gray-700 font-medium">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
