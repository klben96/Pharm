import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronLeft, Search, SlidersHorizontal, Star, MapPin, Heart, Share2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatXOF } from '../../lib/utils'

interface Product {
  id: string
  name: string
  brand: string | null
  description: string | null
  image_url: string | null
  requires_prescription: boolean
  pharmacy_stock: { price_xof: number; quantity: number; pharmacies: { id: string; name: string } | null }[]
}

const QUICK_FILTERS = ['Tous', 'Antibiotiques', 'Antidouleur', 'Vitamines', 'Allergie', 'Diabète']

export default function ClientSearch() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [activeFilter, setActiveFilter] = useState('Tous')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(), 300)
    return () => clearTimeout(timer)
  }, [query, activeFilter])

  async function fetchProducts() {
    setLoading(true)
    let q = supabase
      .from('products')
      .select('id,name,brand,description,image_url,requires_prescription,pharmacy_stock(price_xof,quantity,pharmacies(id,name))')
      .order('name')
      .limit(30)

    if (query.trim()) q = q.ilike('name', `%${query}%`)

    const { data } = await q
    setProducts((data ?? []) as unknown as Product[])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-3 sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
            <Search size={15} className="text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Médicament, marque, pathologie..."
              className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none placeholder:text-gray-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
            )}
          </div>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
            <SlidersHorizontal size={17} className="text-gray-600" />
          </button>
        </div>

        {/* Quick filter chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {QUICK_FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all ${
                activeFilter === f
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Header row */}
        {!loading && products.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400 font-medium">{products.length} résultat{products.length > 1 ? 's' : ''}</p>
            <div className="flex gap-1.5">
              <button
                onClick={() => setViewMode('list')}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search size={28} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-700">
              {query ? `Aucun résultat pour "${query}"` : 'Recherchez un médicament'}
            </p>
            <p className="text-sm text-gray-400 mt-1">Tapez le nom d'un médicament ou d'une marque</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-3">
            {products.map(product => {
              const bestStock = product.pharmacy_stock?.find(s => s.quantity > 0)
              const price = bestStock?.price_xof ?? product.pharmacy_stock?.[0]?.price_xof
              const available = (product.pharmacy_stock?.filter(s => s.quantity > 0).length ?? 0) > 0
              return (
                <button
                  key={product.id}
                  onClick={() => navigate(`/client/product/${product.id}`)}
                  className="w-full bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all text-left flex"
                >
                  <img
                    src={product.image_url ?? 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=100&h=100&fit=crop'}
                    alt={product.name}
                    className="w-24 h-24 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 p-3 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 leading-tight truncate">{product.name}</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">by {product.brand ?? 'Générique'}</p>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0">
                        <div className="w-7 h-7 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Heart size={13} className="text-gray-400" />
                        </div>
                        <div className="w-7 h-7 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Share2 size={13} className="text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-1.5">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] text-gray-500 font-medium">4.5</span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {price != null ? (
                        <span className="text-primary-600 font-bold text-sm">{formatXOF(price)}</span>
                      ) : (
                        <span className="text-gray-300 text-xs">N/D</span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                      }`}>
                        {available ? 'Disponible' : 'Rupture'}
                      </span>
                    </div>

                    {bestStock?.pharmacies && (
                      <p className="text-[10px] text-gray-300 mt-1 flex items-center gap-1 truncate">
                        <MapPin size={9} className="flex-shrink-0" />
                        {(bestStock.pharmacies as any).name}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map(product => {
              const price = product.pharmacy_stock?.find(s => s.quantity > 0)?.price_xof ?? product.pharmacy_stock?.[0]?.price_xof
              const available = product.pharmacy_stock?.some(s => s.quantity > 0)
              return (
                <button
                  key={product.id}
                  onClick={() => navigate(`/client/product/${product.id}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all text-left"
                >
                  <div className="relative">
                    <img
                      src={product.image_url ?? 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=200&h=140&fit=crop'}
                      alt={product.name}
                      className="w-full h-32 object-cover"
                    />
                    <button className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Heart size={12} className="text-gray-400" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 leading-snug">{product.name}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">by {product.brand ?? 'Générique'}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      {price != null ? <p className="text-primary-600 font-bold text-sm">{formatXOF(price)}</p> : null}
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${available ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                        {available ? 'Dispo' : 'Rupture'}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
