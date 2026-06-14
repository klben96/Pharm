import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Pill, ArrowLeft } from 'lucide-react'

export default function ClientLoginPage() {
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
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email: 'client@demo.com', password: 'Demo1234!' })
    if (error || !data.user) {
      const { data: s } = await supabase.auth.signUp({ email: 'client@demo.com', password: 'Demo1234!' })
      if (s.user) await supabase.from('profiles').upsert({ id: s.user.id, role: 'client', full_name: 'Konan Aya', phone: '+225 07 00 00 000' })
    }
    setDemoLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-primary-600">
      {/* Back to portal */}
      <div className="px-5 pt-8">
        <a href="/" className="inline-flex items-center gap-2 text-primary-200 hover:text-white text-sm font-medium transition-colors">
          <ArrowLeft size={16} /> Portail principal
        </a>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-10">
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-2xl mb-6">
          <Pill size={36} className="text-primary-600" strokeWidth={2.5} />
        </div>
        <div className="text-center mb-2">
          <h1 className="text-white font-black text-3xl">Pharmacie à Domicile</h1>
          <p className="text-primary-200 font-semibold mt-1">App Client — Abidjan 🇨🇮</p>
        </div>
        <p className="text-primary-300 text-sm text-center max-w-xs leading-relaxed mt-2">
          Commandez vos médicaments, scannez vos ordonnances et suivez vos livraisons en temps réel.
        </p>

        {/* Features pills */}
        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {['💊 Médicaments', '📋 Ordonnances', '🛵 Livraison 45 min', '💰 Mobile Money'].map(f => (
            <span key={f} className="bg-white/15 text-white/90 text-xs font-semibold px-3 py-1.5 rounded-full">{f}</span>
          ))}
        </div>
      </div>

      {/* Form sheet */}
      <div className="bg-white rounded-t-[32px] px-6 pt-7 pb-10 shadow-2xl">
        <h2 className="font-bold text-gray-900 text-xl mb-5">Connexion</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-5">
          <div>
            <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">Adresse email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
              placeholder="votre@email.com" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition pr-12"
                placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl hover:bg-primary-700 transition disabled:opacity-60 text-[15px]">
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <button onClick={loginDemo} disabled={demoLoading}
          className="w-full bg-primary-50 border-2 border-primary-100 text-primary-700 font-bold py-3.5 rounded-2xl hover:bg-primary-100 transition disabled:opacity-60 text-sm flex items-center justify-center gap-2">
          <span>👤</span>
          {demoLoading ? 'Connexion démo...' : 'Accès démo — Client'}
        </button>

        <p className="text-center text-sm text-gray-400 mt-5">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary-600 font-bold">S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
