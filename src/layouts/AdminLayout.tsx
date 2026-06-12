import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, ClipboardList, Building2, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function AdminLayout() {
  const { signOut } = useAuth()

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: Users, label: 'Utilisateurs', end: false },
    { to: '/admin/orders', icon: ClipboardList, label: 'Commandes', end: false },
    { to: '/admin/pharmacies', icon: Building2, label: 'Pharmacies', end: false },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-slate-900 text-white flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <p className="font-semibold text-sm">PharmaAdmin</p>
              <p className="text-slate-400 text-xs">Panneau Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all w-full"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-56 min-h-screen overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
