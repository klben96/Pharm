import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle, XCircle, Package, Phone, MapPin, Eye } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatXOF, formatDate, ORDER_STATUSES } from '../../lib/utils'

export default function PharmacyOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('orders').select('*,profiles!orders_client_id_fkey(full_name,phone)').eq('id', id).single(),
      supabase.from('order_items').select('*').eq('order_id', id),
    ]).then(([{ data: o }, { data: i }]) => {
      setOrder(o)
      setItems(i ?? [])
      setLoading(false)
    })
  }, [id])

  async function updateStatus(newStatus: string) {
    if (!id) return
    setUpdating(true)
    await supabase.from('orders').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
    setOrder((o: any) => ({ ...o, status: newStatus }))
    setUpdating(false)
  }

  if (loading) return <div className="min-h-screen bg-white"><div className="h-48 bg-gray-100 animate-pulse" /></div>
  if (!order) return null

  const status = ORDER_STATUSES[order.status]
  const client = order.profiles

  const ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
    pending: [
      { label: 'Valider l\'ordonnance', next: 'validated', color: 'bg-secondary-600' },
      { label: 'Rejeter', next: 'cancelled', color: 'bg-red-500' },
    ],
    validated: [
      { label: 'Commencer la préparation', next: 'preparing', color: 'bg-secondary-600' },
    ],
    preparing: [
      { label: 'Commande prête', next: 'ready', color: 'bg-secondary-600' },
    ],
    ready: [],
  }

  const actions = ACTIONS[order.status] ?? []

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white px-5 pt-12 pb-4 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">{order.order_number}</h1>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${status?.bg} ${status?.color}`}>
              {status?.label}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Client info */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Informations client</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{client?.full_name ?? 'Client'}</p>
              <div className="flex items-center gap-3 mt-1">
                <a href={`tel:${client?.phone}`} className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                  <Phone size={11} /> Appeler
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-gray-50">
            <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">{order.delivery_address}</p>
          </div>
        </div>

        {/* Prescription */}
        {order.has_prescription && (
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-gray-900">Ordonnance médicale</h3>
              {order.prescription_url ? (
                <a href={order.prescription_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary-600 font-medium">
                  <Eye size={14} /> Voir
                </a>
              ) : (
                <span className="text-xs text-yellow-600 font-medium">En attente</span>
              )}
            </div>
          </div>
        )}

        {/* Pickup code */}
        <div className="bg-secondary-600 rounded-2xl p-5 text-white">
          <p className="text-sm font-medium text-secondary-100 mb-2">Code de retrait livreur</p>
          <p className="text-4xl font-bold tracking-widest">{order.pharmacy_pickup_code ?? '— — — —'}</p>
          <p className="text-xs text-secondary-200 mt-2">Le livreur doit présenter ce code pour retirer la commande</p>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Articles ({items.length})</h3>
          <div className="space-y-3">
            {items.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.product_name}</p>
                  <p className="text-xs text-gray-400">Qté : {item.quantity} × {formatXOF(item.unit_price_xof)}</p>
                </div>
                <p className="font-bold text-sm text-secondary-600">{formatXOF(item.total_price_xof)}</p>
              </div>
            ))}
          </div>
          <div className="h-px bg-gray-100 my-3" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-secondary-600">{formatXOF(order.total_xof)}</span>
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="space-y-2.5">
            {actions.map(action => (
              <button
                key={action.next}
                onClick={() => updateStatus(action.next)}
                disabled={updating}
                className={`w-full ${action.color} text-white font-semibold py-4 rounded-2xl transition disabled:opacity-60 flex items-center justify-center gap-2`}
              >
                {action.label === 'Rejeter' ? <XCircle size={18} /> : <CheckCircle size={18} />}
                {action.label}
              </button>
            ))}
          </div>
        )}

        <p className="text-xs text-center text-gray-400">{formatDate(order.created_at)}</p>
      </div>
    </div>
  )
}
