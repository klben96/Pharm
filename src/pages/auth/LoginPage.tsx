import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff } from 'lucide-react'

const DEMO_ROLES = [
  { role: 'client', label: 'Client', emoji: '👤', color: 'bg-blue-600', desc: 'Commander des médicaments' },
  { role: 'pharmacy', label: 'Pharmacie', emoji: '🏥', color: 'bg-green-600', desc: 'Gérer les commandes' },
  { role: 'deliverer', label: 'Livreur', emoji: '🛵', color: 'bg-orange-500', desc: 'Livrer et gagner' },
  { role: 'admin', label: 'Admin', emoji: '⚙️', color: 'bg-slate-700', desc: 'Panneau de contrôle' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Email ou mot de passe incorrect.')
    setLoading(false)
  }

  async function loginDemo(role: string) {
    setDemoLoading(role)
    setError('')
    const emailMap: Record<string, string> = {
      client: 'client@demo.com',
      pharmacy: 'pharmacie@demo.com',
      deliverer: 'livreur@demo.com',
      admin: 'admin@demo.com',
    }
    const nameMap: Record<string, string> = {
      client: 'Konan Aya', pharmacy: 'Pharmacie Centrale', deliverer: 'Kouassi Jean', admin: 'Super Admin',
    }
    const demoEmail = emailMap[role]

    const { data, error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: 'Demo1234!' })
    if (error || !data.user) {
      const { data: signUpData } = await supabase.auth.signUp({ email: demoEmail, password: 'Demo1234!' })
      if (signUpData.user) {
        await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          role,
          full_name: nameMap[role],
          phone: '+225 07 00 00 000',
        })
      }
    }
    setDemoLoading(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-primary-600">
      {/* Splash top */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 pb-8">
        {/* Logo */}
        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl mb-6">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="12" fill="#2563eb"/>
            <rect x="18" y="10" width="4" height="20" rx="2" fill="white"/>
            <rect x="10" y="18" width="20" height="4" rx="2" fill="white"/>
          </svg>
        </div>
        <h1 className="text-white font-extrabold text-3xl tracking-tight">Pharmacie</h1>
        <p className="text-primary-200 text-base font-medium mt-1">à Domicile</p>
        <p className="text-primary-300 text-sm mt-3 text-center max-w-xs leading-relaxed">
          Vos médicaments commandés en ligne, livrés chez vous en 45 minutes.
        </p>
      </div>

      {/* Bottom sheet */}
      <div className="bg-white rounded-t-[32px] px-6 pt-7 pb-10 shadow-2xl">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 mb-5">
          <div>
            <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">Adresse email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="votre@email.com"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-600 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl hover:bg-primary-700 transition disabled:opacity-60 text-[15px]"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Accès démo rapide</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {DEMO_ROLES.map(({ role, label, emoji, color, desc }) => (
            <button
              key={role}
              onClick={() => loginDemo(role)}
              disabled={demoLoading !== null}
              className={`${color} text-white rounded-2xl p-3.5 flex flex-col items-start gap-1 transition hover:opacity-90 disabled:opacity-60 active:scale-[0.97]`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="font-bold text-sm">{label}</span>
              <span className="text-[10px] text-white/70 leading-tight">{desc}</span>
              {demoLoading === role && (
                <span className="text-[10px] text-white/60 animate-pulse">Connexion...</span>
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-5">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary-600 font-bold">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
