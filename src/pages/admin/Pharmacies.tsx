import { useEffect, useState } from 'react'
import { Building2, Star, MapPin, CheckCircle, XCircle, Clock } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  suspended: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', pending: 'En attente', suspended: 'Suspendue',
}

export default function AdminPharmacies() {
  const [pharmacies, setPharmacies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    supabase.from('pharmacies').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setPharmacies(data ?? []); setLoading(false) })
  }, [])

  async function updateStatus(id: string, status: string) {
    await supabase.from('pharmacies').update({ status }).eq('id', id)
    setPharmacies(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  const filtered = pharmacies.filter(p => statusFilter === 'all' || p.status === statusFilter)

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pharmacies partenaires</h1>
        <p className="text-slate-500 text-sm mt-1">{pharmacies.length} pharmacies enregistrées</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {['active', 'pending', 'suspended'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            className={`bg-white rounded-2xl p-4 shadow-card text-left transition-all ${statusFilter === s ? 'ring-2 ring-primary-500' : ''}`}
          >
            <p className="text-2xl font-bold text-slate-900">{pharmacies.filter(p => p.status === s).length}</p>
            <p className="text-sm text-slate-500 mt-0.5">{STATUS_LABELS[s]}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {loading
          ? [...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-48 animate-pulse" />)
          : filtered.map(ph => (
            <div key={ph.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
              <img
                src={ph.image_url ?? 'https://images.pexels.com/photos/3786126/pexels-photo-3786126.jpeg?w=400&h=160&fit=crop'}
                alt={ph.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-800">{ph.name}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[ph.status]}`}>
                    {STATUS_LABELS[ph.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin size={11} /> {ph.address}, {ph.city}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-slate-500">{ph.rating.toFixed(1)} ({ph.rating_count} avis)</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {ph.status === 'pending' && (
                    <button
                      onClick={() => updateStatus(ph.id, 'active')}
                      className="flex-1 bg-green-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={13} /> Valider
                    </button>
                  )}
                  {ph.status === 'active' && (
                    <button
                      onClick={() => updateStatus(ph.id, 'suspended')}
                      className="flex-1 bg-red-100 text-red-600 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1"
                    >
                      <XCircle size={13} /> Suspendre
                    </button>
                  )}
                  {ph.status === 'suspended' && (
                    <button
                      onClick={() => updateStatus(ph.id, 'active')}
                      className="flex-1 bg-green-100 text-green-600 text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={13} /> Réactiver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        }
      </div>

      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center shadow-card">
          <Building2 size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-slate-400">Aucune pharmacie trouvée</p>
        </div>
      )}
    </div>
  )
}
