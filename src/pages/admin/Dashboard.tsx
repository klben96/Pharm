import { useEffect, useState } from 'react'
import { ShoppingBag, Users, Building2, TrendingUp, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatXOF, ORDER_STATUSES } from '../../lib/utils'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0, totalRevenue: 0, totalUsers: 0,
    totalPharmacies: 0, pendingOrders: 0, deliveredToday: 0,
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('id,status,total_xof,created_at'),
      supabase.from('profiles').select('id,role'),
      supabase.from('pharmacies').select('id,status'),
    ]).then(([{ data: orders }, { data: profiles }, { data: pharmacies }]) => {
      const o = orders ?? []
      const today = new Date().toDateString()
      setStats({
        totalOrders: o.length,
        totalRevenue: o.filter(x => x.status === 'delivered').reduce((s, x) => s + x.total_xof, 0),
        totalUsers: (profiles ?? []).filter(p => p.role === 'client').length,
        totalPharmacies: (pharmacies ?? []).filter(p => p.status === 'active').length,
        pendingOrders: o.filter(x => x.status === 'pending').length,
        deliveredToday: o.filter(x => x.status === 'delivered' && new Date(x.created_at).toDateString() === today).length,
      })
    })

    supabase
      .from('orders')
      .select('id,order_number,status,total_xof,created_at,profiles!orders_client_id_fkey(full_name),pharmacies(name)')
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        setRecentOrders(data ?? [])
        setLoading(false)
      })
  }, [])

  const STAT_CARDS = [
    { label: 'Commandes totales', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600 bg-blue-50', change: '+12%' },
    { label: 'CA généré', value: formatXOF(stats.totalRevenue), icon: TrendingUp, color: 'text-green-600 bg-green-50', change: '+8%' },
    { label: 'Clients inscrits', value: stats.totalUsers, icon: Users, color: 'text-purple-600 bg-purple-50', change: '+24%' },
    { label: 'Pharmacies actives', value: stats.totalPharmacies, icon: Building2, color: 'text-orange-600 bg-orange-50', change: 'stable' },
    { label: 'En attente', value: stats.pendingOrders, icon: Clock, color: 'text-yellow-600 bg-yellow-50', change: '' },
    { label: 'Livrés aujourd\'hui', value: stats.deliveredToday, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50', change: '' },
  ]

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-500 text-sm mt-1">Vue d'ensemble de l'écosystème Pharmacie à Domicile</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon size={20} />
              </div>
              {card.change && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  card.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {card.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent orders table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Commandes récentes</h2>
          <span className="text-xs text-slate-400">{recentOrders.length} dernières commandes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 text-left">
                {['N° Commande', 'Client', 'Pharmacie', 'Statut', 'Montant', 'Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t border-slate-50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : recentOrders.map((order: any) => {
                const status = ORDER_STATUSES[order.status]
                return (
                  <tr key={order.id} className="border-t border-slate-50 hover:bg-slate-50 transition">
                    <td className="px-5 py-3.5 text-sm font-mono text-slate-600">{order.order_number}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-700 font-medium">{(order.profiles as any)?.full_name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500">{(order.pharmacies as any)?.name ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status?.bg} ${status?.color}`}>
                        {status?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-700">{formatXOF(order.total_xof)}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
