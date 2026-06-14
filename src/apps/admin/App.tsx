import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'

import LoginPage from './LoginPage'
import AdminLayout from '../../layouts/AdminLayout'
import AdminDashboard from '../../pages/admin/Dashboard'
import AdminUsers from '../../pages/admin/Users'
import AdminOrders from '../../pages/admin/Orders'
import AdminPharmacies from '../../pages/admin/Pharmacies'

function Guard({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== 'admin') return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
      <div>
        <p className="text-2xl mb-3">🔒</p>
        <p className="font-semibold text-gray-700">Accès réservé aux administrateurs.</p>
        <a href="/" className="mt-4 inline-block text-primary-600 font-medium text-sm underline">Retour au portail</a>
      </div>
    </div>
  )
  return <>{children}</>
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (profile?.role === 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/" element={<Guard><AdminLayout /></Guard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="pharmacies" element={<AdminPharmacies />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function AdminApp() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
