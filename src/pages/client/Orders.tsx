import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Eye, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatXOF, formatDateShort, ORDER_STATUSES } from '../../lib/utils'

interface Order {
  id: string
  order_number: string
  status: string
  total_xof: number
  created_at: string
  pharmacies: { name: string } | null
  order_items: { product_name: string; quantity: number }[]
}

export default function ClientOrders() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'active' | 'history'>('active')

  useEffect(() => {
    if (!profile) return
    supabase
      .from('orders')
      .select('id,order_number,status,total_xof,created_at,pharmacies(name),order_items(product_name,quantity)')
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as unknown as Order[])
        setLoading(false)
      })
  }, [profile])

  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter(o => ['delivered', 'cancelled'].includes(o.status))
  const displayed = (tab === 'active' ? activeOrders : pastOrders).filter(o =>
    !query || o.order_number.toLowerCase().includes(query.toLowerCase())
  )

  const STATUS_BADGE_COLORS: Record<string, string> = {
    pending: 'bg-yellow-400',
    validated: 'bg-blue-500',
    preparing: 'bg-blue-500',
    ready: 'bg-green-500',
    picked_up: 'bg-purple-500',
    delivering: 'bg-orange-500',
    delivered: 'bg-green-600',
    cancelled: 'bg-red-500',
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-0 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-xl text-gray-900">Mes commandes</h1>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Package size={16} className="text-gray-600" />
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5 mb-3">
          <Search size={14} className="text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher une commande..."
            className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder:text-gray-400"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {[
            { key: 'active', label: 'En cours', count: activeOrders.length },
            { key: 'history', label: 'Historique', count: pastOrders.length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'active' | 'history')}
              className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
                tab === t.key ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                }`}>{t.count}</span>
              )}
              {tab === t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />)
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package size={28} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-600">
              {tab === 'active' ? 'Aucune commande en cours' : 'Aucune commande passée'}
            </p>
            <p className="text-sm text-gray-400 mt-1">Vos commandes apparaîtront ici</p>
            {tab === 'active' && (
              <button
                onClick={() => navigate('/client/search')}
                className="mt-4 bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
              >
                Passer une commande
              </button>
            )}
          </div>
        ) : (
          displayed.map(order => {
            const status = ORDER_STATUSES[order.status]
            const statusDot = STATUS_BADGE_COLORS[order.status] ?? 'bg-gray-400'
            const firstItem = order.order_items?.[0]
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  {/* Product thumb */}
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src="https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=80&h=80&fit=crop"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-gray-900 truncate">{order.order_number}</p>
                      <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${status?.bg} ${status?.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                        {status?.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{firstItem ? `${firstItem.product_name}${order.order_items.length > 1 ? ` +${order.order_items.length - 1}` : ''}` : 'Articles'}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">par {(order.pharmacies as any)?.name ?? 'Pharmacie'}</p>
                  </div>
                </div>

                <div className="border-t border-gray-50 flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{formatDateShort(order.created_at)}</span>
                    <span className="font-bold text-sm text-primary-600">{formatXOF(order.total_xof)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/client/orders/${order.id}`)}
                      className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center"
                    >
                      <Eye size={14} className="text-primary-600" />
                    </button>
                    {order.status === 'delivered' && (
                      <button className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Trash2 size={14} className="text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
