import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'

import LoginPage from './LoginPage'
import RegisterPage from '../../pages/auth/RegisterPage'
import PharmacyLayout from '../../layouts/PharmacyLayout'
import PharmacyDashboard from '../../pages/pharmacy/Dashboard'
import PharmacyOrders from '../../pages/pharmacy/Orders'
import PharmacyOrderDetail from '../../pages/pharmacy/OrderDetail'
import PharmacyStock from '../../pages/pharmacy/Stock'
import PharmacyProfile from '../../pages/pharmacy/Profile'

function Guard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-3 border-secondary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'pharmacy') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
      <div>
        <p className="text-2xl mb-3">⚠️</p>
        <p className="font-semibold text-gray-700">Ce compte n'est pas un compte pharmacie.</p>
        <a href="/" className="mt-4 inline-block text-secondary-600 font-medium text-sm underline">Retour au portail</a>
      </div>
    </div>
  )
  return <>{children}</>
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (profile?.role === 'pharmacy') return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><RegisterPage role="pharmacy" /></AuthRoute>} />
      <Route path="/" element={<Guard><PharmacyLayout /></Guard>}>
        <Route index element={<PharmacyDashboard />} />
        <Route path="orders" element={<PharmacyOrders />} />
        <Route path="orders/:id" element={<PharmacyOrderDetail />} />
        <Route path="stock" element={<PharmacyStock />} />
        <Route path="profile" element={<PharmacyProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function PharmacyApp() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
