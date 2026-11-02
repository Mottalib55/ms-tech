export function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatCurrencyDetailed(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const text = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  return `${value >= 0 ? '+' : ''}${text} %`;
}

export function formatCompact(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatDate(dateString: string): string {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatMonth(month: string): string {
  const d = new Date(`${month}-15`);
  return Number.isNaN(d.getTime()) ? month : d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return 'Jamais';
  const diffMin = Math.floor((Date.now() - new Date(dateString).getTime()) / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.floor(h / 24);
  return d < 30 ? `Il y a ${d} j` : formatDate(dateString);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** "1 234,5" or "1234.5" as typed on a French keyboard; NaN when it is not a number. */
export function parseAmount(text: string): number {
  const cleaned = text.replace(/[\s  ]/g, '').replace(',', '.');
  return cleaned === '' ? NaN : Number(cleaned);
}
