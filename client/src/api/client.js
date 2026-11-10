export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export async function apiClient(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    ...options.headers,
  };

  // Add CSRF protection header on state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-Requested-With'] = 'XMLHttpRequest';
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include httpOnly cookies
  });

  const contentType = response.headers.get('content-type');
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || (typeof data === 'string' ? data : 'API Request failed');
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
