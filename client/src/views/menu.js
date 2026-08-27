import { digits, escapeAttr, escapeHTML, formatPrice } from '../utils/format.js';

const imageThemes = {
  citrus: ['#d97822', '#f3dfb2'],
  'pancake-folded': ['#c45e35', '#f3c07a'],
  'pancake-stack': ['#d7a646', '#f8f3ea'],
  'pancake-berries': ['#9f4636', '#f0d1c8'],
  coffee: ['#4a2b1b', '#d7a646'],
  tea: ['#7f3a1c', '#efb84c'],
  lemonade: ['#c45e35', '#f3d48d'],
  breakfast: ['#174f43', '#e7bc65'],
  croissant: ['#b66a2c', '#f0c47d'],
  syrniki: ['#d7a646', '#f8f3ea'],
};

const localDishImages = {
  'pancake-honey': assetURL('assets/dishes/dish-honey.jpg'),
  'pancake-chicken': assetURL('assets/dishes/dish-pancake-stack.jpg'),
  'pancake-berry': assetURL('assets/dishes/dish-honey.jpg'),
  'omelet-cheese': assetURL('assets/dishes/dish-omelet.jpg'),
  syrniki: assetURL('assets/dishes/dish-syrniki.jpg'),
  'croissant-salmon': assetURL('assets/dishes/dish-croissant.jpg'),
  'raf-cardamom': assetURL('assets/dishes/dish-coffee.jpg'),
  'mountain-tea': assetURL('assets/dishes/dish-tea.jpg'),
  'berry-lemonade': assetURL('assets/dishes/dish-oatmeal.jpg'),
};

export function renderMenu(state) {
  const { brand } = state.catalog;
  const phoneHref = digits(brand.phone);

  return `
    <main class="landing-shell">
      <section class="hero-card">
        <div class="hero-visual">
          <nav class="topbar">
            <a class="brand-mark" href="#menu" aria-label="ЧамБу меню">ЧБ</a>
            <div class="topbar__meta">
              <span>${escapeHTML(brand.hours)}</span>
              <a href="tel:${phoneHref}">${escapeHTML(brand.phone)}</a>
            </div>
          </nav>

          <div class="hero__content">
            <p class="eyebrow">${escapeHTML(brand.subtitle)}</p>
            <h1 class="hero-wordmark">
              <img src="${assetURL('assets/chambu-wordmark.svg')}" alt="${escapeAttr(brand.name)}" decoding="async" />
            </h1>
            <p>${escapeHTML(brand.description)}</p>
            <div class="hero__actions">
              <a class="button button--primary" href="#menu">Открыть меню</a>
              <a class="button button--glass" href="tel:${phoneHref}">Позвонить</a>
            </div>
          </div>
        </div>

        <section class="info-strip" aria-label="Информация">
          ${(brand.highlights || []).map((item) => infoRow(item, 'spark')).join('')}
          ${infoRow(brand.address, 'pin')}
        </section>
      </section>

      <section class="menu-panel" id="menu">
        ${state.notice ? `<p class="notice">${escapeHTML(state.notice)}</p>` : ''}
        <div class="menu-head">
          <p class="eyebrow">Меню</p>
          <h2>Выберите то, что хочется сейчас</h2>
        </div>

        <label class="search">
          <span>Поиск</span>
          <input data-search type="search" placeholder="блин, сырники, чай" value="${escapeAttr(state.query)}" />
        </label>

        <div class="tabs" aria-label="Категории меню">
          ${categoryButton({ id: 'all', name: 'Все' }, state.activeCategory)}
          ${state.catalog.categories.map((category) => categoryButton(category, state.activeCategory)).join('')}
        </div>

        <section class="menu-list" aria-live="polite">
          ${menuContent(state)}
        </section>
      </section>
    </main>

    <footer class="site-footer">
      <button class="admin-footer-link" data-route="admin">Для администратора</button>
    </footer>

    ${selectedItemModal(state)}
    ${cartCount(state.cart) ? cartBar(state) : ''}
  `;
}

function infoRow(text, icon) {
  return `
    <div class="info-row">
      <span class="info-row__icon">${icon === 'pin' ? '⌖' : '✦'}</span>
      <span>${escapeHTML(text)}</span>
    </div>
  `;
}

