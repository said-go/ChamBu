import { escapeAttr, escapeHTML, formatPrice } from '../utils/format.js';

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

export function renderAdmin(state) {
  if (!state.adminToken) return renderLogin(state);

  const view = adminView();
  return `
    <main class="admin-app">
      ${state.notice ? `<p class="notice admin-floating-notice">${escapeHTML(state.notice)}</p>` : ''}
      ${view === 'newDetails' ? renderNewDishDetails(state) : view === 'new' ? renderNewDishMain(state) : renderOverview(state)}
    </main>
  `;
}

function adminView() {
  if (window.location.hash === '#admin/new/details') return 'newDetails';
  if (window.location.hash === '#admin/new') return 'new';
  return 'overview';
}

function renderOverview(state) {
  const availableCount = state.catalog.items.filter((item) => item.available).length;
  const filtered = filteredItems(state);

  return `
    <section class="admin-phone">
      ${adminHeader({ kicker: 'ЧамБу', title: 'Админ-панель', back: false })}

      <section class="admin-stats" aria-label="Статистика">
        ${statCard('⌘', 'Категории', state.catalog.categories.length)}
        ${statCard('☷', 'Позиции', state.catalog.items.length)}
        ${statCard('◉', 'В витрине', availableCount)}
      </section>

      <button class="admin-add-main" data-route="admin/new" data-new-item type="button">+ Добавить блюдо</button>

      <section class="admin-tabs" aria-label="Категории">
        ${categoryButton({ id: 'all', name: 'Все' }, state.activeCategory)}
        ${state.catalog.categories.map((category) => categoryButton(category, state.activeCategory)).join('')}
      </section>

      ${adminSearch(state.query)}
      ${listControls(state, filtered)}

      <section class="admin-card-list">
        ${filtered.length ? filtered.map((item) => overviewItem(item, state)).join('') : '<p class="empty">Позиции не найдены.</p>'}
      </section>
      <button class="admin-floating-add" data-route="admin/new" data-new-item type="button">+ Добавить</button>
    </section>
  `;
}

function listControls(state, items) {
  const selectedCount = state.adminSelected?.size || 0;

  return `
        <div class="admin-toolbar admin-toolbar--unified">
          <select data-admin-sort aria-label="Сортировка">
            <option value="new" ${state.adminSort === 'new' ? 'selected' : ''}>Сначала новые</option>
            <option value="name" ${state.adminSort === 'name' ? 'selected' : ''}>По названию</option>
            <option value="priceAsc" ${state.adminSort === 'priceAsc' ? 'selected' : ''}>Цена по возрастанию</option>
            <option value="priceDesc" ${state.adminSort === 'priceDesc' ? 'selected' : ''}>Цена по убыванию</option>
          </select>
        </div>

      <div class="admin-list-summary">
        <label class="admin-check">
          <input type="checkbox" aria-label="Выбрать все показанные блюда" data-select-visible ${items.length && items.every((item) => state.adminSelected?.has(item.id)) ? 'checked' : ''} />
          <strong>${items.length} позиций</strong>
        </label>
        ${selectedCount ? `<button class="admin-bulk-delete" data-delete-selected type="button">Удалить (${selectedCount})</button>` : `<span>Выбрано: 0</span>`}
      </div>

  `;
}

function renderNewDishMain(state) {
  const draft = adminDraft();
  const first = draft || state.catalog.items[0] || {};
  const selectedCategory = draft?.categoryId || state.catalog.categories[0]?.id || 'pancakes';

  return `
    <section class="admin-phone admin-phone--form">
      ${adminHeader({ title: draft?.id ? 'Редактировать блюдо' : 'Новое блюдо', subtitle: 'Шаг 1 из 2', back: true })}

      <form class="admin-dish-form" data-admin-step-one enctype="multipart/form-data" novalidate>
        <section class="admin-photo-drop">
          <div class="admin-photo-drop__image" style="${previewStyle(first)}"></div>
          <label>
            <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" />
            <span>▣</span>
            <strong>Добавить фото</strong>
            <small>Рекомендуемое фото 4:3</small>
          </label>
          <small class="admin-field-error admin-photo-error" data-error-for="imageFile"></small>
        </section>

        <label class="admin-field">
          <span>Название блюда</span>
          <input name="name" placeholder="Блин с медом" value="${escapeAttr(draft?.name || '')}" autocomplete="off" required />
          <small class="admin-field-error" data-error-for="name"></small>
        </label>

        <label class="admin-field">
          <span>Категория</span>
          <select name="categoryId" required>
            ${state.catalog.categories.map((category) => `<option value="${escapeAttr(category.id)}" ${category.id === selectedCategory ? 'selected' : ''}>${escapeHTML(category.name)}</option>`).join('')}
          </select>
          <small class="admin-field-error" data-error-for="categoryId"></small>
        </label>

        <label class="admin-field">
          <span>Цена, ₽</span>
          <input name="price" type="number" min="0" placeholder="190" value="${escapeAttr(draft?.price || '')}" required />
          <small class="admin-field-error" data-error-for="price"></small>
        </label>

        <label class="admin-field">
          <span>Краткое описание <em>(необязательно)</em></span>
          <textarea name="description" placeholder="Тонкий румяный блин со сливочным маслом и горным медом.">${escapeHTML(draft?.description || '')}</textarea>
        </label>

        <label class="admin-switch-line">
          <span>Показывать гостям</span>
          <input name="available" type="checkbox" ${draft?.available === false ? '' : 'checked'} />
        </label>

        <button class="admin-save-main" type="submit">Продолжить</button>
      </form>
    </section>
  `;
}

