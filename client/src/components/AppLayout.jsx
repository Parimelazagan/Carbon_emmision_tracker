import React, { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import CarbonTrackLogo from './CarbonTrackLogo.jsx'
import {
  LayoutDashboard,
  Activity,
  UploadCloud,
  Building2,
  FileText,
  Database,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  UserCheck,
} from 'lucide-react'

const navGroups = [
  {
    label: 'EMISSIONS & INGESTION',
    items: [
      { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard, exact: true },
      { to: '/consumption', label: 'Consumption Data Hub', icon: Activity },
      { to: '/upload', label: 'Bulk Ingestion Center', icon: UploadCloud },
      { to: '/facilities', label: 'Facilities & Sites', icon: Building2 },
    ],
  },
  {
    label: 'COMPLIANCE & GOVERNANCE',
    items: [
      { to: '/reports', label: 'Reports & Compliance', icon: FileText },
      { to: '/emission-factors', label: 'Emission Factors', icon: Database },
      { to: '/settings', label: 'Organization & Team', icon: Settings },
    ],
  },
]

export default function AppLayout() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  // Public / unauthenticated layout (clean centered shell for Login / Signup / Accept Invite)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/login" className="flex items-center gap-2">
              <CarbonTrackLogo />
            </Link>
            <div className="flex items-center gap-3">
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors ${
                    isActive ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900'
                  }`
                }
              >
                Sign In
              </NavLink>
              <NavLink
                to="/signup"
                className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              >
                Register Organization
              </NavLink>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 CarbonTrack Technologies Inc. — Climate Accounting & ESG Intelligence</span>
            <div className="flex items-center gap-4 text-slate-400">
              <span>ISO 14064 Aligned</span>
              <span>•</span>
              <span>GHG Protocol Standard</span>
              <span>•</span>
              <span>SOC 2 Type II</span>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  const orgName = typeof user?.organization === 'object' ? user?.organization?.name : 'Corporate Organization'
  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'CT'

  const roleStyles = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    data_entry: 'bg-blue-50 text-blue-700 border-blue-200',
    viewer: 'bg-slate-100 text-slate-700 border-slate-200',
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <CarbonTrackLogo />
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Persistent Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col justify-between transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-screen lg:shrink-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Link to="/" onClick={() => setMobileOpen(false)}>
              <CarbonTrackLogo />
            </Link>
            <span className="text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60">
              v2.4
            </span>
          </div>

          {/* Active Org Badge */}
          <div className="px-4 py-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                {orgName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{orgName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span className="text-[10px] font-medium text-emerald-700 tracking-tight">Scope 1-3 Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Groups */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
            {navGroups.map((group, idx) => (
              <div key={idx} className="space-y-1">
                <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = item.exact
                    ? location.pathname === item.to
                    : location.pathname === item.to || location.pathname.startsWith(item.to + '/')

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.exact}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  )
                })}
              </div>
            ))}
          </div>

          {/* User Session Footer Card */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{user?.name}</p>
                  <span
                    className={`inline-block text-[9px] uppercase tracking-wider font-mono font-semibold px-1.5 py-0.2 rounded border mt-0.5 ${
                      roleStyles[user?.role] || roleStyles.viewer
                    }`}
                  >
                    {user?.role?.replace('_', ' ') || 'viewer'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="text-slate-400">CarbonTrack</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 font-semibold capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1).replace('-', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 px-2.5 py-1 rounded-full text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono text-[11px]">Audit Ready • ISO 14064 Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline font-mono text-[11px] text-slate-600">{user?.email}</span>
            </div>
          </div>
        </header>

        {/* Page View Viewport */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
