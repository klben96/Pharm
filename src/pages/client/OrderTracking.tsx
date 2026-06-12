import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, Phone, Package, CheckCircle, Clock, Truck, Home } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatXOF, formatDate, ORDER_STATUSES } from '../../lib/utils'

const STEPS = [
  { key: 'pending', label: 'Commande reçue', icon: Package },
  { key: 'validated', label: 'Ordonnance validée', icon: CheckCircle },
  { key: 'preparing', label: 'En préparation', icon: Clock },
  { key: 'ready', label: 'Prête pour retrait', icon: Package },
  { key: 'picked_up', label: 'Livreur en route', icon: Truck },
  { key: 'delivering', label: 'En livraison', icon: MapPin },
  { key: 'delivered', label: 'Livré', icon: Home },
]

export default function OrderTracking() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('orders').select('*,pharmacies(name,address,phone),profiles!orders_deliverer_id_fkey(full_name,phone)').eq('id', id).single(),
      supabase.from('order_items').select('*').eq('order_id', id),
    ]).then(([{ data: o }, { data: i }]) => {
      setOrder(o)
      setItems(i ?? [])
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-48 bg-gray-100 animate-pulse" />
      </div>
    )
  }

  if (!order) return null

  const currentStepIdx = STEPS.findIndex(s => s.key === order.status)
  const status = ORDER_STATUSES[order.status]

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
        {/* Status tracker */}
        <div className="bg-white rounded-2xl shadow-card p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-4">Suivi de commande</h3>
          <div className="space-y-4">
            {STEPS.slice(0, order.status === 'cancelled' ? 1 : undefined).map((step, i) => {
              const isDone = i <= currentStepIdx
              const isCurrent = i === currentStepIdx
              const Icon = step.icon
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    isDone ? 'bg-primary-600' : 'bg-gray-100'
                  }`}>
                    <Icon size={16} className={isDone ? 'text-white' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-xs text-primary-500 mt-0.5 animate-pulse">En cours...</p>
                    )}
                  </div>
                  {isDone && <CheckCircle size={16} className="text-green-500 flex-shrink-0" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Confirmation code */}
        {!['delivered', 'cancelled'].includes(order.status) && (
          <div className="bg-primary-600 rounded-2xl p-5 text-white">
            <p className="text-sm font-medium text-primary-100 mb-2">Code de confirmation livraison</p>
            <p className="text-4xl font-bold tracking-widest">{order.confirmation_code ?? '— — — —'}</p>
            <p className="text-xs text-primary-200 mt-2">Communiquez ce code au livreur pour finaliser la livraison</p>
          </div>
        )}

        {/* Delivery address */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={16} className="text-primary-500" />
            <h3 className="font-semibold text-sm text-gray-900">Adresse de livraison</h3>
          </div>
          <p className="text-sm text-gray-600">{order.delivery_address}</p>
        </div>

        {/* Pharmacy */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package size={16} className="text-primary-500" />
            <h3 className="font-semibold text-sm text-gray-900">Pharmacie</h3>
          </div>
          <p className="font-medium text-sm text-gray-900">{order.pharmacies?.name}</p>
          <p className="text-xs text-gray-400">{order.pharmacies?.address}</p>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Articles commandés</h3>
          <div className="space-y-2">
            {items.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{item.product_name} <span className="text-gray-400">x{item.quantity}</span></span>
                <span className="font-medium">{formatXOF(item.total_price_xof)}</span>
              </div>
            ))}
          </div>
          <div className="h-px bg-gray-100 my-3" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Livraison</span>
            <span>{formatXOF(order.delivery_fee_xof)}</span>
          </div>
          <div className="flex justify-between font-bold mt-1.5">
            <span>Total</span>
            <span className="text-primary-600">{formatXOF(order.total_xof)}</span>
          </div>
        </div>

        <p className="text-xs text-center text-gray-400">{formatDate(order.created_at)}</p>
      </div>
    </div>
  )
}
