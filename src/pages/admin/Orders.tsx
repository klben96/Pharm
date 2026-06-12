import { useEffect, useState } from 'react'
import { Search, Package, Filter } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatXOF, ORDER_STATUSES } from '../../lib/utils'

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let q = supabase
      .from('orders')
      .select('id,order_number,status,total_xof,created_at,has_prescription,payment_method,profiles!orders_client_id_fkey(full_name),pharmacies(name)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (statusFilter !== 'all') q = q.eq('status', statusFilter)

    q.then(({ data }) => { setOrders(data ?? []); setLoading(false) })
  }, [statusFilter])

  const filtered = orders.filter(o =>
    !query || o.order_number.includes(query) || (o.profiles as any)?.full_name?.toLowerCase().includes(query.toLowerCase())
  )

  async function updateStatus(orderId: string, newStatus: string) {
    await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Commandes</h1>
        <p className="text-slate-500 text-sm mt-1">{orders.length} commandes au total</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-48 bg-slate-50 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Numéro de commande ou client..."
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'preparing', 'delivered', 'cancelled'].map(s => {
              const status = ORDER_STATUSES[s]
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                    statusFilter === s ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {s === 'all' ? 'Tous' : status?.label}
                </button>
              )
            })}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {['Commande', 'Client', 'Pharmacie', 'Statut', 'Paiement', 'Total', 'Action'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-slate-50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.map((order: any) => {
              const status = ORDER_STATUSES[order.status]
              return (
                <tr key={order.id} className="border-t border-slate-50 hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5 text-xs font-mono text-slate-600 whitespace-nowrap">{order.order_number}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 font-medium whitespace-nowrap">{(order.profiles as any)?.full_name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 whitespace-nowrap">{(order.pharmacies as any)?.name ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${status?.bg} ${status?.color}`}>
                      {status?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{order.payment_method}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-700 whitespace-nowrap">{formatXOF(order.total_xof)}</td>
                  <td className="px-5 py-3.5">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(order.id, 'validated')}
                        className="text-xs bg-green-600 text-white px-2.5 py-1 rounded-lg font-medium hover:bg-green-700 transition"
                      >
                        Valider
                      </button>
                    )}
                    {!['delivered', 'cancelled'].includes(order.status) && order.status !== 'pending' && (
                      <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-lg font-medium hover:bg-red-200 transition"
                      >
                        Annuler
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">Aucune commande trouvée</div>
        )}
      </div>
    </div>
  )
}
