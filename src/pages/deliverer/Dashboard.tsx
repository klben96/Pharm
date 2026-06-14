import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Package, ChevronRight, ToggleLeft, ToggleRight, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../apps/deliverer/AuthContext'
import { formatXOF, ORDER_STATUSES } from '../../lib/utils'

export default function DelivererDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [isAvailable, setIsAvailable] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load orders that are ready for pickup or are assigned to this deliverer
    supabase
      .from('orders')
      .select('id,order_number,status,total_xof,delivery_fee_xof,delivery_address,created_at,pharmacies(name,address)')
      .in('status', ['ready', 'picked_up', 'delivering'])
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setOrders(data ?? [])
        setLoading(false)
      })
  }, [])

  const DELIVERY_EARN = 1200

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-accent-500 to-accent-700 px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-accent-200 text-sm font-medium">Bonjour !</p>
            <h1 className="text-white text-xl font-bold">{profile?.full_name ?? 'Livreur'}</h1>
          </div>
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              isAvailable ? 'bg-white text-accent-600' : 'bg-white/20 text-white'
            }`}
          >
            {isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            {isAvailable ? 'Disponible' : 'Hors ligne'}
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Courses dispo', value: orders.filter(o => o.status === 'ready').length },
            { label: 'Gain/course', value: formatXOF(DELIVERY_EARN) },
            { label: 'En livraison', value: orders.filter(o => o.status === 'delivering').length },
          ].map(stat => (
            <div key={stat.label} className="bg-white/15 rounded-2xl p-3 text-center">
              <p className="text-white font-bold text-lg">{stat.value}</p>
              <p className="text-accent-200 text-[10px] font-medium leading-tight mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Available deliveries */}
        <section>
          <h2 className="font-bold text-gray-900 mb-3">Courses disponibles</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />)}
            </div>
          ) : orders.filter(o => o.status === 'ready').length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-card">
              <MapPin size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {isAvailable ? 'Aucune course disponible pour le moment' : 'Passez en mode disponible pour recevoir des courses'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.filter(o => o.status === 'ready').map((order: any) => (
                <div key={order.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-gray-900">{order.order_number}</span>
                      <span className="text-accent-600 font-bold text-sm">{formatXOF(order.delivery_fee_xof)}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-secondary-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                          <div className="w-2 h-2 bg-secondary-500 rounded-full" />
                        </div>
                        <p className="text-xs text-gray-600">{(order.pharmacies as any)?.name} — {(order.pharmacies as any)?.address}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                        <p className="text-xs text-gray-600">{order.delivery_address}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 border-t border-gray-50">
                    <button className="py-3 text-sm text-gray-500 font-medium border-r border-gray-50 hover:bg-gray-50 transition">
                      Refuser
                    </button>
                    <button
                      onClick={() => navigate(`/deliverer/delivery/${order.id}`)}
                      className="py-3 text-sm text-accent-600 font-bold hover:bg-accent-50 transition"
                    >
                      Accepter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Active deliveries */}
        {orders.filter(o => ['picked_up', 'delivering'].includes(o.status)).length > 0 && (
          <section>
            <h2 className="font-bold text-gray-900 mb-3">Course en cours</h2>
            {orders.filter(o => ['picked_up', 'delivering'].includes(o.status)).map((order: any) => {
              const status = ORDER_STATUSES[order.status]
              return (
                <button
                  key={order.id}
                  onClick={() => navigate(`/deliverer/delivery/${order.id}`)}
                  className="w-full bg-accent-600 rounded-2xl p-4 flex items-center gap-3 text-left"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <MapPin size={22} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold">{order.order_number}</p>
                    <p className="text-accent-200 text-xs mt-0.5">{status?.label}</p>
                  </div>
                  <ChevronRight size={18} className="text-white/60" />
                </button>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
