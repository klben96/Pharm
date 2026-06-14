import { useState } from 'react'
import { ExternalLink, Smartphone, Monitor, Pill, CheckCircle, ArrowRight, Globe } from 'lucide-react'

const APPS = [
  {
    id: 'client',
    title: 'App Client',
    subtitle: 'Pour les patients',
    description: 'Commandez vos médicaments en quelques clics, scannez vos ordonnances et suivez vos livraisons en temps réel.',
    href: '/client/',
    color: 'from-blue-600 to-blue-700',
    lightColor: 'bg-blue-50',
    accentColor: 'text-blue-600',
    borderColor: 'border-blue-100',
    badgeColor: 'bg-blue-100 text-blue-700',
    icon: '👤',
    type: 'mobile',
    features: [
      'Scan d\'ordonnance par IA',
      'Paiement Mobile Money (MTN, Orange, Moov)',
      'Suivi GPS en temps réel',
      'Historique & renouvellement',
    ],
    mockupBg: 'bg-blue-600',
    screens: ['Accueil', 'Recherche', 'Panier', 'Commandes', 'Profil'],
  },
  {
    id: 'pharmacy',
    title: 'App Pharmacie',
    subtitle: 'Pour les pharmaciens',
    description: 'Gérez vos commandes entrantes, validez les ordonnances médicalement et suivez votre stock en temps réel.',
    href: '/pharmacy/',
    color: 'from-green-600 to-green-700',
    lightColor: 'bg-green-50',
    accentColor: 'text-green-600',
    borderColor: 'border-green-100',
    badgeColor: 'bg-green-100 text-green-700',
    icon: '🏥',
    type: 'mobile',
    features: [
      'Validation médicale des ordonnances',
      'Gestion du stock en temps réel',
      'Code de retrait livreur (6 chiffres)',
      'Tableau de bord & chiffre d\'affaires',
    ],
    mockupBg: 'bg-green-600',
    screens: ['Tableau de bord', 'Commandes', 'Stock', 'Profil'],
  },
  {
    id: 'deliverer',
    title: 'App Livreur',
    subtitle: 'Pour les coursiers',
    description: 'Acceptez des courses, naviguez vers les pharmacies et clients, et gérez vos gains avec votre portefeuille Mobile Money.',
    href: '/deliverer/',
    color: 'from-orange-500 to-orange-600',
    lightColor: 'bg-orange-50',
    accentColor: 'text-orange-600',
    borderColor: 'border-orange-100',
    badgeColor: 'bg-orange-100 text-orange-700',
    icon: '🛵',
    type: 'mobile',
    features: [
      'Navigation GPS intégrée (style Yango)',
      'Double confirmation par code (pharmacie + client)',
      'Portefeuille numérique avec retrait Mobile Money',
      'Bonus de performance & paliers',
    ],
    mockupBg: 'bg-orange-500',
    screens: ['Courses', 'Livraison active', 'Gains', 'Profil'],
  },
  {
    id: 'admin',
    title: 'Dashboard Admin',
    subtitle: 'Pour les administrateurs',
    description: 'Superviser l\'ensemble de l\'écosystème — utilisateurs, commandes, pharmacies, analytics et gestion des litiges.',
    href: '/admin/',
    color: 'from-slate-800 to-slate-900',
    lightColor: 'bg-slate-50',
    accentColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    badgeColor: 'bg-slate-100 text-slate-700',
    icon: '⚙️',
    type: 'desktop',
    features: [
      'KPIs & analytics en temps réel',
      'Validation pharmacies & livreurs',
      'Gestion des litiges & remboursements',
      'Communication push/SMS/email ciblée',
    ],
    mockupBg: 'bg-slate-800',
    screens: ['Dashboard', 'Utilisateurs', 'Commandes', 'Pharmacies'],
  },
]

const STATS = [
  { value: '4', label: 'Applications distinctes' },
  { value: '45 min', label: 'Délai de livraison moyen' },
  { value: '100%', label: 'Traçabilité médicament' },
  { value: 'XOF', label: 'Devise — Franc CFA' },
]

