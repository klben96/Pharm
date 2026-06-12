import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Package, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatXOF, formatDateShort, ORDER_STATUSES } from '../../lib/utils'

const STATUS_TABS = [
  { key: 'all', label: 'Tout' },
  { key: 'pending', label: 'En attente' },
  { key: 'preparing', label: 'Préparation' },
  { key: 'ready', label: 'Prêt' },
  { key: 'delivered', label: 'Livré' },
]

export default function PharmacyOrders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<any[]>([])
  const [tab, setTab] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let q = supabase
      .from('orders')
      .select('id,order_number,status,total_xof,created_at,has_prescription,profiles!orders_client_id_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(50)

    if (tab !== 'all') {
      if (tab === 'preparing') {
        q = q.in('status', ['validated', 'preparing'])
      } else {
        q = q.eq('status', tab)
      }
    }

    q.then(({ data }) => {
      setOrders(data ?? [])
      setLoading(false)
    })
  }, [tab])

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white px-5 pt-12 pb-0 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-bold text-xl text-gray-900">Commandes</h1>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <Filter size={16} className="text-gray-600" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
          {STATUS_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all ${
                tab === t.key ? 'bg-secondary-600 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={32} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucune commande</p>
          </div>
        ) : (
          orders.map((order: any) => {
            const status = ORDER_STATUSES[order.status]
            return (
              <button
                key={order.id}
                onClick={() => navigate(`/pharmacy/orders/${order.id}`)}
                className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-card hover:shadow-card-hover transition-all text-left"
              >
                <div className="w-11 h-11 bg-secondary-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Package size={20} className="text-secondary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-gray-900">{order.order_number}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status?.bg} ${status?.color}`}>
                      {status?.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{(order.profiles as any)?.full_name ?? 'Client'}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-400">{formatDateShort(order.created_at)}</p>
                    <div className="flex items-center gap-2">
                      {order.has_prescription && (
                        <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">ORD.</span>
                      )}
                      <p className="font-bold text-sm text-secondary-600">{formatXOF(order.total_xof)}</p>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