function renderNewDishDetails(state) {
  const draft = adminDraft() || {};
  const first = draft;

  return `
    <section class="admin-phone admin-phone--form">
      ${adminHeader({ title: draft.id ? 'Редактировать блюдо' : 'Новое блюдо', subtitle: 'Шаг 2 из 2', back: true })}

      <form class="admin-dish-form" data-item-form enctype="multipart/form-data" novalidate>
        <div class="admin-form-divider"></div>

        <label class="admin-field">
          <span>Вес / объем <em>(необязательно)</em></span>
          <input name="weight" placeholder="Например: 180 г" value="${escapeAttr(draft?.weight || '')}" />
        </label>

        <label class="admin-field">
          <span>Теги <em>(необязательно)</em></span>
          <input name="badges" placeholder="Например: сладкое, классика" value="${escapeAttr((draft?.badges || []).join(', '))}" />
        </label>

        <details class="admin-extra-settings">
          <summary>Дополнительные настройки</summary>
          <label class="admin-field">
            <span>Технический ID</span>
            <input name="id" placeholder="Заполнится автоматически" value="${escapeAttr(draft?.id || '')}" ${draft.id ? 'readonly' : ''} pattern="[a-z0-9-]+" autocomplete="off" />
          </label>
          <label class="admin-field">
            <span>Тема изображения</span>
            <input name="image" placeholder="Заполнится автоматически" value="${escapeAttr(draft?.image || '')}" />
          </label>
        </details>

        <section class="admin-preview">
          <strong>Предпросмотр</strong>
          ${previewCard(first)}
        </section>

        <button class="admin-save-main" type="submit" ${state.saving ? 'disabled' : ''}>${state.saving ? 'Сохраняем...' : 'Сохранить блюдо'}</button>
        <button class="admin-back-outline" data-route="admin/new" type="button">Назад</button>
      </form>
    </section>
  `;
}

function adminDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem('chambu.adminDraft') || 'null');
    return draft && typeof draft === 'object' ? draft : null;
  } catch {
    return null;
  }
}

function renderLogin(state) {
  return `
    <main class="admin-login-page">
      <section class="admin-login-card">
        <button class="admin-login-back" data-route="menu">← Меню</button>
        <p class="eyebrow">Только для команды</p>
        <h1>Вход в админ-панель</h1>
        <p>Управление позициями меню доступно после авторизации администратора.</p>
        ${state.notice ? `<p class="notice admin-login-notice">${escapeHTML(state.notice)}</p>` : ''}
        <form data-login-form class="admin-login-form">
          <input name="email" type="text" placeholder="Логин" aria-label="Логин" autocomplete="username" autocapitalize="none" spellcheck="false" required />
          <input name="password" type="password" placeholder="Пароль" autocomplete="current-password" required />
          <button class="button button--primary" type="submit" ${state.saving ? 'disabled' : ''}>${state.saving ? 'Проверяем...' : 'Войти'}</button>
        </form>
      </section>
    </main>
  `;
}

function adminHeader({ kicker = '', title, subtitle = '', back }) {
  return `
    <header class="admin-top">
      ${back ? '<button class="admin-icon-button" data-route="admin" aria-label="Назад">←</button>' : `<div class="admin-brand-title"><span>${escapeHTML(kicker)}</span><strong>${escapeHTML(title)}</strong></div>`}
      ${back ? `<div class="admin-centered-title"><strong>${escapeHTML(title)}</strong>${subtitle ? `<span>${escapeHTML(subtitle)}</span>` : ''}</div>` : ''}
      <button class="admin-user-button" data-logout aria-label="Выйти">♙</button>
    </header>
  `;
}

function statCard(icon, label, value, route = '') {
  const tag = route ? 'button' : 'article';
  const routeAttr = route ? ` data-route="${escapeAttr(route)}" type="button"` : '';
  return `
    <${tag} class="admin-stat-card"${routeAttr}>
      <span>${icon}</span>
      <strong>${escapeHTML(label)}</strong>
      <b>${value}</b>
    </${tag}>
  `;
}

