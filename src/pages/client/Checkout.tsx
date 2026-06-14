import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MapPin, Phone, CreditCard, Camera, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../apps/client/AuthContext'
import { formatXOF } from '../../lib/utils'

const PAYMENT_METHODS = [
  { id: 'mtn', label: 'MTN Mobile Money', icon: '🟡', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'orange', label: 'Orange Money', icon: '🟠', color: 'bg-orange-50 border-orange-200' },
  { id: 'moov', label: 'Moov Money', icon: '🔵', color: 'bg-blue-50 border-blue-200' },
]

export default function Checkout() {
  const navigate = useNavigate()
  const { items, total, clearCart } = useCart()
  const { profile } = useAuth()
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [paymentMethod, setPaymentMethod] = useState('mtn')
  const [hasPrescription, setHasPrescription] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')

  const DELIVERY_FEE = 1500
  const requiresPrescription = items.some(i => i.requires_prescription)

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || items.length === 0 || !address.trim()) return
    setLoading(true)

    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Find pharmacy
    const pharmacyId = items[0].pharmacy_id

    // We need a valid pharmacy reference - get first active pharmacy
    const { data: pharmacyData } = await supabase
      .from('pharmacies')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .single()

    const resolvedPharmacyId = pharmacyId || pharmacyData?.id

    if (!resolvedPharmacyId) {
      setLoading(false)
      return
    }

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        client_id: profile.id,
        pharmacy_id: resolvedPharmacyId,
        delivery_address: address,
        subtotal_xof: total,
        delivery_fee_xof: DELIVERY_FEE,
        total_xof: total + DELIVERY_FEE,
        payment_method: paymentMethod,
        payment_status: 'paid',
        has_prescription: hasPrescription,
        confirmation_code: confirmationCode,
        pharmacy_pickup_code: pickupCode,
        status: 'pending',
      })
      .select()
      .single()

    if (!error && order) {
      await supabase.from('order_items').insert(
        items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price_xof: item.price_xof,
          total_price_xof: item.price_xof * item.quantity,
        }))
      )
      setOrderId(order.id)
      clearCart()
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Commande confirmée !</h2>
        <p className="text-sm text-gray-500 mb-6">Votre commande a été transmise à la pharmacie. Vous recevrez une mise à jour dès sa validation.</p>
        <div className="bg-gray-50 rounded-2xl p-5 w-full mb-6">
          <p className="text-xs text-gray-400 mb-1">Code de confirmation</p>
          <p className="text-3xl font-bold tracking-widest text-primary-600">— — — —</p>
          <p className="text-xs text-gray-400 mt-2">Communiquez ce code au livreur lors de la livraison</p>
        </div>
        <button
          onClick={() => navigate('/client/orders')}
          className="w-full bg-primary-600 text-white font-semibold py-4 rounded-2xl hover:bg-primary-700 transition mb-3"
        >
          Suivre ma commande
        </button>
        <button
          onClick={() => navigate('/client')}
          className="w-full text-gray-500 font-medium py-3"
        >
          Retour à l'accueil
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white px-5 pt-12 pb-4 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold text-gray-900">Finaliser la commande</h1>
        </div>
      </div>

      <form onSubmit={handleOrder} className="px-5 py-4 space-y-4 pb-32">
        {/* Delivery address */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center">
              <MapPin size={16} className="text-primary-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">Adresse de livraison</h3>
          </div>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            required
            placeholder="Ex: Cocody, Rue des Jardins, Bâtiment B..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Phone */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center">
              <Phone size={16} className="text-primary-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">Numéro de contact</h3>
          </div>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            placeholder="+225 07 00 00 000"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Prescription */}
        {requiresPrescription && (
          <div className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                <Camera size={16} className="text-red-500" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">Ordonnance médicale</h3>
            </div>
            <button
              type="button"
              onClick={() => setHasPrescription(true)}
              className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 transition ${hasPrescription ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
            >
              {hasPrescription ? (
                <>
                  <CheckCircle size={24} className="text-green-500" />
                  <span className="text-sm font-medium text-green-700">Ordonnance jointe</span>
                </>
              ) : (
                <>
                  <Camera size={24} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Appuyez pour joindre votre ordonnance</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Payment */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary-50 rounded-xl flex items-center justify-center">
              <CreditCard size={16} className="text-primary-600" />
            </div>
            <h3 className="font-semibold text-sm text-gray-900">Mode de paiement</h3>
          </div>
          <div className="space-y-2">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  paymentMethod === pm.id ? 'border-primary-500 bg-primary-50' : pm.color
                }`}
              >
                <span className="text-xl">{pm.icon}</span>
                <span className="text-sm font-medium text-gray-800">{pm.label}</span>
                {paymentMethod === pm.id && (
                  <CheckCircle size={16} className="ml-auto text-primary-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl shadow-card p-4">
          <h3 className="font-semibold text-sm text-gray-900 mb-3">Récapitulatif</h3>
          {items.map(item => (
            <div key={item.product_id} className="flex justify-between text-sm py-1">
              <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
              <span className="font-medium">{formatXOF(item.price_xof * item.quantity)}</span>
            </div>
          ))}
          <div className="h-px bg-gray-100 my-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Livraison</span>
            <span>{formatXOF(DELIVERY_FEE)}</span>
          </div>
          <div className="flex justify-between font-bold mt-2">
            <span>Total</span>
            <span className="text-primary-600 text-lg">{formatXOF(total + DELIVERY_FEE)}</span>
          </div>
        </div>
      </form>

      <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-md px-5 pb-4 bg-white border-t border-gray-100">
        <button
          type="submit"
          onClick={handleOrder}
          disabled={loading || !address.trim()}
          className="w-full bg-primary-600 text-white font-semibold py-4 rounded-2xl hover:bg-primary-700 transition disabled:opacity-60"
        >
          {loading ? 'Traitement...' : `Payer ${formatXOF(total + DELIVERY_FEE)}`}
        </button>
      </div>
    </div>
  )
}
