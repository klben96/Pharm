import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Heart, Share2, ShoppingCart, Star, MapPin, Plus, Minus, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useCart } from '../../contexts/CartContext'
import { formatXOF } from '../../lib/utils'

interface ProductDetail {
  id: string
  name: string
  brand: string | null
  generic_name: string | null
  description: string | null
  composition: string | null
  dosage: string | null
  contraindications: string | null
  requires_prescription: boolean
  image_url: string | null
  pharmacy_stock: {
    price_xof: number
    quantity: number
    pharmacies: { id: string; name: string; address: string; rating: number }
  }[]
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [selectedStock, setSelectedStock] = useState(0)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    supabase
      .from('products')
      .select('*,pharmacy_stock(price_xof,quantity,pharmacies(id,name,address,rating))')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProduct(data as ProductDetail)
        setLoading(false)
      })
  }, [id])

  function handleAddToCart() {
    if (!product) return
    const stock = product.pharmacy_stock?.[selectedStock]
    if (!stock) return
    addItem({
      product_id: product.id,
      product_name: product.name,
      brand: product.brand ?? 'Générique',
      price_xof: stock.price_xof,
      quantity: qty,
      image_url: product.image_url,
      requires_prescription: product.requires_prescription,
      pharmacy_id: (stock.pharmacies as any).id,
      pharmacy_name: (stock.pharmacies as any).name,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-64 bg-gray-100 animate-pulse" />
        <div className="p-5 space-y-3">
          <div className="h-6 bg-gray-100 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
        </div>
      </div>
    )
  }

  if (!product) return null

  const availableStocks = product.pharmacy_stock?.filter(s => s.quantity > 0) ?? []
  const currentStock = product.pharmacy_stock?.[selectedStock]
  const price = currentStock?.price_xof

  return (
    <div className="min-h-screen bg-white animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-12 pb-3 bg-white/95 backdrop-blur-sm">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
          <ChevronLeft size={20} />
        </button>
        <span className="font-semibold text-sm text-gray-700">Détail produit</span>
        <div className="flex gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <Heart size={18} className="text-gray-500" />
          </button>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <Share2 size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Product image */}
      <div className="mx-5 rounded-2xl overflow-hidden bg-gray-50 h-56 flex items-center justify-center">
        <img
          src={product.image_url ?? 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=400&h=300&fit=crop'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Name & price */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-gray-900 leading-tight flex-1">{product.name}</h1>
            {price != null && <p className="text-primary-600 font-bold text-xl flex-shrink-0">{formatXOF(price)}</p>}
          </div>
          <p className="text-sm text-gray-500 mt-1">{product.brand ?? 'Générique'}{product.generic_name ? ` — ${product.generic_name}` : ''}</p>

          {product.requires_prescription && (
            <div className="flex items-center gap-2 mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 font-medium">Ce médicament nécessite une ordonnance valide</p>
            </div>
          )}
        </div>

        {/* Pharmacy selector */}
        {availableStocks.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-gray-900 mb-2.5">Choisir une pharmacie</h3>
            <div className="space-y-2">
              {product.pharmacy_stock?.map((stock, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedStock(i)}
                  disabled={stock.quantity === 0}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selectedStock === i ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-gray-50'
                  } ${stock.quantity === 0 ? 'opacity-40' : ''}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selectedStock === i ? 'border-primary-500 bg-primary-500' : 'border-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs text-gray-900">{(stock.pharmacies as any).name}</p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={9} />{(stock.pharmacies as any).address}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-primary-600">{formatXOF(stock.price_xof)}</p>
                    <p className="text-[10px] text-gray-400">{stock.quantity > 0 ? `${stock.quantity} en stock` : 'Rupture'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div>
            <h3 className="font-semibold text-sm text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>
          </div>
        )}

        {product.dosage && (
          <div>
            <h3 className="font-semibold text-sm text-gray-900 mb-2">Posologie</h3>
            <p className="text-sm text-gray-600">{product.dosage}</p>
          </div>
        )}

        {product.contraindications && (
          <div>
            <h3 className="font-semibold text-sm text-gray-900 mb-2">Contre-indications</h3>
            <p className="text-sm text-gray-600">{product.contraindications}</p>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {availableStocks.length > 0 && (
        <div className="sticky bottom-16 bg-white border-t border-gray-100 px-5 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3 bg-gray-100 rounded-2xl p-1">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm"
            >
              <Minus size={16} />
            </button>
            <span className="text-sm font-bold w-6 text-center">{qty}</span>
            <button
              onClick={() => setQty(q => q + 1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white shadow-sm"
            >
              <Plus size={16} />
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold text-sm transition-all ${
              added ? 'bg-green-500 text-white' : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            <ShoppingCart size={18} />
            {added ? 'Ajouté !' : 'Ajouter au panier'}
          </button>
        </div>
      )}
    </div>
  )
}
