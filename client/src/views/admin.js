import { escapeAttr, escapeHTML, formatPrice } from '../utils/format.js';

export function renderAdmin(state) {
  if (!state.adminToken) return renderLogin(state);

  const availableCount = state.catalog.items.filter((item) => item.available).length;

  return `
    <main class="admin-page admin-page--workbench">
      <header class="admin-mobile-bar">
        <button class="admin-icon-button" data-route="menu" aria-label="Вернуться в меню">←</button>
        <div>
          <span>ЧамБу</span>
          <strong>Админ-панель</strong>
        </div>
        <button class="admin-icon-button" data-logout aria-label="Выйти">×</button>
      </header>

      ${state.notice ? `<p class="notice admin-notice">${escapeHTML(state.notice)}</p>` : ''}

      <section class="admin-dashboard">
        <article>
          <span>Категории</span>
          <strong>${state.catalog.categories.length}</strong>
        </article>
        <article>
          <span>Позиции</span>
          <strong>${state.catalog.items.length}</strong>
        </article>
        <article>
          <span>В витрине</span>
          <strong>${availableCount}</strong>
        </article>
      </section>

      <section class="admin-fixed-cats" aria-label="Фиксированные категории">
        ${state.catalog.categories.map((category) => `<span>${escapeHTML(category.name)}</span>`).join('')}
      </section>

      <section class="admin-editor">
        <form class="admin-panel admin-panel--editor" data-item-form enctype="multipart/form-data">
          <div class="admin-panel-title">
            <span>Новая позиция</span>
            <strong>Меню</strong>
          </div>
          <input name="id" placeholder="id: pancake-honey" pattern="[a-z0-9-]+" autocomplete="off" required />
          <select name="categoryId" required>
            ${state.catalog.categories.map((category) => `<option value="${escapeAttr(category.id)}">${escapeHTML(category.name)}</option>`).join('')}
          </select>
          <input name="name" placeholder="Название" autocomplete="off" required />
          <textarea name="description" placeholder="Описание"></textarea>
          <div class="admin-form-row">
            <input name="price" type="number" min="0" placeholder="Цена" required />
            <input name="weight" placeholder="Вес/объем" />
          </div>
          <input name="badges" placeholder="Бейджи через запятую" />
          <input name="image" placeholder="Тема: breakfast, dessert, coffee" value="breakfast" />
          <label class="fileline">
            <span>Фото блюда</span>
            <input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" />
          </label>
          <label class="checkline">
            <input name="available" type="checkbox" checked />
            <span>Показывать гостям</span>
          </label>
          <button class="button button--primary" type="submit" ${state.saving ? 'disabled' : ''}>${state.saving ? 'Сохраняем...' : 'Сохранить позицию'}</button>
        </form>
      </section>

      <section class="admin-list admin-list--cards">
        <div class="admin-section-title">
          <span>Витрина</span>
          <strong>Позиции меню</strong>
        </div>
        ${state.catalog.items.length ? state.catalog.items.map((item) => itemRow(item, state.deletingId)).join('') : '<p class="empty">Пока нет позиций меню.</p>'}
      </section>
    </main>
  `;
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
          <input name="email" type="email" placeholder="admin@chambu.local" autocomplete="username" required />
          <input name="password" type="password" placeholder="Пароль" autocomplete="current-password" required />
          <button class="button button--primary" type="submit" ${state.saving ? 'disabled' : ''}>${state.saving ? 'Проверяем...' : 'Войти'}</button>
        </form>
      </section>
    </main>
  `;
}

function itemRow(item, deletingId) {
  const imageUrl = safeImageURL(item.imageUrl);
  const deleting = deletingId === item.id;
  return `
    <article class="admin-dish-row">
      <div class="admin-dish-row__image ${imageUrl ? 'admin-dish-row__image--photo' : ''}" style="${imageUrl ? `background-image: url('${escapeAttr(imageUrl)}')` : ''}">${imageUrl ? '' : escapeHTML(item.name).slice(0, 1)}</div>
      <div>
        <strong>${escapeHTML(item.name)}</strong>
        <span>${escapeHTML(categoryName(item.categoryId))} · ${formatPrice(item.price)}${item.weight ? ` · ${escapeHTML(item.weight)}` : ''}</span>
        <p>${escapeHTML(item.description)}</p>
      </div>
      <button class="danger-button" data-delete-item="${escapeAttr(item.id)}" ${deleting ? 'disabled' : ''}>${deleting ? 'Удаляем...' : 'Удалить'}</button>
    </article>
  `;
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
  if (url.startsWith('https://') || url.startsWith('/assets/')) return url;
  return '';
}
