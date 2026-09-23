import { Link, NavLink, Outlet } from 'react-router-dom'

const navClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-emerald-800 text-white' : 'text-emerald-50 hover:bg-emerald-800/70'
  }`

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-emerald-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-sm font-semibold tracking-wide text-white">
            Carbon Tracker
          </Link>
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
            <NavLink to="/login" className={navClass}>
              Login
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
