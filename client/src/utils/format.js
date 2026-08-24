export function digits(value) {
  return String(value || '').replace(/[^\d+]/g, '');
}

export function escapeAttr(value = '') {
  return escapeHTML(value).replaceAll('"', '&quot;');
}

export function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function formatPrice(value) {
  const price = Number(value || 0);
  return `${new Intl.NumberFormat('ru-RU').format(price)} ₽`;
}
