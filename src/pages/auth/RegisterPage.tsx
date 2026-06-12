import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ChevronLeft, Pill } from 'lucide-react'

const ROLES = [
  { value: 'client', label: 'Client / Patient', desc: 'Commander des médicaments' },
  { value: 'pharmacy', label: 'Pharmacie', desc: 'Gérer vos commandes en ligne' },
  { value: 'deliverer', label: 'Livreur', desc: 'Livrer et gagner de l\'argent' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('client')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError || !data.user) {
      setError(signUpError?.message || 'Erreur lors de l\'inscription')
      setLoading(false)
      return
    }

    await supabase.from('profiles').upsert({
      id: data.user.id,
      role,
      full_name: fullName,
      phone,
    })

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-800 flex items-end justify-center">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-10 shadow-2xl animate-slide-up">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Créer un compte</h1>
            <p className="text-xs text-gray-400">Étape {step} / 2</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-medium mb-4">Je suis :</p>
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  role === r.value ? 'border-primary-500 bg-primary-50' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 transition-all ${
                  role === r.value ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                }`} />
                <div>
                  <p className="font-semibold text-sm text-gray-900">{r.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                </div>
              </button>
            ))}
            <button
              onClick={() => setStep(2)}
              className="w-full bg-primary-600 text-white font-semibold py-3.5 rounded-xl hover:bg-primary-700 transition text-sm mt-2"
            >
              Continuer
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Konan Aya"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="+225 07 00 00 000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Min. 8 caractères"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white font-semibold py-3.5 rounded-xl hover:bg-primary-700 transition disabled:opacity-60 text-sm"
            >
              {loading ? 'Inscription...' : 'Créer mon compte'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary-600 font-semibold">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
