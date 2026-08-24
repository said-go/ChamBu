import { digits, escapeAttr, escapeHTML, formatPrice } from '../utils/format.js';

const imageThemes = {
  citrus: ['#d97822', '#f3dfb2'],
  'pancake-folded': ['#b47731', '#f2d39d'],
  'pancake-stack': ['#8f5b2d', '#e6bd75'],
  'pancake-berries': ['#8f4f36', '#d99b8e'],
  coffee: ['#4a2b1b', '#c58b54'],
  latte: ['#6b4a2f', '#ead2a5'],
  americano: ['#2d1b14', '#8f5c35'],
  tea: ['#7d2d1c', '#e4a333'],
  lemonade: ['#cf4d5a', '#ffd166'],
  breakfast: ['#266457', '#f1bc5b'],
  croissant: ['#b66a2c', '#f3c27a'],
  syrniki: ['#d09a3c', '#f7e7b8'],
  dessert: ['#55784d', '#e8c08a'],
  tiramisu: ['#513123', '#d9b78f'],
};

export function renderMenu(state) {
  const { brand } = state.catalog;
  const safeBrand = {
    name: escapeHTML(brand.name),
    subtitle: escapeHTML(brand.subtitle),
    description: escapeHTML(brand.description),
    phone: escapeHTML(brand.phone),
    address: escapeHTML(brand.address),
    hours: escapeHTML(brand.hours),
    phoneHref: digits(brand.phone),
  };

  return `
    <header class="hero">
      <nav class="topbar">
        <a class="brand-mark" href="#menu" aria-label="ЧамБу меню">ЧБ</a>
        <div class="topbar__meta">
          <span>${safeBrand.hours}</span>
          <a href="tel:${safeBrand.phoneHref}">${safeBrand.phone}</a>
        </div>
      </nav>
      <section class="hero__content">
        <p class="eyebrow">${safeBrand.subtitle}</p>
        <h1>${safeBrand.name}</h1>
        <p>${safeBrand.description}</p>
        <div class="hero__actions">
          <a class="button button--primary" href="#menu">Открыть меню</a>
          <a class="button button--ghost" href="tel:${safeBrand.phoneHref}">Позвонить</a>
        </div>
      </section>
    </header>

    <main>
      ${state.notice ? `<p class="notice">${escapeHTML(state.notice)}</p>` : ''}
      <section class="info-strip" aria-label="Информация">
        ${(brand.highlights || []).map((item) => `<span>${escapeHTML(item)}</span>`).join('')}
        <span>${safeBrand.address}</span>
      </section>

      <section class="menu-shell" id="menu">
        <aside class="menu-sidebar">
          <div>
            <p class="eyebrow">Меню</p>
            <h2>Выберите то, что хочется сейчас</h2>
          </div>
          <label class="search">
            <span>Поиск</span>
            <input data-search type="search" placeholder="блин, сырники, чай" value="${escapeAttr(state.query)}" />
          </label>
          <div class="tabs">
            ${categoryButton({ id: 'all', name: 'Все' }, state.activeCategory)}
            ${state.catalog.categories.map((category) => categoryButton(category, state.activeCategory)).join('')}
          </div>
        </aside>

        <section class="menu-list" aria-live="polite">
          ${menuContent(state)}
        </section>
      </section>
    </main>

    <footer class="site-footer">
      <button class="admin-footer-link" data-route="admin">Для администратора</button>
    </footer>

    ${cartCount(state.cart) ? cartBar(state) : ''}
  `;
}

function menuContent(state) {
  if (state.loading) {
    return Array.from({ length: 4 }, (_, index) => `<article class="menu-card skeleton" aria-hidden="true"><span>${index}</span></article>`).join('');
  }

  const items = filteredItems(state);
  if (!items.length) {
    return '<p class="empty">Ничего не нашли. Попробуйте другой запрос или категорию.</p>';
  }

  return items.map((item) => itemCard(item, state.cart)).join('');
}

function categoryButton(category, activeCategory) {
  const isActive = activeCategory === category.id;
  return `<button class="tab ${isActive ? 'is-active' : ''}" data-category="${escapeAttr(category.id)}">${escapeHTML(category.name)}</button>`;
}

function itemCard(item, cart) {
  const qty = cart.get(item.id) || 0;
  const colors = imageThemes[item.image] || ['#314f45', '#d7ad6a'];
  const imageUrl = safeImageURL(item.imageUrl);
  const imageStyle = imageUrl
    ? `background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.18)), url('${escapeAttr(imageUrl)}')`
    : `--c1: ${colors[0]}; --c2: ${colors[1]}`;
  const name = escapeHTML(item.name);
  const description = escapeHTML(item.description);

  return `
    <article class="menu-card">
      <div class="dish-art ${imageUrl ? 'dish-art--photo' : ''}" style="${imageStyle}" role="img" aria-label="${escapeAttr(item.name)}">
        ${imageUrl ? '' : `<span>${name.slice(0, 1)}</span>`}
      </div>
      <div class="menu-card__body">
        <div class="menu-card__title">
          <h3>${name}</h3>
          <strong>${formatPrice(item.price)}</strong>
        </div>
        <p>${description}</p>
        <div class="menu-card__meta">
          ${item.weight ? `<span>${escapeHTML(item.weight)}</span>` : ''}
          ${(item.badges || []).map((badge) => `<span>${escapeHTML(badge)}</span>`).join('')}
        </div>
      </div>
      <div class="stepper" aria-label="Количество ${escapeAttr(item.name)}">
        <button data-dec="${escapeAttr(item.id)}" aria-label="Убрать ${escapeAttr(item.name)}" ${qty === 0 ? 'disabled' : ''}>-</button>
        <span>${qty}</span>
        <button data-inc="${escapeAttr(item.id)}" aria-label="Добавить ${escapeAttr(item.name)}">+</button>
      </div>
    </article>
  `;
}

function safeImageURL(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (url.startsWith('https://') || url.startsWith('/assets/')) return url;
  return '';
}

function cartBar(state) {
  return `
    <footer class="cart-bar">
      <div>
        <strong>${cartCount(state.cart)} поз.</strong>
        <span>${formatPrice(cartTotal(state.catalog.items, state.cart))}</span>
      </div>
      <a class="button button--primary" href="${orderHref(state)}">Оформить</a>
    </footer>
  `;
}

function filteredItems(state) {
  const query = state.query.trim().toLowerCase();
  return state.catalog.items.filter((item) => {
    const inCategory = state.activeCategory === 'all' || item.categoryId === state.activeCategory;
    const inQuery = !query || `${item.name} ${item.description}`.toLowerCase().includes(query);
    return inCategory && inQuery && item.available;
  });
}

function cartCount(cart) {
  return Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);
}

function cartTotal(items, cart) {
  return items.reduce((sum, item) => sum + item.price * (cart.get(item.id) || 0), 0);
}

function orderHref(state) {
  const lines = state.catalog.items
    .filter((item) => state.cart.has(item.id))
    .map((item) => `${item.name} x ${state.cart.get(item.id)} - ${formatPrice(item.price * state.cart.get(item.id))}`);
  const text = `Здравствуйте! Хочу заказать:\n${lines.join('\n')}\nИтого: ${formatPrice(cartTotal(state.catalog.items, state.cart))}`;
  return `https://wa.me/${digits(state.catalog.brand.phone).replace('+', '')}?text=${encodeURIComponent(text)}`;
}
