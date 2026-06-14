import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Bike, ArrowLeft } from 'lucide-react'

export default function DelivererLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email ou mot de passe incorrect.')
    setLoading(false)
  }

  async function loginDemo() {
    setDemoLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: 'livreur@demo.com', password: 'Demo1234!' })
    if (error || !data.user) {
      const { data: s } = await supabase.auth.signUp({ email: 'livreur@demo.com', password: 'Demo1234!' })
      if (s.user) await supabase.from('profiles').upsert({ id: s.user.id, role: 'deliverer', full_name: 'Kouassi Jean', phone: '+225 05 00 00 000' })
    }
    setDemoLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-accent-600">
      <div className="px-5 pt-8">
        <a href="/" className="inline-flex items-center gap-2 text-accent-200 hover:text-white text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Portail principal
        </a>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <Bike size={36} className="text-accent-600" strokeWidth={2} />
        </div>
        <div className="text-center mb-2">
          <h1 className="text-white font-black text-3xl">App Livreur</h1>
          <p className="text-accent-200 font-semibold mt-1">Espace Coursier 🛵</p>
        </div>
        <p className="text-accent-300 text-sm text-center max-w-xs leading-relaxed mt-2">
          Acceptez des courses, naviguez efficacement et gérez vos gains avec votre portefeuille Mobile Money.
        </p>
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {['🗺️ GPS intégré', '🔑 Code double confirmation', '💰 Portefeuille numérique', '⭐ Système de bonus'].map(f => (
            <span key={f} className="bg-white/15 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full">{f}</span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-t-[32px] px-6 pt-7 pb-10 shadow-2xl">
        <h2 className="font-bold text-gray-900 text-xl mb-5">Connexion Livreur</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-5">
          <div>
            <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">Adresse email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 transition"
              placeholder="livreur@email.com" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 transition pr-12"
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-accent-600 text-white font-bold py-4 rounded-2xl hover:bg-accent-700 transition disabled:opacity-60 text-[15px]">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <button onClick={loginDemo} disabled={demoLoading}
          className="w-full bg-accent-50 border-2 border-accent-100 text-accent-700 font-bold py-3.5 rounded-2xl hover:bg-accent-100 transition disabled:opacity-60 text-sm flex items-center justify-center gap-2">
          <span>🛵</span>
          {demoLoading ? 'Connexion démo...' : 'Accès démo — Livreur'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-5">
          Pas encore inscrit ?{' '}
          <Link to="/register" className="text-accent-600 font-bold">Rejoindre l'équipe</Link>
        </p>
      </div>
    </div>
  )
}
