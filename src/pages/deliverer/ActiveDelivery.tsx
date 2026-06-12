import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, Phone, CheckCircle, Package, Navigation } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatXOF, ORDER_STATUSES } from '../../lib/utils'

export default function DelivererActiveDelivery() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirmCode, setConfirmCode] = useState('')
  const [step, setStep] = useState<'pharmacy' | 'delivery'>('pharmacy')
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('orders').select('*,pharmacies(name,address,phone),profiles!orders_client_id_fkey(full_name,phone)').eq('id', id).single(),
      supabase.from('order_items').select('*').eq('order_id', id),
    ]).then(([{ data: o }, { data: i }]) => {
      setOrder(o)
      setItems(i ?? [])
      if (['picked_up', 'delivering'].includes(o?.status)) setStep('delivery')
      setLoading(false)
    })
  }, [id])

  async function confirmPickup() {
    if (!order || confirmCode !== order.pharmacy_pickup_code) {
      setError('Code incorrect. Vérifiez le code affiché par la pharmacie.')
      return
    }
    setUpdating(true)
    setError('')
    await supabase.from('orders').update({ status: 'picked_up', updated_at: new Date().toISOString() }).eq('id', id)
    setOrder((o: any) => ({ ...o, status: 'picked_up' }))
    setStep('delivery')
    setConfirmCode('')
    setUpdating(false)
  }

  async function confirmDelivery() {
    if (!order || confirmCode !== order.confirmation_code) {
      setError('Code incorrect. Demandez le code au client.')
      return
    }
    setUpdating(true)
    setError('')
    await supabase.from('orders').update({ status: 'delivered', updated_at: new Date().toISOString() }).eq('id', id)
    navigate('/deliverer')
    setUpdating(false)
  }

  if (loading) return <div className="min-h-screen bg-white"><div className="h-48 bg-gray-100 animate-pulse" /></div>
  if (!order) return null

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white px-5 pt-12 pb-4 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">{order.order_number}</h1>
            <p className="text-xs text-gray-400">{step === 'pharmacy' ? 'Retrait pharmacie' : 'Livraison client'}</p>
          </div>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="mx-5 mt-4 rounded-2xl overflow-hidden bg-slate-100 h-40 flex items-center justify-center relative">
        <img
          src="https://images.pexels.com/photos/3875842/pexels-photo-3875842.jpeg?w=500&h=200&fit=crop"
          alt="map"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-accent-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <Navigation size={16} />
            <span className="text-sm font-bold">Navigation active</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Step tabs */}
        <div className="flex gap-2 bg-gray-100 rounded-2xl p-1">
          {['pharmacy', 'delivery'].map((s, i) => (
            <div
              key={s}
              className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all ${
                step === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
              }`}
            >
              {i + 1}. {s === 'pharmacy' ? 'Retrait pharmacie' : 'Livraison client'}
            </div>
          ))}
        </div>

        {step === 'pharmacy' ? (
          <>
            <div className="bg-white rounded-2xl shadow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package size={16} className="text-secondary-600" />
                <h3 className="font-semibold text-sm text-gray-900">Pharmacie</h3>
              </div>
              <p className="font-medium text-gray-900">{order.pharmacies?.name}</p>
              <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                <MapPin size={12} /> {order.pharmacies?.address}
              </p>
              {order.pharmacies?.phone && (
                <a href={`tel:${order.pharmacies.phone}`} className="flex items-center gap-1 text-xs text-primary-600 font-medium mt-2">
                  <Phone size={12} /> Appeler la pharmacie
                </a>
              )}
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl shadow-card p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Colis à récupérer</h3>
              {items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-600">{item.product_name} × {item.quantity}</span>
                </div>
              ))}
            </div>

            {/* QR code / pickup code */}
            <div className="bg-white rounded-2xl shadow-card p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Valider le retrait</h3>
              <p className="text-xs text-gray-500 mb-3">Saisissez le code affiché par la pharmacie :</p>
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <input
                type="text"
                value={confirmCode}
                onChange={e => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="— — — — — —"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-accent-400"
                maxLength={6}
              />
              <button
                onClick={confirmPickup}
                disabled={confirmCode.length < 6 || updating}
                className="w-full mt-3 bg-accent-600 text-white font-bold py-3.5 rounded-xl disabled:opacity-50"
              >
                Confirmer le retrait
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={16} className="text-accent-600" />
                <h3 className="font-semibold text-sm text-gray-900">Client</h3>
              </div>
              <p className="font-medium text-gray-900">{(order.profiles as any)?.full_name}</p>
              <p className="text-sm text-gray-500 mt-0.5">{order.delivery_address}</p>
              {(order.profiles as any)?.phone && (
                <a href={`tel:${(order.profiles as any).phone}`} className="flex items-center gap-1 text-xs text-primary-600 font-medium mt-2">
                  <Phone size={12} /> Appeler le client
                </a>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-card p-4">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">Confirmer la livraison</h3>
              <p className="text-xs text-gray-500 mb-3">Demandez le code de confirmation au client :</p>
              {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
              <input
                type="text"
                value={confirmCode}
                onChange={e => setConfirmCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="— — — — — —"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-accent-400"
                maxLength={6}
              />
              <button
                onClick={confirmDelivery}
                disabled={confirmCode.length < 6 || updating}
                className="w-full mt-3 bg-green-600 text-white font-bold py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                Livraison confirmée
              </button>
            </div>

            <div className="bg-accent-50 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-accent-600 font-medium">Gain pour cette course</p>
                <p className="text-xl font-bold text-accent-700">{formatXOF(order.delivery_fee_xof)}</p>
              </div>
              <div className="w-12 h-12 bg-accent-100 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
