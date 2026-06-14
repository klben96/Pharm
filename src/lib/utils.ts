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
  pending: { label: 'En attente', color: '#92400e', bg: '#fef3c7' },
  validated: { label: 'Validée', color: '#1e40af', bg: '#dbeafe' },
  preparing: { label: 'En préparation', color: '#3730a3', bg: '#e0e7ff' },
  ready: { label: 'Prête', color: '#166534', bg: '#dcfce7' },
  picked_up: { label: 'Récupérée', color: '#6b21a8', bg: '#f3e8ff' },
  delivering: { label: 'En livraison', color: '#c2410c', bg: '#fed7aa' },
  delivered: { label: 'Livrée', color: '#166534', bg: '#bbf7d0' },
  cancelled: { label: 'Annulée', color: '#991b1b', bg: '#fee2e2' },
}
