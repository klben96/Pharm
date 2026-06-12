import { useEffect, useState } from 'react'
import { Search, CircleUser as UserCircle, CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDate } from '../../lib/utils'

const ROLE_COLORS: Record<string, string> = {
  client: 'bg-blue-50 text-blue-700',
  pharmacy: 'bg-green-50 text-green-700',
  deliverer: 'bg-orange-50 text-orange-700',
  admin: 'bg-slate-100 text-slate-700',
}

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers(data ?? []); setLoading(false) })
  }, [])

  const filtered = users.filter(u => {
    const matchQuery = !query || u.full_name.toLowerCase().includes(query.toLowerCase()) || (u.phone ?? '').includes(query)
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchQuery && matchRole
  })

  const ROLE_COUNTS = ['client', 'pharmacy', 'deliverer', 'admin'].map(r => ({
    role: r, count: users.filter(u => u.role === r).length,
  }))

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Utilisateurs</h1>
        <p className="text-slate-500 text-sm mt-1">{users.length} utilisateurs enregistrés</p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {ROLE_COUNTS.map(({ role, count }) => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
            className={`bg-white rounded-2xl p-4 shadow-card text-left transition-all ${roleFilter === role ? 'ring-2 ring-primary-500' : ''}`}
          >
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="text-sm text-slate-500 capitalize mt-0.5">{role === 'deliverer' ? 'Livreurs' : role === 'pharmacy' ? 'Pharmacies' : role === 'admin' ? 'Admins' : 'Clients'}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-4">
          <div className="flex items-center gap-2 flex-1 bg-slate-50 rounded-xl px-4 py-2.5">
            <Search size={16} className="text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'client', 'pharmacy', 'deliverer', 'admin'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  roleFilter === r ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {r === 'all' ? 'Tous' : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {['Utilisateur', 'Rôle', 'Téléphone', 'Date d\'inscription'].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-slate-50">
                  {[...Array(4)].map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.map(user => (
              <tr key={user.id} className="border-t border-slate-50 hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center">
                      <UserCircle size={22} className="text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-800">{user.full_name || '—'}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${ROLE_COLORS[user.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">{user.phone ?? '—'}</td>
                <td className="px-6 py-4 text-sm text-slate-400">
                  {new Date(user.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">Aucun utilisateur trouvé</div>
        )}
      </div>
    </div>
  )
}