function menuContent(state) {
  if (state.loading) {
    return Array.from({ length: 6 }, (_, index) => `<article class="menu-card skeleton" aria-hidden="true"><span>${index}</span></article>`).join('');
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
  const image = dishImage(item);
  const name = escapeHTML(item.name);

  return `
    <article class="menu-card" data-open-item="${escapeAttr(item.id)}" role="button" tabindex="0" aria-label="Открыть ${escapeAttr(item.name)}">
      ${dishMedia(item, image, 'dish-art')}
      <div class="menu-card__body">
        <div class="menu-card__title">
          <h3>${name}</h3>
          <strong>${formatPrice(item.price)}</strong>
        </div>
        <p>${escapeHTML(item.description)}</p>
        <div class="menu-card__meta">
          ${item.weight ? `<span>${escapeHTML(item.weight)}</span>` : ''}
          ${(item.badges || []).map((badge) => `<span>${escapeHTML(badge)}</span>`).join('')}
        </div>
        <div class="stepper" aria-label="Количество ${escapeAttr(item.name)}">
          <button data-dec="${escapeAttr(item.id)}" aria-label="Убрать ${escapeAttr(item.name)}" ${qty === 0 ? 'disabled' : ''}>−</button>
          <span>${qty}</span>
          <button data-inc="${escapeAttr(item.id)}" aria-label="Добавить ${escapeAttr(item.name)}">+</button>
        </div>
      </div>
    </article>
  `;
}

function selectedItemModal(state) {
  const item = state.catalog.items.find((entry) => entry.id === state.selectedItemId);
  if (!item) return '';

  const qty = state.cart.get(item.id) || 0;
  const image = dishImage(item);

  return `
    <div class="item-modal" data-item-modal role="dialog" aria-modal="true" aria-label="${escapeAttr(item.name)}">
      <article class="item-sheet">
        <button class="item-sheet__close" data-close-item aria-label="Закрыть">×</button>
        ${dishMedia(item, image, 'item-sheet__image')}
        <div class="item-sheet__body">
          <p class="eyebrow">Позиция меню</p>
          <div class="item-sheet__title">
            <h2>${escapeHTML(item.name)}</h2>
            <strong>${formatPrice(item.price)}</strong>
          </div>
          <p>${escapeHTML(item.description)}</p>
          <div class="menu-card__meta">
            ${item.weight ? `<span>${escapeHTML(item.weight)}</span>` : ''}
            ${(item.badges || []).map((badge) => `<span>${escapeHTML(badge)}</span>`).join('')}
          </div>
          <div class="item-sheet__actions">
            <div class="stepper stepper--large" aria-label="Количество ${escapeAttr(item.name)}">
              <button data-dec="${escapeAttr(item.id)}" aria-label="Убрать ${escapeAttr(item.name)}" ${qty === 0 ? 'disabled' : ''}>−</button>
              <span>${qty}</span>
              <button data-inc="${escapeAttr(item.id)}" aria-label="Добавить ${escapeAttr(item.name)}">+</button>
            </div>
            <button class="button button--primary" data-inc="${escapeAttr(item.id)}">Добавить</button>
          </div>
        </div>
      </article>
    </div>
  `;
}

function dishMedia(item, image, className) {
  const colors = imageThemes[item.image] || ['#174f43', '#d7a646'];
  const style = image
    ? `background-image: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.08)), url('${escapeAttr(image)}')`
    : `--c1: ${colors[0]}; --c2: ${colors[1]}`;

  return `
    <div class="${className} ${image ? 'dish-art--photo' : ''}" style="${style}" aria-hidden="true">
      ${image ? '' : `<span>${escapeHTML(item.name).slice(0, 1)}</span>`}
    </div>
  `;
}

function dishImage(item) {
  return safeImageURL(item.imageUrl, item.id) || localDishImages[item.id] || '';
}

function safeImageURL(value, itemId = '') {
  const url = String(value || '').trim();
  if (!url) return '';
  if (url.startsWith('/assets/dishes/blini-') || url.endsWith('/assets/dishes/citrus.jpg')) {
    return localDishImages[itemId] || '';
  }
  if (url.startsWith('/assets/')) return assetURL(url.slice(1));
  if (url.startsWith('https://')) return url;
  return '';
}

function assetURL(path) {
  return new URL(`../../${path}`, import.meta.url).href;
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
