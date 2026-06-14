import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ShoppingBag, Star, ChevronRight, MapPin, Clock, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../apps/client/AuthContext'
import { useCart } from '../../contexts/CartContext'
import { formatXOF } from '../../lib/utils'

interface Pharmacy {
  id: string
  name: string
  address: string
  rating: number
  rating_count: number
  image_url: string | null
  opening_time: string
  closing_time: string
}

interface Product {
  id: string
  name: string
  brand: string | null
  image_url: string | null
  requires_prescription: boolean
  pharmacy_stock: { price_xof: number }[]
}

const BANNERS = [
  {
    bg: 'from-primary-600 to-primary-800',
    title: 'Choisissez vos',
    subtitle: 'Médicaments',
    badge: 'LIVRAISON RAPIDE',
    cta: 'Commander',
    img: 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=300&h=200&fit=crop',
  },
  {
    bg: 'from-secondary-600 to-secondary-800',
    title: 'Vitamines &',
    subtitle: 'Compléments',
    badge: '-20% CE MOIS',
    cta: 'Voir les offres',
    img: 'https://images.pexels.com/photos/3786126/pexels-photo-3786126.jpeg?w=300&h=200&fit=crop',
  },
  {
    bg: 'from-cyan-600 to-cyan-800',
    title: 'Ordonnance ?',
    subtitle: 'Scannez & Commandez',
    badge: 'NOUVEAU',
    cta: 'Scanner',
    img: 'https://images.pexels.com/photos/5726794/pexels-photo-5726794.jpeg?w=300&h=200&fit=crop',
  },
]

