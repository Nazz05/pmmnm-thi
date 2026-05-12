const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL?.trim();

  if (envUrl) {
    try {
      const parsedUrl = new URL(envUrl);
      const isLocalEnvUrl = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);
      const isBrowserLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

      if (isLocalEnvUrl && !isBrowserLocalhost) {
        console.warn(`[API Service] Ignoring local VITE_API_URL in non-local environment: ${envUrl}`);
      } else {
        return envUrl;
      }
    } catch (error) {
      console.warn(`[API Service] Invalid VITE_API_URL, falling back to hostname detection: ${envUrl}`);
    }
  }

  return (() => {
  if (typeof window === 'undefined') {
    return 'http://localhost:8080/api';
  }

  const hostname = window.location.hostname;
  const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(hostname);

  if (isLocalhost) {
    // Local development
    return 'http://localhost:8080/api';
  }

  // Production - convert domain to api subdomain
  // hnamofficial.id.vn → https://api.hnamofficial.id.vn/api
  // api.hnamofficial.id.vn → https://api.hnamofficial.id.vn/api (already api subdomain)
  const protocol = window.location.protocol;
  
  // Check if hostname already starts with 'api.'
  if (hostname.startsWith('api.')) {
    return `${protocol}//${hostname}/api`;
  }
  
  // Convert main domain to api subdomain
  return `${protocol}//api.${hostname}/api`;
  })();
};

const API_BASE_URL = getApiBaseUrl();

console.log(`[API Service] Base URL: ${API_BASE_URL}`);
console.log(`[API Service] Environment: ${import.meta.env.MODE}`);

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('No token found in localStorage');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');

      if (!response.ok) {
        let errorData = {};
        if (isJson) {
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { message: 'Failed to parse error response' };
          }
        }
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Check if response has content
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      // Parse JSON safely
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse response as JSON:', text.substring(0, 200));
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

const api = new ApiService();
export default api;