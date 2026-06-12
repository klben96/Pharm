import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Client pages
import ClientLayout from './layouts/ClientLayout'
import ClientHome from './pages/client/Home'
import ClientSearch from './pages/client/Search'
import ClientCart from './pages/client/Cart'
import ClientOrders from './pages/client/Orders'
import ClientProfile from './pages/client/Profile'
import ProductDetail from './pages/client/ProductDetail'
import Checkout from './pages/client/Checkout'
import OrderTracking from './pages/client/OrderTracking'

// Pharmacy pages
import PharmacyLayout from './layouts/PharmacyLayout'
import PharmacyDashboard from './pages/pharmacy/Dashboard'
import PharmacyOrders from './pages/pharmacy/Orders'
import PharmacyOrderDetail from './pages/pharmacy/OrderDetail'
import PharmacyStock from './pages/pharmacy/Stock'
import PharmacyProfile from './pages/pharmacy/Profile'

// Deliverer pages
import DelivererLayout from './layouts/DelivererLayout'
import DelivererDashboard from './pages/deliverer/Dashboard'
import DelivererActiveDelivery from './pages/deliverer/ActiveDelivery'
import DelivererEarnings from './pages/deliverer/Earnings'
import DelivererProfile from './pages/deliverer/Profile'

// Admin pages
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminOrders from './pages/admin/Orders'
import AdminPharmacies from './pages/admin/Pharmacies'

// Role guard
function RoleRoute({ role, children }: { role: string; children: React.ReactNode }) {
  const { profile } = useAuth()
  if (!profile) return <Navigate to="/login" replace />
  if (profile.role !== role) {
    if (profile.role === 'client') return <Navigate to="/client" replace />
    if (profile.role === 'pharmacy') return <Navigate to="/pharmacy" replace />
    if (profile.role === 'deliverer') return <Navigate to="/deliverer" replace />
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
  }
  return <>{children}</>
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  if (profile) {
    if (profile.role === 'pharmacy') return <Navigate to="/pharmacy" replace />
    if (profile.role === 'deliverer') return <Navigate to="/deliverer" replace />
    if (profile.role === 'admin') return <Navigate to="/admin" replace />
    return <Navigate to="/client" replace />
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/client" replace />} />

      {/* Auth */}
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />

      {/* Client */}
      <Route path="/client" element={<RoleRoute role="client"><ClientLayout /></RoleRoute>}>
        <Route index element={<ClientHome />} />
        <Route path="search" element={<ClientSearch />} />
        <Route path="cart" element={<ClientCart />} />
        <Route path="orders" element={<ClientOrders />} />
        <Route path="orders/:id" element={<OrderTracking />} />
        <Route path="profile" element={<ClientProfile />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="checkout" element={<Checkout />} />
      </Route>

      {/* Pharmacy */}
      <Route path="/pharmacy" element={<RoleRoute role="pharmacy"><PharmacyLayout /></RoleRoute>}>
        <Route index element={<PharmacyDashboard />} />
        <Route path="orders" element={<PharmacyOrders />} />
        <Route path="orders/:id" element={<PharmacyOrderDetail />} />
        <Route path="stock" element={<PharmacyStock />} />
        <Route path="profile" element={<PharmacyProfile />} />
      </Route>

      {/* Deliverer */}
      <Route path="/deliverer" element={<RoleRoute role="deliverer"><DelivererLayout /></RoleRoute>}>
        <Route index element={<DelivererDashboard />} />
        <Route path="delivery/:id" element={<DelivererActiveDelivery />} />
        <Route path="earnings" element={<DelivererEarnings />} />
        <Route path="profile" element={<DelivererProfile />} />
      </Route>

      {/* Admin */}
      <Route path="/admin" element={<RoleRoute role="admin"><AdminLayout /></RoleRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="pharmacies" element={<AdminPharmacies />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  )
}
