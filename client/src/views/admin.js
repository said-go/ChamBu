import { formatPrice } from '../utils/format.js';

export function renderAdmin(state) {
  if (!state.adminToken) return renderLogin(state);

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

      ${state.notice ? `<p class="notice admin-notice">${state.notice}</p>` : ''}

      <section class="admin-dashboard">
        <article>
          <span>Категории</span>
          <strong>3</strong>
        </article>
        <article>
          <span>Позиции</span>
          <strong>${state.catalog.items.length}</strong>
        </article>
        <article>
          <span>В витрине</span>
          <strong>${state.catalog.items.filter((item) => item.available).length}</strong>
        </article>
      </section>

      <section class="admin-fixed-cats" aria-label="Фиксированные категории">
        ${state.catalog.categories.map((category) => `<span>${category.name}</span>`).join('')}
      </section>

      <section class="admin-editor">
        <form class="admin-panel admin-panel--editor" data-item-form enctype="multipart/form-data">
          <div class="admin-panel-title">
            <span>Новая позиция</span>
            <strong>Меню</strong>
          </div>
          <input name="id" placeholder="id: pancake-honey" required />
          <select name="categoryId" required>
            ${state.catalog.categories.map((category) => `<option value="${category.id}">${category.name}</option>`).join('')}
          </select>
          <input name="name" placeholder="Название" required />
          <textarea name="description" placeholder="Описание"></textarea>
          <div class="admin-form-row">
            <input name="price" type="number" min="0" placeholder="Цена" required />
            <input name="weight" placeholder="Вес/объем" />
          </div>
          <input name="badges" placeholder="Бейджи через запятую" />
          <input name="image" placeholder="Тема: breakfast, dessert, coffee" value="breakfast" />
          <label class="fileline">
            <span>Фото блюда</span>
            <input name="imageFile" type="file" accept="image/*" />
          </label>
          <label class="checkline">
            <input name="available" type="checkbox" checked />
            <span>Показывать гостям</span>
          </label>
          <button class="button button--primary" type="submit">Сохранить позицию</button>
        </form>
      </section>

      <section class="admin-list admin-list--cards">
        <div class="admin-section-title">
          <span>Витрина</span>
          <strong>Позиции меню</strong>
        </div>
        ${state.catalog.items.map(itemRow).join('')}
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
        ${state.notice ? `<p class="notice admin-login-notice">${state.notice}</p>` : ''}
        <form data-login-form class="admin-login-form">
          <input name="email" type="email" placeholder="admin@chambu.local" autocomplete="username" required />
          <input name="password" type="password" placeholder="Пароль" autocomplete="current-password" required />
          <button class="button button--primary" type="submit">Войти</button>
        </form>
      </section>
    </main>
  `;
}

function itemRow(item) {
  return `
    <article class="admin-dish-row">
      <div class="admin-dish-row__image">${item.name.slice(0, 1)}</div>
      <div>
        <strong>${item.name}</strong>
        <span>${categoryName(item.categoryId)} · ${formatPrice(item.price)} · ${item.weight}</span>
        <p>${item.description}</p>
      </div>
      <button class="danger-button" data-delete-item="${item.id}">Удалить</button>
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
