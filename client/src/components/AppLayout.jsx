import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-emerald-800 text-white' : 'text-emerald-50 hover:bg-emerald-800/70'
  }`

export default function AppLayout() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-emerald-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-sm font-semibold tracking-wide text-white">
            Carbon Tracker
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <nav className="flex flex-wrap gap-1">
                <NavLink to="/" end className={navClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/upload" className={navClass}>
                  Upload
                </NavLink>
                <NavLink to="/reports" className={navClass}>
                  Reports
                </NavLink>
                <NavLink to="/settings" className={navClass}>
                  Settings
                </NavLink>
              </nav>
              <div className="flex items-center gap-2 pl-2 border-l border-emerald-700">
                <span className="text-xs text-emerald-200 hidden sm:block">
                  {user?.name}
                  <span className="ml-1 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                    {user?.role}
                  </span>
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md px-3 py-2 text-sm font-medium text-emerald-50 hover:bg-emerald-800/70"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <NavLink to="/login" className={navClass}>
              Sign in
            </NavLink>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
