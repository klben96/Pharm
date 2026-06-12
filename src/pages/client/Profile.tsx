import { useNavigate } from 'react-router-dom'
import { ChevronRight, MapPin, Bell, HelpCircle, Info, Shield, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const MENU_SECTIONS = [
  {
    items: [
      { icon: MapPin, label: 'Mes adresses', color: 'bg-blue-100 text-blue-600' },
      { icon: Bell, label: 'Notifications', color: 'bg-red-100 text-red-500', badge: '3' },
      { icon: Settings, label: 'Paramètres', color: 'bg-gray-100 text-gray-600' },
    ],
  },
  {
    items: [
      { icon: HelpCircle, label: 'FAQ', color: 'bg-yellow-100 text-yellow-600' },
      { icon: Info, label: 'À propos de l\'app', color: 'bg-green-100 text-green-600' },
      { icon: Shield, label: 'Conditions d\'utilisation', color: 'bg-purple-100 text-purple-600' },
    ],
  },
]

const DEMO_PORTALS = [
  { role: 'pharmacy', label: 'Interface Pharmacie', emoji: '🏥' },
  { role: 'deliverer', label: 'Interface Livreur', emoji: '🛵' },
  { role: 'admin', label: 'Panneau Admin', emoji: '⚙️' },
]

export default function ClientProfile() {
  const navigate = useNavigate()
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <h1 className="font-bold text-xl text-gray-900">Mon Profil</h1>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* User card */}
        <div className="bg-primary-600 rounded-3xl p-5 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="absolute left-0 bottom-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 z-10">
            <span className="text-white font-black text-2xl">
              {(profile?.full_name?.[0] ?? 'U').toUpperCase()}
            </span>
          </div>
          <div className="z-10">
            <h2 className="text-white font-bold text-lg leading-tight">{profile?.full_name ?? 'Utilisateur'}</h2>
            <p className="text-primary-200 text-sm">{profile?.phone ?? 'Téléphone non renseigné'}</p>
            <span className="inline-block mt-2 bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg capitalize">
              {profile?.role === 'client' ? '👤 Client' : profile?.role}
            </span>
          </div>
        </div>

        {/* Main menu */}
        {MENU_SECTIONS.map((section, si) => (
          <div key={si} className="bg-white rounded-2xl shadow-card overflow-hidden">
            {section.items.map((item, i) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition ${
                  i < section.items.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className={`w-9 h-9 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <item.icon size={17} />
                </div>
                <span className="flex-1 text-[14px] font-medium text-gray-800">{item.label}</span>
                {(item as any).badge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {(item as any).badge}
                  </span>
                )}
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        ))}

        {/* Demo portals */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <p className="px-5 pt-4 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Accès portails</p>
          {DEMO_PORTALS.map((portal, i) => (
            <button
              key={portal.role}
              onClick={() => navigate(`/${portal.role}`)}
              className={`w-full flex items-center gap-4 px-5 py-3.5 text-left hover:bg-gray-50 transition ${
                i < DEMO_PORTALS.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <span className="text-xl w-9 text-center">{portal.emoji}</span>
              <span className="flex-1 text-[14px] font-medium text-gray-700">{portal.label}</span>
              <ChevronRight size={15} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full bg-white border border-red-100 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 transition shadow-card"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </div>
  )
}
