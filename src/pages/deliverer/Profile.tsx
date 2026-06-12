import { useAuth } from '../../contexts/AuthContext'
import { LogOut, Truck } from 'lucide-react'

export default function DelivererProfile() {
  const { profile, signOut } = useAuth()
  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <div className="bg-white px-5 pt-12 pb-4 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]">
        <h1 className="font-bold text-xl text-gray-900">Mon profil</h1>
      </div>
      <div className="px-5 py-4 space-y-4">
        <div className="bg-gradient-to-r from-accent-500 to-accent-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Truck size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">{profile?.full_name}</h2>
            <p className="text-accent-200 text-sm">{profile?.phone}</p>
            <span className="inline-block mt-1.5 bg-white/20 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">Livreur</span>
          </div>
        </div>
        <button onClick={signOut} className="w-full bg-red-50 border border-red-100 text-red-600 font-semibold py-4 rounded-2xl flex items-center justify-center gap-2">
          <LogOut size={18} /> Déconnexion
        </button>
      </div>
    </div>
  )
}
