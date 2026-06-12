import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Package, User } from 'lucide-react'

export default function PharmacyLayout() {
  const navItems = [
    { to: '/pharmacy', icon: LayoutDashboard, label: 'Tableau', end: true },
    { to: '/pharmacy/orders', icon: ClipboardList, label: 'Commandes', end: false },
    { to: '/pharmacy/stock', icon: Package, label: 'Stock', end: false },
    { to: '/pharmacy/profile', icon: User, label: 'Profil', end: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 shadow-nav z-50 safe-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-secondary-600' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-secondary-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
