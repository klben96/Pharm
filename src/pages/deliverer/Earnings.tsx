import { useEffect, useState } from 'react'
import { TrendingUp, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { formatXOF, formatDateShort } from '../../lib/utils'

export default function DelivererEarnings() {
  const { profile } = useAuth()
  const [earnings, setEarnings] = useState<any[]>([])
  const [balance, setBalance] = useState(0)
  const [weekTotal, setWeekTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('deliverer_earnings')
      .select('*')
      .eq('deliverer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const list = data ?? []
        setEarnings(list)
        const bal = list.reduce((s: number, e: any) => s + (e.type === 'withdrawal' ? -e.amount_xof : e.amount_xof), 0)
        setBalance(bal)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const week = list.filter((e: any) => new Date(e.created_at) >= weekAgo && e.type !== 'withdrawal')
          .reduce((s: number, e: any) => s + e.amount_xof, 0)
        setWeekTotal(week)
        setLoading(false)
      })
  }, [profile])

  async function handleWithdraw() {
    if (!profile || !withdrawAmount) return
    const amount = parseInt(withdrawAmount)
    if (isNaN(amount) || amount < 1000 || amount > balance) return
    setWithdrawing(true)
    await supabase.from('deliverer_earnings').insert({
      deliverer_id: profile.id,
      amount_xof: amount,
      type: 'withdrawal',
      description: 'Retrait Mobile Money',
    })
    setBalance(b => b - amount)
    setEarnings(prev => [{
      id: 'new', deliverer_id: profile.id, amount_xof: amount, type: 'withdrawal',
      description: 'Retrait Mobile Money', created_at: new Date().toISOString()
    }, ...prev])
    setWithdrawAmount('')
    setWithdrawing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-gradient-to-br from-accent-500 to-accent-700 px-5 pt-12 pb-6">
        <h1 className="text-white text-xl font-bold mb-4">Mes gains</h1>

        <div className="bg-white/15 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} className="text-accent-200" />
            <p className="text-accent-200 text-sm font-medium">Solde disponible</p>
          </div>
          <p className="text-white text-4xl font-bold">{formatXOF(balance)}</p>
          <p className="text-accent-200 text-xs mt-1">Cette semaine : +{formatXOF(weekTotal)}</p>
        </div>

        {/* Withdraw */}
        <div className="mt-4 bg-white/10 rounded-2xl p-4">
          <p className="text-white font-semibold text-sm mb-2">Retrait Mobile Money</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Montant min. 1 000 XOF"
              className="flex-1 bg-white/20 text-white placeholder-white/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
              min="1000"
              max={balance}
            />
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || !withdrawAmount || parseInt(withdrawAmount) < 1000 || parseInt(withdrawAmount) > balance}
              className="bg-white text-accent-600 font-bold px-4 py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              {withdrawing ? '...' : 'Retirer'}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 py-4">
        <h2 className="font-bold text-gray-900 mb-3">Historique des gains</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="bg-gray-100 rounded-2xl h-16 animate-pulse" />)}
          </div>
        ) : earnings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-card">
            <TrendingUp size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Aucun gain enregistré</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {earnings.map((e: any) => (
              <div key={e.id} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-card">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  e.type === 'withdrawal' ? 'bg-red-50' : e.type === 'bonus' ? 'bg-yellow-50' : 'bg-green-50'
                }`}>
                  {e.type === 'withdrawal'
                    ? <ArrowUpRight size={18} className="text-red-500" />
                    : <ArrowDownLeft size={18} className={e.type === 'bonus' ? 'text-yellow-600' : 'text-green-600'} />
                  }
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{e.description ?? (e.type === 'delivery' ? 'Course livrée' : e.type === 'bonus' ? 'Bonus' : 'Retrait')}</p>
                  <p className="text-xs text-gray-400">{formatDateShort(e.created_at)}</p>
                </div>
                <p className={`font-bold text-sm ${e.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'}`}>
                  {e.type === 'withdrawal' ? '-' : '+'}{formatXOF(e.amount_xof)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
