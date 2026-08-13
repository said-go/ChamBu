export class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async menu() {
    return this.request('/menu');
  }

  async saveCategory(token, category) {
    return this.request('/admin/categories', {
      method: 'POST',
      token,
      body: category,
    });
  }

  async deleteCategory(token, id) {
    return this.request(`/admin/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token,
    });
  }

  async saveItem(token, item) {
    return this.request('/admin/items', {
      method: 'POST',
      token,
      body: item,
    });
  }

  async deleteItem(token, id) {
    return this.request(`/admin/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      token,
    });
  }

  async request(path, options = {}) {
    const headers = { Accept: 'application/json' };
    if (options.body) headers['Content-Type'] = 'application/json';
    if (options.token) headers['X-Admin-Token'] = options.token;

    const response = await fetch(`${this.baseURL}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 204) return null;

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `API ${response.status}`);
    }
    return payload;
  }
}
