import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react'

export default function AdminLoginPage() {
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
    if (error) setError('Accès refusé. Vérifiez vos identifiants.')
    setLoading(false)
  }

  async function loginDemo() {
    setDemoLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: 'admin@demo.com', password: 'Demo1234!' })
    if (error || !data.user) {
      const { data: s } = await supabase.auth.signUp({ email: 'admin@demo.com', password: 'Demo1234!' })
      if (s.user) await supabase.from('profiles').upsert({ id: s.user.id, role: 'admin', full_name: 'Super Administrateur', phone: '+225 00 00 00 000' })
    }
    setDemoLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      {/* Back */}
      <a href="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium transition-colors">
        <ArrowLeft size={16} /> Portail
      </a>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-2xl">
            <Shield size={30} className="text-slate-800" strokeWidth={2} />
          </div>
          <h1 className="text-white font-black text-2xl">Dashboard Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Accès réservé aux administrateurs</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-3xl p-7 shadow-xl border border-slate-700">
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-xl px-4 py-3 text-sm mb-5">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 mb-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-300 mb-1.5">Email administrateur</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
                placeholder="admin@pharmacie.com" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-slate-300 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-11 placeholder:text-slate-500"
                  placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-60">
              {loading ? 'Vérification...' : 'Accéder au tableau de bord'}
            </button>
          </form>

          <button onClick={loginDemo} disabled={demoLoading}
            className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-200 font-semibold py-3 rounded-xl transition disabled:opacity-60 text-sm flex items-center justify-center gap-2">
            <span>⚙️</span>
            {demoLoading ? 'Connexion démo...' : 'Accès démo administrateur'}
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Accès sécurisé — Pharmacie à Domicile v1.1
        </p>
      </div>
    </div>
  )
}
