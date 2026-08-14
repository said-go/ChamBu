import { escapeAttr, formatPrice } from '../utils/format.js';

export function renderAdmin(state) {
  return `
    <main class="admin-page">
      <header class="admin-head">
        <button class="admin-link" data-route="menu">Меню</button>
        <div>
          <p class="eyebrow">Админ-панель</p>
          <h1>Управление меню</h1>
        </div>
      </header>

      ${state.notice ? `<p class="notice">${state.notice}</p>` : ''}

      <section class="admin-grid">
        <form class="admin-panel" data-category-form>
          <h2>Категория</h2>
          <input name="id" placeholder="id: coffee" required />
          <input name="name" placeholder="Название" required />
          <textarea name="description" placeholder="Описание"></textarea>
          <button class="button button--primary" type="submit">Сохранить</button>
        </form>

        <form class="admin-panel" data-item-form enctype="multipart/form-data">
          <h2>Позиция</h2>
          <input name="id" placeholder="id: raf-cardamom" required />
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
          <input name="image" placeholder="Тема: coffee, dessert" value="coffee" />
          <label class="fileline">
            <span>Фото блюда</span>
            <input name="imageFile" type="file" accept="image/*" />
          </label>
          <label class="checkline">
            <input name="available" type="checkbox" checked />
            <span>Показывать гостям</span>
          </label>
          <button class="button button--primary" type="submit">Сохранить</button>
        </form>

        <section class="admin-panel admin-token">
          <h2>Доступ</h2>
          <input data-admin-token type="password" placeholder="ADMIN_TOKEN" value="${escapeAttr(state.adminToken)}" />
          <p>Токен хранится только в браузере администратора.</p>
        </section>
      </section>

      <section class="admin-list">
        <h2>Категории</h2>
        ${state.catalog.categories.map(categoryRow).join('')}
      </section>

      <section class="admin-list">
        <h2>Позиции</h2>
        ${state.catalog.items.map(itemRow).join('')}
      </section>
    </main>
  `;
}

function categoryRow(category) {
  return `
    <article class="admin-row">
      <div>
        <strong>${category.name}</strong>
        <span>${category.id}</span>
        <p>${category.description}</p>
      </div>
      <button class="danger-button" data-delete-category="${category.id}">Удалить</button>
    </article>
  `;
}

function itemRow(item) {
  return `
    <article class="admin-row">
      <div>
        <strong>${item.name}</strong>
        <span>${item.categoryId} · ${formatPrice(item.price)} · ${item.weight}</span>
        <p>${item.description}</p>
      </div>
      <button class="danger-button" data-delete-item="${item.id}">Удалить</button>
    </article>
  `;
}
