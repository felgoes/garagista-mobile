// KM: "15000" → "15.000"
export function maskKm(raw) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('pt-BR');
}
export function parseKm(str) {
  return parseInt(str.replace(/\D/g, '') || '0', 10);
}

function formatDateDigits(digits) {
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function isRealDate(day, month, year) {
  if (year < 1) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

// Date: "01012026" -> "01/01/2026"
export function maskDate(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  return formatDateDigits(digits);
}

export function parseDate(str) {
  if (!str || !str.trim()) return null;
  const [d, m, y] = str.split('/');
  if (!d || !m || !y || d.length !== 2 || m.length !== 2 || y.length !== 4) {
    return null;
  }
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  if (!isRealDate(day, month, year)) return null;
  return `${y}-${m}-${d}`;
}

export function getDateInputState(str, { optional = false } = {}) {
  const value = str?.trim() || '';

  if (!value) {
    return {
      invalid: false,
      tone: 'neutral',
      message: '',
    };
  }

  if (value.length < 10) {
    return {
      invalid: false,
      tone: 'neutral',
      message: 'Complete a data no formato DD/MM/AAAA.',
    };
  }

  if (!parseDate(value)) {
    return {
      invalid: true,
      tone: 'error',
      message: 'Data inválida.\nConfira dia, mês e ano.',
    };
  }

  return {
    invalid: false,
    tone: 'success',
    message: '',
  };
}

// Currency (R$): digits "589" → "5,89"  |  "15099" → "150,99"
export function maskCurrency(raw) {
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '') || '0';
  const padded = digits.padStart(3, '0');
  const int = padded.slice(0, -2) || '0';
  const dec = padded.slice(-2);
  return `${int},${dec}`;
}
export function parseCurrency(str) {
  const digits = str.replace(/\D/g, '');
  return parseInt(digits || '0', 10) / 100;
}
// Init helper: float → raw digits string for maskCurrency
export function currencyToRaw(value) {
  if (value == null || value === '') return '';
  return String(Math.round(value * 100));
}

// Init helper: float → raw digits string for maskLiters
export function litersToRaw(value) {
  if (value == null || value === '') return '';
  return String(Math.round(value * 10));
}

// Liters: "125" → "12,5"  |  "1250" → "125,0"
export function maskLiters(raw) {
  const digits = raw.replace(/\D/g, '').replace(/^0+/, '') || '0';
  const padded = digits.padStart(2, '0');
  const int = padded.slice(0, -1) || '0';
  const dec = padded.slice(-1);
  return `${int},${dec}`;
}
export function parseLiters(str) {
  return parseFloat(str.replace(',', '.')) || 0;
}
