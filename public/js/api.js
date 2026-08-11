export const api = {
  async request(path, options = {}) {
    try {
      const res = await fetch(`/api${path}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      const data = await res.json();
      return { success: res.ok, data, error: res.ok ? null : data.error || 'Request failed' };
    } catch (e) {
      return { success: false, data: null, error: 'Network error. Please try again.' };
    }
  },
  async get(path) {
    return this.request(path);
  },
  async post(path, body) {
    return this.request(path, { method: 'POST', body: JSON.stringify(body) });
  },
  async put(path, body) {
    return this.request(path, { method: 'PUT', body: JSON.stringify(body) });
  },
  async delete(path) {
    return this.request(path, { method: 'DELETE' });
  }
};
