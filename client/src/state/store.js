import { fallbackCatalog } from './fallback.js';

export function createStore({ api, onChange }) {
  const state = {
    catalog: fallbackCatalog,
    activeCategory: 'all',
    query: '',
    cart: new Map(),
    adminToken: localStorage.getItem('chambu.jwt') || '',
    notice: '',
    loading: true,
    saving: false,
    deletingId: '',
  };

  const emit = () => onChange();
  const refresh = async () => {
    state.catalog = normalizeCatalog(await api.menu());
    state.loading = false;
    emit();
  };

  return {
    snapshot() {
      return {
        ...state,
        cart: new Map(state.cart),
      };
    },

    async loadCatalog() {
      try {
        await refresh();
      } catch {
        state.catalog = fallbackCatalog;
        state.loading = false;
        state.notice = 'Сервер меню недоступен, показана локальная витрина.';
        emit();
      }
    },

    setCategory(id) {
      state.activeCategory = id;
      emit();
    },

    setQuery(query) {
      state.query = query;
      emit();
    },

    updateCart(id, delta) {
      const qty = Math.max(0, (state.cart.get(id) || 0) + delta);
      if (qty === 0) state.cart.delete(id);
      else state.cart.set(id, qty);
      emit();
    },

    async login({ email, password }) {
      try {
        state.saving = true;
        state.notice = '';
        emit();

        const response = await api.login(email, password);
        state.adminToken = response.token;
        localStorage.setItem('chambu.jwt', response.token);
        state.notice = '';
      } catch (error) {
        state.notice = error.message;
      } finally {
        state.saving = false;
        emit();
      }
    },

    logout() {
      state.adminToken = '';
      localStorage.removeItem('chambu.jwt');
      state.notice = '';
      emit();
    },

    async saveItem(item) {
      try {
        state.saving = true;
        state.notice = '';
        emit();

        await api.saveItem(state.adminToken, item);
        state.notice = 'Позиция сохранена.';
        await refresh();
      } catch (error) {
        state.notice = error.message;
      } finally {
        state.saving = false;
        emit();
      }
    },

    async deleteItem(id) {
      try {
        state.deletingId = id;
        state.notice = '';
        emit();

        await api.deleteItem(state.adminToken, id);
        state.notice = 'Позиция удалена.';
        await refresh();
      } catch (error) {
        state.notice = error.message;
      } finally {
        state.deletingId = '';
        emit();
      }
    },
  };
}

function normalizeCatalog(catalog) {
  return {
    brand: {
      ...fallbackCatalog.brand,
      ...(catalog?.brand || {}),
      highlights: Array.isArray(catalog?.brand?.highlights) ? catalog.brand.highlights : fallbackCatalog.brand.highlights,
    },
    categories: Array.isArray(catalog?.categories) ? catalog.categories : [],
    items: Array.isArray(catalog?.items) ? catalog.items : [],
  };
}
