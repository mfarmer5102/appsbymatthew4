import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:2021/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add authorization header from localStorage
    const adminCode = localStorage.getItem('APPSBYMATTHEW_ADMIN_CODE');
    if (adminCode) {
      config.headers.Authorization = adminCode;
    }
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response received from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method
    });
    return Promise.reject(error);
  }
);

// Applications API
export const applicationsAPI = {
  getAll: (params = {}) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (data) => api.put('/applications', data),
  patch: (data) => api.patch('/applications', data),
  delete: (data) => api.delete('/applications', { data }),
};

// Skills API
export const skillsAPI = {
  getAll: (params = {}) => api.get('/skills', { params }),
  getById: (id) => api.get(`/skills/${id}`),
  create: (data) => api.post('/skills', data),
  update: (data) => api.put('/skills', data),
  patch: (data) => api.patch('/skills', data),
  delete: (data) => api.delete('/skills', { data }),
};

// Skill Types API
export const skillTypesAPI = {
  getAll: (params = {}) => api.get('/skill-types', { params }),
  getById: (id) => api.get(`/skill-types/${id}`),
  create: (data) => api.post('/skill-types', data),
  update: (data) => api.put('/skill-types', data),
  patch: (data) => api.patch('/skill-types', data),
  delete: (data) => api.delete('/skill-types', { data }),
};

// Support Status API
export const supportStatusAPI = {
  getAll: (params = {}) => api.get('/support-status', { params }),
  getById: (id) => api.get(`/support-status/${id}`),
  create: (data) => api.post('/support-status', data),
  update: (data) => api.put('/support-status', data),
  patch: (data) => api.patch('/support-status', data),
  delete: (data) => api.delete('/support-status', { data }),
};

export default api;
