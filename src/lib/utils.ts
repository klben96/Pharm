export function formatXOF(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateShort(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date))
}

export const ORDER_STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  validated: { label: 'Validée', color: 'text-blue-700', bg: 'bg-blue-50' },
  preparing: { label: 'En préparation', color: 'text-blue-700', bg: 'bg-blue-50' },
  ready: { label: 'Prête', color: 'text-green-700', bg: 'bg-green-50' },
  picked_up: { label: 'Récupérée', color: 'text-purple-700', bg: 'bg-purple-50' },
  delivering: { label: 'En livraison', color: 'text-orange-700', bg: 'bg-orange-50' },
  delivered: { label: 'Livrée', color: 'text-green-700', bg: 'bg-green-100' },
  cancelled: { label: 'Annulée', color: 'text-red-700', bg: 'bg-red-50' },
}
