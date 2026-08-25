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
let adminDraftFile = null;

function render() {
  const route = window.location.hash.startsWith('#admin') ? 'admin' : 'menu';
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
    sessionStorage.removeItem('chambu.adminDraft');
    adminDraftFile = null;
    store.logout();
  });

  document.querySelector('[data-admin-step-one]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    clearFieldErrors(form);

    const formData = new FormData(form);
    const errors = validateMenuMain(formData);
    if (Object.keys(errors).length) {
      showFieldErrors(form, errors);
      return;
    }

    const file = form.elements.imageFile?.files?.[0];
    if (file) {
      const fileError = validateImageFile(file);
      if (fileError) {
        showFieldErrors(form, { imageFile: fileError });
        return;
      }
      adminDraftFile = file;
      formData.set('imagePreview', await fileToDataURL(file));
    }

    if (!form.elements.available?.checked) {
      formData.set('available', 'false');
    }
    saveAdminDraft(formData);
    window.location.hash = 'admin/new/details';
  });

  document.querySelector('[name="imageFile"]')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const form = event.target.closest('form');
    clearFieldErrors(form);
    const fileError = validateImageFile(file);
    if (fileError) {
      showFieldErrors(form, { imageFile: fileError });
      event.target.value = '';
      adminDraftFile = null;
      return;
    }

    adminDraftFile = file;
    const preview = await fileToDataURL(file);
    const previewNode = document.querySelector('.admin-photo-drop__image');
    if (previewNode) {
      previewNode.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.44)), url("${preview}")`;
    }
  });

  document.querySelector('[data-item-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton?.disabled) return;

    clearFieldErrors(form);
    const formData = mergeAdminDraft(new FormData(form));
    const errors = validateMenuSubmit(formData);
    if (Object.keys(errors).length) {
      showFieldErrors(form, errors);
      return;
    }
    if (adminDraftFile) formData.set('imageFile', adminDraftFile);

    prepareMenuItemForm(formData);
    submitButton.disabled = true;
    await store.saveItem(formData);
    sessionStorage.removeItem('chambu.adminDraft');
    adminDraftFile = null;
    event.currentTarget.reset();
    window.location.hash = 'admin';
  });

  document.querySelectorAll('[data-new-item]').forEach((button) => {
    button.addEventListener('click', () => {
      sessionStorage.removeItem('chambu.adminDraft');
    });
  });

  document.querySelector('[data-search]')?.addEventListener('input', (event) => {
    store.setQuery(event.target.value);
  });

  document.querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => store.setCategory(button.dataset.category));
  });

  document.querySelector('[data-admin-sort]')?.addEventListener('change', (event) => {
    store.setAdminSort(event.target.value);
  });

  document.querySelectorAll('[data-select-item]').forEach((input) => {
    input.addEventListener('change', () => store.toggleAdminSelection(input.dataset.selectItem));
  });

  document.querySelector('[data-select-visible]')?.addEventListener('change', (event) => {
    const selected = [...document.querySelectorAll('[data-select-item]')].filter((input) => input.checked);
    if (event.target.checked) {
      document.querySelectorAll('[data-select-item]').forEach((input) => {
        if (!input.checked) store.toggleAdminSelection(input.dataset.selectItem);
      });
      return;
    }
    selected.forEach((input) => store.toggleAdminSelection(input.dataset.selectItem));
  });

  document.querySelector('[data-delete-selected]')?.addEventListener('click', async () => {
    const ids = [...store.snapshot().adminSelected];
    if (!ids.length) return;
    if (!window.confirm(`Удалить выбранные позиции (${ids.length})? Это действие нельзя отменить.`)) return;
    for (const id of ids) {
      await store.deleteItem(id);
    }
    store.clearAdminSelection();
  });

  document.querySelectorAll('[data-toggle-item]').forEach((input) => {
    input.addEventListener('change', async () => {
      const item = store.snapshot().catalog.items.find((entry) => entry.id === input.dataset.toggleItem);
      if (!item) return;
      await store.saveItem(menuItemFormData({ ...item, available: input.checked }));
    });
  });

  document.querySelectorAll('[data-edit-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = store.snapshot().catalog.items.find((entry) => entry.id === button.dataset.editItem);
      if (item) sessionStorage.setItem('chambu.adminDraft', JSON.stringify(item));
      window.location.hash = 'admin/new';
    });
  });

  document.querySelectorAll('[data-delete-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const item = store.snapshot().catalog.items.find((entry) => entry.id === button.dataset.deleteItem);
      const name = item?.name || 'позицию';
      if (window.confirm(`Удалить ${name}? Это действие нельзя отменить.`)) {
        store.deleteItem(button.dataset.deleteItem);
      }
    });
  });
}

window.addEventListener('beforeunload', (event) => {
  if (!sessionStorage.getItem('chambu.adminDraft')) return;
  event.preventDefault();
  event.returnValue = '';
});

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

function saveAdminDraft(formData) {
  const draft = {
    id: String(formData.get('id') || ''),
    categoryId: String(formData.get('categoryId') || ''),
    name: String(formData.get('name') || ''),
    description: String(formData.get('description') || ''),
    price: Number(formData.get('price') || 0),
    weight: String(formData.get('weight') || ''),
    badges: parseBadges(String(formData.get('badges') || '')),
    image: String(formData.get('image') || ''),
    imagePreview: String(formData.get('imagePreview') || ''),
    available: formData.get('available') !== 'false',
  };
  sessionStorage.setItem('chambu.adminDraft', JSON.stringify(draft));
}

function mergeAdminDraft(details) {
  const formData = new FormData();
  let draft = {};
  try {
    draft = JSON.parse(sessionStorage.getItem('chambu.adminDraft') || '{}');
  } catch {
    draft = {};
  }

  for (const [key, value] of Object.entries(draft)) {
    if (key !== 'imagePreview') formData.set(key, Array.isArray(value) ? value.join(', ') : value);
  }
  for (const [key, value] of details.entries()) {
    if (value !== '') formData.set(key, value);
  }
  return formData;
}

function validateMenuMain(formData) {
  const errors = {};
  if (!String(formData.get('name') || '').trim()) errors.name = 'Введите название блюда.';
  if (!String(formData.get('categoryId') || '').trim()) errors.categoryId = 'Выберите категорию.';
  if (!validPrice(formData.get('price'))) errors.price = 'Введите цену больше 0.';
  return errors;
}

function validateMenuSubmit(formData) {
  return validateMenuMain(formData);
}

function validPrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0;
}

function validateImageFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) return 'Загрузите JPG, PNG или WebP.';
  if (file.size > 8 * 1024 * 1024) return 'Фото должно быть меньше 8 МБ.';
  return '';
}

function showFieldErrors(form, errors) {
  Object.entries(errors).forEach(([name, message]) => {
    const target = form.querySelector(`[data-error-for="${name}"]`);
    if (target) target.textContent = message;
    const input = form.elements[name];
    input?.setAttribute?.('aria-invalid', 'true');
  });
}

function clearFieldErrors(form) {
  if (!form) return;
  form.querySelectorAll('.admin-field-error').forEach((error) => {
    error.textContent = '';
  });
  form.querySelectorAll('[aria-invalid="true"]').forEach((input) => {
    input.removeAttribute('aria-invalid');
  });
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')));
    reader.addEventListener('error', () => reject(new Error('Не удалось прочитать фото.')));
    reader.readAsDataURL(file);
  });
}

function menuItemFormData(item) {
  const formData = new FormData();
  formData.set('id', item.id);
  formData.set('categoryId', item.categoryId);
  formData.set('name', item.name);
  formData.set('description', item.description || '');
  formData.set('price', item.price);
  formData.set('weight', item.weight || '');
  formData.set('badges', (item.badges || []).join(', '));
  formData.set('image', item.image || categoryImage(item.categoryId));
  if (item.imageUrl) formData.set('imageUrl', item.imageUrl);
  formData.set('available', item.available ? 'true' : 'false');
  return formData;
}

function parseBadges(value) {
  return value
    .split(',')
    .map((badge) => badge.trim())
    .filter(Boolean);
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