export default function Landing() {
  const [hoveredApp, setHoveredApp] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
        {/* BG decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-20 text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl">
              <Pill size={28} className="text-blue-600" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <h1 className="text-white font-black text-2xl leading-none">Pharmacie</h1>
              <p className="text-blue-300 font-semibold text-sm">à Domicile</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Écosystème V1.1 — Afrique de l'Ouest
          </div>

          <h2 className="text-white font-black text-4xl md:text-6xl leading-tight mb-6 max-w-4xl mx-auto">
            L'écosystème numérique
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              du médicament à domicile
            </span>
          </h2>

          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            4 applications connectées — patients, pharmaciens, livreurs et administrateurs —
            pour une livraison de médicaments sécurisée, tracée et accessible à tous.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-12">
            {STATS.map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="text-white font-black text-2xl">{s.value}</p>
                <p className="text-slate-400 text-xs mt-0.5 leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick access buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            {APPS.map(app => (
              <a
                key={app.id}
                href={app.href}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm px-5 py-2.5 rounded-full transition-all hover:scale-105"
              >
                <span>{app.icon}</span>
                {app.title}
                <ArrowRight size={14} className="opacity-60" />
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Apps grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">L'Écosystème</p>
          <h2 className="text-slate-900 font-black text-3xl md:text-4xl mb-4">4 applications, 1 mission</h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Chaque acteur dispose de son application dédiée, optimisée pour ses besoins spécifiques.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {APPS.map(app => (
            <a
              key={app.id}
              href={app.href}
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={() => setHoveredApp(null)}
              className={`group relative bg-white rounded-3xl border-2 ${app.borderColor} overflow-hidden shadow-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${app.color} p-6 flex items-start justify-between`}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{app.icon}</span>
                    <div className={`flex items-center gap-1 bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full`}>
                      {app.type === 'mobile' ? <Smartphone size={10} /> : <Monitor size={10} />}
                      {app.type === 'mobile' ? 'Application Mobile' : 'Dashboard Web'}
                    </div>
                  </div>
                  <h3 className="text-white font-black text-2xl leading-tight">{app.title}</h3>
                  <p className="text-white/70 text-sm font-medium mt-0.5">{app.subtitle}</p>
                </div>
                <div className={`w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center transition-all duration-300 ${hoveredApp === app.id ? 'bg-white/30 rotate-45' : ''}`}>
                  <ArrowRight size={18} className="text-white" />
                </div>
              </div>

              {/* Screen badges */}
              <div className="px-6 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-white border-b border-gray-50">
                {app.screens.map(screen => (
                  <span key={screen} className={`flex-shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full ${app.badgeColor}`}>
                    {screen}
                  </span>
                ))}
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-slate-600 text-sm leading-relaxed mb-5">{app.description}</p>

                <ul className="space-y-2.5">
                  {app.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <CheckCircle size={15} className={`${app.accentColor} flex-shrink-0 mt-0.5`} />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className={`mt-6 flex items-center gap-2 ${app.accentColor} font-bold text-sm group-hover:gap-3 transition-all`}>
                  Lancer l'application
                  <ExternalLink size={15} />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Flow section */}
      <section className="bg-slate-50 border-y border-slate-100 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-bold text-sm uppercase tracking-widest mb-3">Circuit du médicament</p>
            <h2 className="text-slate-900 font-black text-3xl mb-4">Comment ça fonctionne ?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: '01', icon: '📱', title: 'Le client commande', desc: 'Scanne son ordonnance ou choisit ses médicaments dans le catalogue', color: 'border-blue-200 bg-blue-50' },
              { step: '02', icon: '💊', title: 'La pharmacie valide', desc: 'Le pharmacien valide l\'ordonnance et prépare les médicaments', color: 'border-green-200 bg-green-50' },
              { step: '03', icon: '🛵', title: 'Le livreur récupère', desc: 'Confirme le retrait par code 6 chiffres et se dirige vers le client', color: 'border-orange-200 bg-orange-50' },
              { step: '04', icon: '🏠', title: 'Livraison confirmée', desc: 'Le client valide avec son code de fin de course. Transaction finalisée.', color: 'border-purple-200 bg-purple-50' },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                <div className={`border-2 ${s.color} rounded-3xl p-5 h-full`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="text-[11px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">{s.step}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1.5">{s.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white border-2 border-slate-200 rounded-full items-center justify-center">
                    <ArrowRight size={12} className="text-slate-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <Pill size={20} className="text-blue-600" strokeWidth={2.5} />
            </div>
            <div>
              <p className="font-black text-base">Pharmacie à Domicile</p>
              <p className="text-slate-400 text-xs">Écosystème V1.1 — Abidjan, Côte d'Ivoire</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center">
            {APPS.map(app => (
              <a
                key={app.id}
                href={app.href}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all"
              >
                <Globe size={12} />
                {app.title}
              </a>
            ))}
          </div>

          <p className="text-slate-500 text-xs">© 2025 Pharmacie à Domicile. Confidentiel.</p>
        </div>
      </footer>
    </div>
  )
}