const CATEGORIES = [
  { label: 'Médicaments', icon: '💊', color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
  { label: 'Vitamines', icon: '⭐', color: 'bg-green-50 text-green-600', border: 'border-green-100' },
  { label: 'Premiers secours', icon: '❤️', color: 'bg-red-50 text-red-600', border: 'border-red-100' },
  { label: 'Pédiatrie', icon: '👶', color: 'bg-orange-50 text-orange-600', border: 'border-orange-100' },
  { label: 'Dermatologie', icon: '✨', color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
  { label: 'Hygiène', icon: '💧', color: 'bg-cyan-50 text-cyan-600', border: 'border-cyan-100' },
]

const BRANDS = [
  { name: 'Cipla', logo: '🔵' },
  { name: 'Sanofi', logo: '🟠' },
  { name: 'Ipca', logo: '🟢' },
  { name: 'Bayer', logo: '🔴' },
  { name: 'Pfizer', logo: '🔵' },
  { name: 'Roche', logo: '🟣' },
]

export default function ClientHome() {
  const { profile } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [bannerIdx, setBannerIdx] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('pharmacies').select('id,name,address,rating,rating_count,image_url,opening_time,closing_time').eq('status', 'active').limit(6),
      supabase.from('products').select('id,name,brand,image_url,requires_prescription,pharmacy_stock(price_xof)').limit(8),
    ]).then(([{ data: ph }, { data: pr }]) => {
      setPharmacies((ph ?? []) as Pharmacy[])
      setProducts((pr ?? []) as Product[])
      setLoading(false)
    })

    // Auto-advance banner
    const t = setInterval(() => setBannerIdx(i => (i + 1) % BANNERS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Visiteur'
  const banner = BANNERS[bannerIdx]

  return (
    <div className="bg-gray-50 min-h-screen animate-fade-in">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 sticky top-0 z-20 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
              <span className="text-primary-600 font-bold text-sm">{firstName[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium leading-none mb-0.5">Bonjour !</p>
              <h1 className="text-base font-bold text-gray-900 leading-none">{firstName} 👋</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button
              onClick={() => navigate('/client/cart')}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-600 relative"
            >
              <ShoppingBag size={18} className="text-white" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <button
          onClick={() => navigate('/client/search')}
          className="w-full bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-3"
        >
          <Search size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400">Rechercher un médicament...</span>
          <div className="ml-auto w-7 h-7 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 6h18M7 12h10M11 18h2"/></svg>
          </div>
        </button>
      </div>

      <div className="px-5 space-y-6 py-4 pb-6">
        {/* Banner carousel */}
        <div>
          <div
            className={`bg-gradient-to-r ${banner.bg} rounded-3xl p-5 flex items-center justify-between overflow-hidden relative min-h-[140px] transition-all duration-500`}
          >
            {/* BG decoration */}
            <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute right-4 bottom-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2" />

            <div className="z-10 flex-1">
              <span className="text-[10px] font-extrabold text-white/60 uppercase tracking-widest">{banner.badge}</span>
              <h2 className="text-white font-bold text-2xl mt-1 leading-tight">{banner.title}</h2>
              <h2 className="text-white font-bold text-2xl leading-tight">{banner.subtitle}</h2>
              <button
                onClick={() => navigate('/client/search')}
                className="mt-4 bg-white text-primary-700 text-xs font-extrabold px-5 py-2.5 rounded-xl hover:bg-white/90 transition"
              >
                {banner.cta}
              </button>
            </div>
            <img
              src={banner.img}
              alt="Banner"
              className="w-28 h-28 object-cover rounded-2xl opacity-90 flex-shrink-0 z-10 shadow-lg"
            />
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setBannerIdx(i)}
                className={`rounded-full transition-all duration-300 ${i === bannerIdx ? 'w-5 h-1.5 bg-primary-600' : 'w-1.5 h-1.5 bg-gray-200'}`}
              />
            ))}
          </div>
        </div>

        {/* Top Brands */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-[15px]">Top Marques</h2>
            <button className="text-xs text-primary-600 font-semibold flex items-center gap-0.5">
              Voir plus <ChevronRight size={13} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
            {BRANDS.map(brand => (
              <button
                key={brand.name}
                onClick={() => navigate(`/client/search?brand=${encodeURIComponent(brand.name)}`)}
                className="flex-shrink-0 bg-white rounded-2xl px-5 py-3 flex flex-col items-center gap-1 shadow-card hover:shadow-card-hover transition-all border border-gray-100"
              >
                <span className="text-2xl">{brand.logo}</span>
                <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{brand.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-[15px]">Catégories</h2>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.label}
                onClick={() => navigate(`/client/search?category=${encodeURIComponent(cat.label)}`)}
                className={`${cat.color} border ${cat.border} rounded-2xl p-3.5 flex flex-col items-center gap-1.5 transition hover:opacity-80 active:scale-95`}
              >
                <span className="text-2xl leading-none">{cat.icon}</span>
                <span className="text-[11px] font-semibold leading-tight text-center">{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Popular Products */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-[15px]">Produits populaires</h2>
            <button
              onClick={() => navigate('/client/search')}
              className="text-xs text-primary-600 font-semibold flex items-center gap-0.5"
            >
              Voir plus <ChevronRight size={13} />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-gray-100 rounded-2xl h-52 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.slice(0, 4).map(product => {
                const price = product.pharmacy_stock?.[0]?.price_xof
                return (
                  <button
                    key={product.id}
                    onClick={() => navigate(`/client/product/${product.id}`)}
                    className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all text-left active:scale-[0.98]"
                  >
                    <div className="relative bg-gray-50">
                      <img
                        src={product.image_url ?? 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=200&h=160&fit=crop'}
                        alt={product.name}
                        className="w-full h-36 object-cover"
                      />
                      {product.requires_prescription && (
                        <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-lg">
                          ORDONNANCE
                        </span>
                      )}
                      <button className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      </button>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-[12px] text-gray-900 leading-snug line-clamp-2">{product.name}</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">by {product.brand ?? 'Générique'}</p>
                      <div className="flex items-center justify-between mt-2">
                        {price != null ? (
                          <p className="text-primary-600 font-bold text-sm">{formatXOF(price)}</p>
                        ) : (
                          <p className="text-gray-300 text-xs">N/D</p>
                        )}
                        <div className="flex items-center gap-0.5">
                          <Star size={11} className="text-yellow-400 fill-yellow-400" />
                          <span className="text-[10px] text-gray-500 font-medium">4.5</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* Nearby Pharmacies */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 text-[15px]">Pharmacies partenaires</h2>
            <button
              onClick={() => navigate('/client/search?tab=pharmacies')}
              className="text-xs text-primary-600 font-semibold flex items-center gap-0.5"
            >
              Voir plus <ChevronRight size={13} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {pharmacies.slice(0, 3).map(ph => (
                <button
                  key={ph.id}
                  onClick={() => navigate(`/client/search?pharmacy=${ph.id}`)}
                  className="w-full bg-white rounded-2xl p-3.5 flex items-center gap-3.5 shadow-card hover:shadow-card-hover transition-all text-left active:scale-[0.99]"
                >
                  <img
                    src={ph.image_url ?? 'https://images.pexels.com/photos/3683053/pexels-photo-3683053.jpeg?w=100&h=100&fit=crop'}
                    alt={ph.name}
                    className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">{ph.name}</h3>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                      <MapPin size={10} className="flex-shrink-0" /> {ph.address}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs font-semibold text-gray-700">
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        {ph.rating.toFixed(1)}
                        <span className="text-gray-400 font-normal">({ph.rating_count})</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock size={10} />
                        {ph.opening_time}–{ph.closing_time}
                      </span>
                    </div>
                  </div>
                  <div className="w-7 h-7 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <ChevronRight size={14} className="text-primary-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
