const STATUS_ORDER = { overdue: 0, warning: 1, ok: 2, empty: 3 };

export function getPartStatus(part, currentKm) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let kmStatus = 'empty';
  if (part.next_km != null) {
    const diff = part.next_km - currentKm;
    if (diff <= 0) kmStatus = 'overdue';
    else if (diff <= 1000) kmStatus = 'warning';
    else kmStatus = 'ok';
  }

  let dateStatus = 'empty';
  if (part.next_date) {
    const next = new Date(part.next_date);
    next.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((next - today) / 86400000);
    if (diffDays <= 0) dateStatus = 'overdue';
    else if (diffDays <= 30) dateStatus = 'warning';
    else dateStatus = 'ok';
  }

  // Retorna o pior status entre km e data
  return STATUS_ORDER[kmStatus] <= STATUS_ORDER[dateStatus] ? kmStatus : dateStatus;
}

export const STATUS_COLORS = {
  empty: { bg: '#f1f5f9', border: '#e2e8f0', icon: '#94a3b8', text: '#94a3b8' },
  ok:    { bg: '#f0fdf4', border: '#86efac', icon: '#16a34a', text: '#16a34a' },
  warning: { bg: '#fefce8', border: '#fde047', icon: '#ca8a04', text: '#ca8a04' },
  overdue: { bg: '#fef2f2', border: '#fca5a5', icon: '#dc2626', text: '#dc2626' },
};

export const STATUS_ICONS = {
  empty: 'plus',
  ok: 'check',
  warning: 'alert',
  overdue: 'close',
};

export const STATUS_LABEL = {
  ok: 'Em dia',
  warning: 'Atenção',
  overdue: 'Vencido',
  empty: null,
};
