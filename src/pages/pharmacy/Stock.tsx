import { useEffect, useState } from 'react'
import { Search, Package, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatXOF } from '../../lib/utils'

export default function PharmacyStock() {
  const [stock, setStock] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('pharmacy_stock')
      .select('id,quantity,price_xof,products(id,name,brand,image_url,requires_prescription),pharmacies(name)')
      .order('quantity', { ascending: true })
      .then(({ data }) => {
        setStock(data ?? [])
        setLoading(false)
      })
  }, [])

  const filtered = stock.filter(s =>
    !query || (s.products?.name ?? '').toLowerCase().includes(query.toLowerCase())
  )

  const lowStock = stock.filter(s => s.quantity > 0 && s.quantity <= 10)
  const outOfStock = stock.filter(s => s.quantity === 0)

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white px-5 pt-12 pb-4 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <h1 className="font-bold text-xl text-gray-900 mb-3">Gestion du stock</h1>
        <div className="flex items-center gap-2.5 bg-gray-100 rounded-2xl px-4 py-2.5">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Alerts */}
        {(lowStock.length > 0 || outOfStock.length > 0) && !query && (
          <div className="space-y-2.5">
            {outOfStock.length > 0 && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{outOfStock.length} produit{outOfStock.length > 1 ? 's' : ''} en rupture de stock</p>
              </div>
            )}
            {lowStock.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-center gap-3">
                <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />
                <p className="text-sm text-yellow-700 font-medium">{lowStock.length} produit{lowStock.length > 1 ? 's' : ''} avec stock faible</p>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={32} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucun produit trouvé</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 font-medium">{filtered.length} produits</p>
            {filtered.map((item: any) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-card"
              >
                <img
                  src={item.products?.image_url ?? 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=80&h=80&fit=crop'}
                  alt={item.products?.name}
                  className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 leading-tight">{item.products?.name}</h3>
                  <p className="text-xs text-gray-400">{item.products?.brand ?? 'Générique'}</p>
                  <p className="text-primary-600 font-bold text-sm mt-1">{formatXOF(item.price_xof)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`inline-flex items-center px-3 py-1.5 rounded-xl ${
                    item.quantity === 0 ? 'bg-red-100 text-red-700' :
                    item.quantity <= 10 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    <span className="text-sm font-bold">{item.quantity}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">en stock</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
