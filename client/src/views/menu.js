import { digits, escapeAttr, formatPrice } from '../utils/format.js';

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
  return `
    <header class="hero">
      <nav class="topbar">
        <a class="brand-mark" href="#menu" aria-label="ЧамБу меню">ЧБ</a>
        <div class="topbar__meta">
          <span>${brand.hours}</span>
          <a href="tel:${digits(brand.phone)}">${brand.phone}</a>
        </div>
      </nav>
      <section class="hero__content">
        <p class="eyebrow">${brand.subtitle}</p>
        <h1>${brand.name}</h1>
        <p>${brand.description}</p>
        <div class="hero__actions">
          <a class="button button--primary" href="#menu">Открыть меню</a>
          <a class="button button--ghost" href="tel:${digits(brand.phone)}">Позвонить</a>
        </div>
      </section>
    </header>

    <main>
      ${state.notice ? `<p class="notice">${state.notice}</p>` : ''}
      <section class="info-strip" aria-label="Информация">
        ${brand.highlights.map((item) => `<span>${item}</span>`).join('')}
        <span>${brand.address}</span>
      </section>

      <section class="menu-shell" id="menu">
        <aside class="menu-sidebar">
          <div>
            <p class="eyebrow">Меню</p>
            <h2>Выберите настроение</h2>
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
          ${filteredItems(state).map((item) => itemCard(item, state.cart)).join('') || '<p class="empty">Ничего не нашли. Попробуйте другой запрос.</p>'}
        </section>
      </section>
    </main>

    <footer class="site-footer">
      <button class="admin-footer-link" data-route="admin">Для администратора</button>
    </footer>

    ${cartCount(state.cart) ? cartBar(state) : ''}
  `;
}

function categoryButton(category, activeCategory) {
  const isActive = activeCategory === category.id;
  return `<button class="tab ${isActive ? 'is-active' : ''}" data-category="${category.id}">${category.name}</button>`;
}

function itemCard(item, cart) {
  const qty = cart.get(item.id) || 0;
  const colors = imageThemes[item.image] || ['#314f45', '#d7ad6a'];
  const imageUrl = item.imageUrl || dishImageBySlug(item.id) || dishImageByCategory(item.categoryId);
  const imageStyle = imageUrl
    ? `background-image: linear-gradient(180deg, rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.18)), url('${imageUrl}')`
    : `--c1: ${colors[0]}; --c2: ${colors[1]}`;
  return `
    <article class="menu-card">
      <div class="dish-art ${imageUrl ? 'dish-art--photo' : ''}" style="${imageStyle}">
        ${imageUrl ? '' : `<span>${item.name.slice(0, 1)}</span>`}
      </div>
      <div class="menu-card__body">
        <div class="menu-card__title">
          <h3>${item.name}</h3>
          <strong>${formatPrice(item.price)}</strong>
        </div>
        <p>${item.description}</p>
        <div class="menu-card__meta">
          <span>${item.weight}</span>
          ${item.badges.map((badge) => `<span>${badge}</span>`).join('')}
        </div>
      </div>
      <div class="stepper" aria-label="Количество ${item.name}">
        <button data-dec="${item.id}" ${qty === 0 ? 'disabled' : ''}>-</button>
        <span>${qty}</span>
        <button data-inc="${item.id}">+</button>
      </div>
    </article>
  `;
}

function dishImageBySlug(slug) {
  return {
    'pancake-honey': '/assets/dishes/blini-folded.jpg',
    'pancake-chicken': '/assets/dishes/blini-stack.jpg',
    'pancake-berry': '/assets/dishes/blini-berries.jpg',
    'omelet-cheese': '/assets/dishes/blini-round.jpg',
    syrniki: '/assets/dishes/blini-berries.jpg',
    'croissant-salmon': '/assets/dishes/blini-folded.jpg',
    'raf-cardamom': '/assets/dishes/citrus.jpg',
    'mountain-tea': '/assets/dishes/citrus.jpg',
    'berry-lemonade': '/assets/dishes/citrus.jpg',
  }[slug];
}

function dishImageByCategory(categoryId) {
  return {
    pancakes: '/assets/dishes/blini-round.jpg',
    breakfast: '/assets/dishes/blini-folded.jpg',
    drinks: '/assets/dishes/citrus.jpg',
  }[categoryId];
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
