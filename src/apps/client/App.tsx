import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import { CartProvider } from '../../contexts/CartContext'

import LoginPage from './LoginPage'
import RegisterPage from '../../pages/auth/RegisterPage'
import ClientLayout from '../../layouts/ClientLayout'
import ClientHome from '../../pages/client/Home'
import ClientSearch from '../../pages/client/Search'
import ClientCart from '../../pages/client/Cart'
import ClientOrders from '../../pages/client/Orders'
import ClientProfile from '../../pages/client/Profile'
import ProductDetail from '../../pages/client/ProductDetail'
import Checkout from '../../pages/client/Checkout'
import OrderTracking from '../../pages/client/OrderTracking'

function Guard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'client') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
      <div>
        <p className="text-2xl mb-3">⚠️</p>
        <p className="font-semibold text-gray-700">Ce compte n'est pas un compte client.</p>
        <a href="/" className="mt-4 inline-block text-primary-600 font-medium text-sm underline">Retour au portail</a>
      </div>
    </div>
  )
  return <>{children}</>
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (profile?.role === 'client') return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><RegisterPage role="client" /></AuthRoute>} />
      <Route path="/" element={<Guard><ClientLayout /></Guard>}>
        <Route index element={<ClientHome />} />
        <Route path="search" element={<ClientSearch />} />
        <Route path="cart" element={<ClientCart />} />
        <Route path="orders" element={<ClientOrders />} />
        <Route path="orders/:id" element={<OrderTracking />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="checkout" element={<Checkout />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function ClientApp() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  )
}
