import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5011/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 Making ${config.method?.toUpperCase()} request to ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
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
    console.error('❌ API Error:', error.response?.data || error.message);
    console.error('❌ Error details:', {
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
  update: (id, data) => api.put(`/applications/${id}`, data),
  patch: (id, data) => api.patch(`/applications/${id}`, data),
  delete: (id) => api.delete(`/applications/${id}`),
};

// Skills API
export const skillsAPI = {
  getAll: (params = {}) => api.get('/skills', { params }),
  getById: (id) => api.get(`/skills/${id}`),
  create: (data) => api.post('/skills', data),
  update: (id, data) => api.put(`/skills/${id}`, data),
  patch: (id, data) => api.patch(`/skills/${id}`, data),
  delete: (id) => api.delete(`/skills/${id}`),
};

// Skill Types API
export const skillTypesAPI = {
  getAll: (params = {}) => api.get('/skill-types', { params }),
  getById: (id) => api.get(`/skill-types/${id}`),
  create: (data) => api.post('/skill-types', data),
  update: (id, data) => api.put(`/skill-types/${id}`, data),
  patch: (id, data) => api.patch(`/skill-types/${id}`, data),
  delete: (id) => api.delete(`/skill-types/${id}`),
};

// Support Status API
export const supportStatusAPI = {
  getAll: (params = {}) => api.get('/support-status', { params }),
  getById: (id) => api.get(`/support-status/${id}`),
  create: (data) => api.post('/support-status', data),
  update: (id, data) => api.put(`/support-status/${id}`, data),
  patch: (id, data) => api.patch(`/support-status/${id}`, data),
  delete: (id) => api.delete(`/support-status/${id}`),
};

export default api;
