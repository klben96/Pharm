import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Trash2, ShoppingBag, Plus, Minus } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { formatXOF } from '../../lib/utils'

export default function ClientCart() {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()

  const DELIVERY_FEE = 1500

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5">
          <ShoppingBag size={36} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Panier vide</h2>
        <p className="text-sm text-gray-500 mb-6">Ajoutez des médicaments à votre panier pour passer commande.</p>
        <button
          onClick={() => navigate('/client/search')}
          className="bg-primary-600 text-white font-semibold px-8 py-3.5 rounded-2xl hover:bg-primary-700 transition"
        >
          Parcourir les produits
        </button>
      </div>
    )
  }

  const pharmacyName = items[0]?.pharmacy_name

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">Mon panier</h1>
            <p className="text-xs text-gray-400">{pharmacyName}</p>
          </div>
          <button onClick={clearCart} className="text-xs text-red-500 font-medium">Vider</button>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Items */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          {items.map((item, i) => (
            <div key={item.product_id} className={`flex items-center gap-4 p-4 ${i < items.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <img
                src={item.image_url ?? 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=80&h=80&fit=crop'}
                alt={item.product_name}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-gray-900 leading-tight">{item.product_name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{item.brand}</p>
                <p className="text-primary-600 font-bold text-sm mt-1">{formatXOF(item.price_xof)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => removeItem(item.product_id)}>
                  <Trash2 size={15} className="text-gray-300 hover:text-red-400 transition" />
                </button>
                <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-white"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-card p-4 space-y-3">
          <h3 className="font-semibold text-sm text-gray-900">Récapitulatif</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total</span>
              <span className="font-medium text-gray-900">{formatXOF(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Frais de livraison</span>
              <span className="font-medium text-gray-900">{formatXOF(DELIVERY_FEE)}</span>
            </div>
            <div className="h-px bg-gray-100 my-1" />
            <div className="flex justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-primary-600 text-lg">{formatXOF(total + DELIVERY_FEE)}</span>
            </div>
          </div>
        </div>

        {/* Prescription notice */}
        {items.some(i => i.requires_prescription) && (
          <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-yellow-500 text-lg flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-yellow-800">Ordonnance requise</p>
              <p className="text-xs text-yellow-700 mt-0.5">Certains produits nécessitent une ordonnance. Vous pourrez la joindre à l'étape suivante.</p>
            </div>
          </div>
        )}
      </div>

      {/* Checkout button */}
      <div className="px-5 pb-24">
        <button
          onClick={() => navigate('/client/checkout')}
          className="w-full bg-primary-600 text-white font-semibold py-4 rounded-2xl hover:bg-primary-700 transition flex items-center justify-center gap-2"
        >
          Commander — {formatXOF(total + DELIVERY_FEE)}
        </button>
      </div>
    </div>
  )
}
