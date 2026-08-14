import { ApiClient } from './api/client.js';
import { createStore } from './state/store.js';
import { renderAdmin } from './views/admin.js';
import { renderMenu } from './views/menu.js';

const api = new ApiClient('/api');
const store = createStore({
  api,
  onChange: render,
});

const app = document.querySelector('#app');

function render() {
  const route = window.location.hash === '#admin' ? 'admin' : 'menu';
  app.innerHTML = route === 'admin' ? renderAdmin(store.snapshot()) : renderMenu(store.snapshot());
  bindSharedEvents();
  route === 'admin' ? bindAdminEvents() : bindMenuEvents();
}

function bindSharedEvents() {
  document.querySelectorAll('[data-route]').forEach((link) => {
    link.addEventListener('click', () => {
      window.location.hash = link.dataset.route;
      render();
    });
  });
}

function bindMenuEvents() {
  document.querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => store.setCategory(button.dataset.category));
  });

  document.querySelector('[data-search]')?.addEventListener('input', (event) => {
    store.setQuery(event.target.value);
  });

  document.querySelectorAll('[data-inc]').forEach((button) => {
    button.addEventListener('click', () => store.updateCart(button.dataset.inc, 1));
  });

  document.querySelectorAll('[data-dec]').forEach((button) => {
    button.addEventListener('click', () => store.updateCart(button.dataset.dec, -1));
  });
}

function bindAdminEvents() {
  document.querySelector('[data-admin-token]')?.addEventListener('input', (event) => {
    store.setAdminToken(event.target.value);
  });

  document.querySelector('[data-category-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await store.saveCategory(Object.fromEntries(new FormData(event.currentTarget)));
    event.currentTarget.reset();
  });

  document.querySelector('[data-item-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await store.saveItem(new FormData(event.currentTarget));
    event.currentTarget.reset();
  });

  document.querySelectorAll('[data-delete-category]').forEach((button) => {
    button.addEventListener('click', () => store.deleteCategory(button.dataset.deleteCategory));
  });

  document.querySelectorAll('[data-delete-item]').forEach((button) => {
    button.addEventListener('click', () => store.deleteItem(button.dataset.deleteItem));
  });
}

window.addEventListener('hashchange', render);
store.loadCatalog();
