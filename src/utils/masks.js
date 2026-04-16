// KM: "15000" → "15.000"
export function maskKm(raw) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('pt-BR');
}
export function parseKm(str) {
  return parseInt(str.replace(/\D/g, '') || '0', 10);
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
