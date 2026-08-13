export function digits(value) {
  return value.replace(/[^\d+]/g, '');
}

export function escapeAttr(value = '') {
  return String(value).replaceAll('"', '&quot;');
}

export function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}
