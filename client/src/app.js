const fallbackCatalog = {
  brand: {
    name: 'ЧамБу',
    subtitle: 'Кофе, завтраки и десерты в Грозном',
    description: 'Теплое меню для быстрых завтраков, спокойных встреч и сладких пауз.',
    phone: '+7 938 994-88-00',
    address: 'Грозный, ул. Хамзата Орзамиева, 30/30А',
    hours: 'Ежедневно 08:00-22:00',
    highlights: ['с собой', 'завтраки весь день', 'свежая выпечка'],
  },
  categories: [],
  items: [],
};

const imageThemes = {
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

const state = {
  catalog: fallbackCatalog,
  activeCategory: 'all',
  query: '',
  cart: new Map(),
};

const app = document.querySelector('#app');

async function loadCatalog() {
  try {
    const response = await fetch('/api/menu');
    if (!response.ok) throw new Error(`API ${response.status}`);
    state.catalog = await response.json();
  } catch {
    state.catalog = seedFallbackItems(fallbackCatalog);
  }
  render();
}

function seedFallbackItems(catalog) {
  return {
    ...catalog,
    categories: [
      { id: 'coffee', name: 'Кофе', description: 'Классика и авторские напитки.' },
      { id: 'tea', name: 'Чай и лимонады', description: 'Горячие и холодные напитки.' },
      { id: 'breakfast', name: 'Завтраки', description: 'Сытное начало дня.' },
      { id: 'desserts', name: 'Десерты', description: 'Сладости к кофе.' },
    ],
    items: [
      { id: 'raf-cardamom', categoryId: 'coffee', name: 'Раф кардамон', description: 'Сливочный кофе с тонкой пряной нотой.', price: 260, weight: '300 мл', badges: ['хит'], image: 'coffee', available: true },
      { id: 'mountain-tea', categoryId: 'tea', name: 'Горный чай', description: 'Душистый травяной сбор.', price: 220, weight: '450 мл', badges: ['без кофеина'], image: 'tea', available: true },
      { id: 'croissant-salmon', categoryId: 'breakfast', name: 'Круассан с лососем', description: 'Сливочный сыр, лосось и свежий огурец.', price: 430, weight: '210 г', badges: ['премиум'], image: 'croissant', available: true },
      { id: 'tiramisu', categoryId: 'desserts', name: 'Тирамису', description: 'Кофейный десерт с маскарпоне.', price: 320, weight: '150 г', badges: ['к кофе'], image: 'tiramisu', available: true },
    ],
  };
}

function render() {
  const { brand } = state.catalog;
  app.innerHTML = `
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
            <input type="search" placeholder="раф, круассан, чай" value="${escapeAttr(state.query)}" />
          </label>
          <div class="tabs">
            ${categoryButton({ id: 'all', name: 'Все' })}
            ${state.catalog.categories.map(categoryButton).join('')}
          </div>
        </aside>

        <section class="menu-list" aria-live="polite">
          ${filteredItems().map(itemCard).join('') || '<p class="empty">Ничего не нашли. Попробуйте другой запрос.</p>'}
        </section>
      </section>
    </main>

    <footer class="cart-bar">
      <div>
        <strong>${cartCount()} поз.</strong>
        <span>${formatPrice(cartTotal())}</span>
      </div>
      <a class="button button--primary ${cartCount() ? '' : 'is-disabled'}" href="${orderHref()}">Оформить</a>
    </footer>
  `;

  bindEvents();
}

function categoryButton(category) {
  const isActive = state.activeCategory === category.id;
  return `<button class="tab ${isActive ? 'is-active' : ''}" data-category="${category.id}">${category.name}</button>`;
}

function itemCard(item) {
  const qty = state.cart.get(item.id) || 0;
  const colors = imageThemes[item.image] || ['#314f45', '#d7ad6a'];
  return `
    <article class="menu-card">
      <div class="dish-art" style="--c1: ${colors[0]}; --c2: ${colors[1]}">
        <span>${item.name.slice(0, 1)}</span>
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

function filteredItems() {
  const query = state.query.trim().toLowerCase();
  return state.catalog.items.filter((item) => {
    const inCategory = state.activeCategory === 'all' || item.categoryId === state.activeCategory;
    const inQuery = !query || `${item.name} ${item.description}`.toLowerCase().includes(query);
    return inCategory && inQuery && item.available;
  });
}

function bindEvents() {
  document.querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCategory = button.dataset.category;
      render();
    });
  });

  document.querySelector('.search input')?.addEventListener('input', (event) => {
    state.query = event.target.value;
    render();
  });

  document.querySelectorAll('[data-inc]').forEach((button) => {
    button.addEventListener('click', () => updateCart(button.dataset.inc, 1));
  });
  document.querySelectorAll('[data-dec]').forEach((button) => {
    button.addEventListener('click', () => updateCart(button.dataset.dec, -1));
  });
}

function updateCart(id, delta) {
  const qty = Math.max(0, (state.cart.get(id) || 0) + delta);
  if (qty === 0) state.cart.delete(id);
  else state.cart.set(id, qty);
  render();
}

function cartCount() {
  return Array.from(state.cart.values()).reduce((sum, qty) => sum + qty, 0);
}

function cartTotal() {
  return state.catalog.items.reduce((sum, item) => sum + item.price * (state.cart.get(item.id) || 0), 0);
}

function orderHref() {
  if (!cartCount()) return '#menu';
  const lines = state.catalog.items
    .filter((item) => state.cart.has(item.id))
    .map((item) => `${item.name} x ${state.cart.get(item.id)} - ${formatPrice(item.price * state.cart.get(item.id))}`);
  const text = `Здравствуйте! Хочу заказать:\n${lines.join('\n')}\nИтого: ${formatPrice(cartTotal())}`;
  return `https://wa.me/${digits(state.catalog.brand.phone).replace('+', '')}?text=${encodeURIComponent(text)}`;
}

function digits(value) {
  return value.replace(/[^\d+]/g, '');
}

function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

function escapeAttr(value) {
  return value.replaceAll('"', '&quot;');
}

loadCatalog();
