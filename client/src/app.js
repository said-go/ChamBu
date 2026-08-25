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
    });
  });
}

function bindMenuEvents() {
  document.querySelectorAll('[data-open-item]').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('.stepper')) return;
      store.openItem(card.dataset.openItem);
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      store.openItem(card.dataset.openItem);
    });
  });

  document.querySelectorAll('[data-close-item]').forEach((button) => {
    button.addEventListener('click', () => store.closeItem());
  });

  document.querySelector('[data-item-modal]')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) store.closeItem();
  });

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
  document.querySelector('[data-login-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await store.login(Object.fromEntries(new FormData(event.currentTarget)));
  });

  document.querySelector('[data-logout]')?.addEventListener('click', () => {
    store.logout();
  });

  document.querySelector('[data-item-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    prepareMenuItemForm(formData);
    await store.saveItem(formData);
    event.currentTarget.reset();
  });

  document.querySelectorAll('[data-delete-item]').forEach((button) => {
    button.addEventListener('click', () => store.deleteItem(button.dataset.deleteItem));
  });
}

window.addEventListener('hashchange', render);
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') store.closeItem();
});
render();
store.loadCatalog();

function prepareMenuItemForm(formData) {
  const name = String(formData.get('name') || '');
  const category = String(formData.get('categoryId') || '');

  if (!formData.get('id')) {
    formData.set('id', `${slugify(name)}-${Date.now().toString(36)}`);
  }

  if (!formData.get('image')) {
    formData.set('image', categoryImage(category));
  }
}

function categoryImage(category) {
  return {
    pancakes: 'pancake-folded',
    breakfast: 'breakfast',
    drinks: 'coffee',
  }[category] || 'breakfast';
}

function slugify(value) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  const slug = value
    .trim()
    .toLowerCase()
    .split('')
    .map((char) => map[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'item';
}
