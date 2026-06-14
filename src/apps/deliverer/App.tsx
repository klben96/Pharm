import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'

import LoginPage from './LoginPage'
import RegisterPage from '../../pages/auth/RegisterPage'
import DelivererLayout from '../../layouts/DelivererLayout'
import DelivererDashboard from '../../pages/deliverer/Dashboard'
import DelivererActiveDelivery from '../../pages/deliverer/ActiveDelivery'
import DelivererEarnings from '../../pages/deliverer/Earnings'
import DelivererProfile from '../../pages/deliverer/Profile'

function Guard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-3 border-accent-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'deliverer') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
      <div>
        <p className="text-2xl mb-3">⚠️</p>
        <p className="font-semibold text-gray-700">Ce compte n'est pas un compte livreur.</p>
        <a href="/" className="mt-4 inline-block text-accent-600 font-medium text-sm underline">Retour au portail</a>
      </div>
    </div>
  )
  return <>{children}</>
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (profile?.role === 'deliverer') return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><RegisterPage role="deliverer" /></AuthRoute>} />
      <Route path="/" element={<Guard><DelivererLayout /></Guard>}>
        <Route index element={<DelivererDashboard />} />
        <Route path="delivery/:id" element={<DelivererActiveDelivery />} />
        <Route path="earnings" element={<DelivererEarnings />} />
        <Route path="profile" element={<DelivererProfile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function DelivererApp() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
