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
  };

  const emit = () => onChange();
  const refresh = async () => {
    state.catalog = await api.menu();
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
        const response = await api.login(email, password);
        state.adminToken = response.token;
        localStorage.setItem('chambu.jwt', response.token);
        state.notice = '';
        emit();
      } catch (error) {
        state.notice = error.message;
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
        await api.saveItem(state.adminToken, item);
        state.notice = 'Позиция сохранена.';
        await refresh();
      } catch (error) {
        state.notice = error.message;
        emit();
      }
    },

    async deleteItem(id) {
      try {
        await api.deleteItem(state.adminToken, id);
        state.notice = 'Позиция удалена.';
        await refresh();
      } catch (error) {
        state.notice = error.message;
        emit();
      }
    },
  };
}
