// Centralized API Client for Sales Savvy frontend

const PRIMARY_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090/api';
const FALLBACK_BASE_URL = '/api';

/**
 * Perform an HTTP request with error handling and automatic token inclusion.
 * Falls back to Vite dev proxy /api if direct backend host is unreachable.
 */
async function request(endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('salesavvy_token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Ensures HTTP-only cookie 'authToken' is forwarded
  };

  const urls = [
    `${PRIMARY_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
    `${FALLBACK_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
  ];

  let lastError = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, config);

      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!response.ok) {
        const error = new Error(
          (data && (data.error || data.message)) ||
          `Request failed with status ${response.status} (${response.statusText})`
        );
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      lastError = err;
      // If the error was a response with status code (like 400, 401, 403, 404, 500),
      // the server was reached, so don't attempt fallback
      if (err.status) {
        throw err;
      }
      // Otherwise, it was a network failure (connection refused / CORS), try fallback url
    }
  }

  throw lastError || new Error('Network error: Unable to connect to backend server');
}

export const apiClient = {
  request,
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: (endpoint, body, options = {}) =>
    request(endpoint, {
      ...options,
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    }),
};

export default apiClient;