function adminSearch(query) {
  return `
    <label class="admin-search">
      <span>⌕</span>
      <input data-search type="search" placeholder="Поиск по меню" value="${escapeAttr(query)}" />
    </label>
  `;
}

function categoryButton(category, activeCategory) {
  const isActive = activeCategory === category.id;
  return `<button class="admin-tab ${isActive ? 'is-active' : ''}" data-category="${escapeAttr(category.id)}" type="button">${escapeHTML(category.name)}</button>`;
}

function overviewItem(item, state) {
  return `
    <article class="admin-menu-card">
      <label class="admin-check">
        <input data-select-item="${escapeAttr(item.id)}" type="checkbox" aria-label="Выбрать ${escapeAttr(item.name)}" ${state.adminSelected?.has(item.id) ? 'checked' : ''} />
      </label>
      ${itemImage(item, 'admin-menu-card__image')}
      <div class="admin-menu-card__text">
        <strong>${escapeHTML(item.name)}</strong>
        <span>${escapeHTML(categoryName(item.categoryId))} · ${formatPrice(item.price)}</span>
        ${statusBadge(item.available)}
      </div>
      <label class="admin-switch">
        <input data-toggle-item="${escapeAttr(item.id)}" aria-label="Показывать ${escapeAttr(item.name)}" type="checkbox" ${item.available ? 'checked' : ''} ${state.saving ? 'disabled' : ''} />
        <span></span>
      </label>
      <div class="admin-item-actions">
        <button class="admin-more" data-item-actions type="button" aria-label="Действия: ${escapeAttr(item.name)}" aria-expanded="false" aria-haspopup="true">⋮</button>
        <div class="admin-action-menu" hidden>
          <button data-edit-item="${escapeAttr(item.id)}" type="button">Редактировать</button>
          <button data-delete-item="${escapeAttr(item.id)}" type="button" ${state.deletingId ? 'disabled' : ''}>Удалить</button>
        </div>
      </div>
    </article>
  `;
}

function previewCard(item) {
  return `
    <article class="admin-preview-card">
      ${itemImage(item, 'admin-preview-card__image')}
      <div>
        <strong>${escapeHTML(item.name || 'Блин с медом')}</strong>
        <span>${escapeHTML(categoryName(item.categoryId || 'pancakes'))} · ${formatPrice(item.price || 190)}</span>
        <p>${escapeHTML(item.description || 'Тонкий румяный блин со сливочным маслом и горным медом.')}</p>
        ${statusBadge(item.available !== false)}
      </div>
    </article>
  `;
}

function itemImage(item, className) {
  const url = dishImage(item);
  const fallback = localDishImages[item.id];
  const background = url ? `background-image: url('${escapeAttr(url)}')${fallback && fallback !== url ? `, url('${escapeAttr(fallback)}')` : ''}` : '';
  return `<div class="${className}" style="${background}">${url ? '' : escapeHTML(item.name || 'Ч').slice(0, 1)}</div>`;
}

function previewStyle(item) {
  const url = item?.imagePreview || dishImage(item);
  return url ? `background-image: linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.44)), url('${escapeAttr(url)}')` : '';
}

function dishImage(item = {}) {
  if (item.imagePreview) return item.imagePreview;
  return safeImageURL(item.imageUrl) || localDishImages[item.id] || '';
}

function statusBadge(available) {
  return `<small class="admin-status ${available ? 'is-public' : 'is-hidden'}">${available ? 'Опубликовано' : 'Скрыто'}</small>`;
}

function filteredItems(state) {
  const query = state.query.trim().toLowerCase();
  const items = state.catalog.items.filter((item) => {
    const categoryMatch = state.activeCategory === 'all' || item.categoryId === state.activeCategory;
    const queryMatch = !query || `${item.name} ${item.description}`.toLowerCase().includes(query);
    return categoryMatch && queryMatch;
  });

  return items.sort((a, b) => {
    if (state.adminSort === 'name') return a.name.localeCompare(b.name, 'ru');
    if (state.adminSort === 'priceAsc') return a.price - b.price;
    if (state.adminSort === 'priceDesc') return b.price - a.price;
    return 0;
  });
}

function categoryName(id) {
  return {
    pancakes: 'Блины',
    breakfast: 'Завтраки',
    drinks: 'Напитки',
  }[id] || id;
}

function safeImageURL(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (url.startsWith('/assets/')) return assetURL(url.slice(1));
  if (url.startsWith('https://')) return url;
  return '';
}

function assetURL(path) {
  return new URL(`../../${path}`, import.meta.url).href;
}
