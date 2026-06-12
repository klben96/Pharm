import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Search, ShoppingCart, ClipboardList, User } from 'lucide-react'
import { useCart } from '../contexts/CartContext'

export default function ClientLayout() {
  const { itemCount } = useCart()
  const navigate = useNavigate()

  const navItems = [
    { to: '/client', icon: Home, label: 'Accueil', end: true },
    { to: '/client/search', icon: Search, label: 'Recherche', end: false },
    { to: '/client/cart', icon: ShoppingCart, label: 'Panier', end: false, badge: itemCount },
    { to: '/client/orders', icon: ClipboardList, label: 'Commandes', end: false },
    { to: '/client/profile', icon: User, label: 'Profil', end: false },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 shadow-nav z-50 safe-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-primary-600' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                    {badge != null && badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
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
