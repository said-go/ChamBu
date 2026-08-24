export class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async menu() {
    return this.request('/menu');
  }

  async login(email, password) {
    return this.rawRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
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
    return this.rawRequest(`${this.baseURL}${path}`, options);
  }

  async rawRequest(url, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = { Accept: 'application/json' };
    if (options.body && !isFormData) headers['Content-Type'] = 'application/json';
    if (options.token) headers.Authorization = `Bearer ${options.token}`;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), options.timeout || 12000);

    let response;
    try {
      response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: isFormData ? options.body : options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch (error) {
      throw new Error(error.name === 'AbortError' ? 'Сервер отвечает слишком долго.' : 'Не удалось связаться с сервером.');
    } finally {
      window.clearTimeout(timeout);
    }

    if (response.status === 204) return null;

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `API ${response.status}`);
    }
    return payload;
  }
}
