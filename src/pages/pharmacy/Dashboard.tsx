import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, Clock, Package, TrendingUp, ChevronRight, Bell } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../apps/pharmacy/AuthContext'
import { formatXOF, ORDER_STATUSES } from '../../lib/utils'

export default function PharmacyDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, preparing: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load all orders (demo mode: load all orders)
    supabase
      .from('orders')
      .select('id,order_number,status,total_xof,created_at,profiles!orders_client_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        const list = data ?? []
        setOrders(list)
        setStats({
          total: list.length,
          pending: list.filter(o => o.status === 'pending').length,
          preparing: list.filter(o => ['validated', 'preparing'].includes(o.status)).length,
          revenue: list.filter(o => o.status === 'delivered').reduce((s: number, o: any) => s + o.total_xof, 0),
        })
        setLoading(false)
      })
  }, [])

  const STAT_CARDS = [
    { label: 'Total commandes', value: stats.total, icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'En attente', value: stats.pending, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
    { label: 'En préparation', value: stats.preparing, icon: Package, color: 'bg-orange-50 text-orange-600' },
    { label: 'CA Livré', value: formatXOF(stats.revenue), icon: TrendingUp, color: 'bg-green-50 text-green-600', large: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Pharmacie</p>
            <h1 className="text-xl font-bold text-gray-900">{profile?.full_name ?? 'Tableau de bord'}</h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 relative">
            <Bell size={20} className="text-gray-600" />
            {stats.pending > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {STAT_CARDS.map(card => (
            <div key={card.label} className="bg-white rounded-2xl p-4 shadow-card">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-2.5`}>
                <card.icon size={20} />
              </div>
              <p className={`font-bold ${card.large ? 'text-lg' : 'text-2xl'} text-gray-900 leading-tight`}>{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Commandes récentes</h2>
            <button
              onClick={() => navigate('/pharmacy/orders')}
              className="text-xs text-secondary-600 font-semibold flex items-center gap-0.5"
            >
              Toutes <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-card">
              <ShoppingBag size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Aucune commande reçue</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order: any) => {
                const status = ORDER_STATUSES[order.status]
                return (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/pharmacy/orders/${order.id}`)}
                    className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-card hover:shadow-card-hover transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-secondary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-secondary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-gray-900">{order.order_number}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status?.bg} ${status?.color}`}>
                          {status?.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{(order.profiles as any)?.full_name ?? 'Client'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-secondary-600">{formatXOF(order.total_xof)}</p>
                      <ChevronRight size={14} className="text-gray-300 ml-auto mt-0.5" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
