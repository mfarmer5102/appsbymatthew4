import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

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
  getAll: (params = {}) => api.get('/skilltypes', { params }),
  getById: (id) => api.get(`/skilltypes/${id}`),
  create: (data) => api.post('/skilltypes', data),
  update: (id, data) => api.put(`/skilltypes/${id}`, data),
  patch: (id, data) => api.patch(`/skilltypes/${id}`, data),
  delete: (id) => api.delete(`/skilltypes/${id}`),
};

// Support Status API
export const supportStatusAPI = {
  getAll: (params = {}) => api.get('/supportstatus', { params }),
  getById: (id) => api.get(`/supportstatus/${id}`),
  create: (data) => api.post('/supportstatus', data),
  update: (id, data) => api.put(`/supportstatus/${id}`, data),
  patch: (id, data) => api.patch(`/supportstatus/${id}`, data),
  delete: (id) => api.delete(`/supportstatus/${id}`),
};

// Traffic API
export const trafficAPI = {
  trackPage: (data) => api.post('/traffic/track-page', data),
  getAnalytics: () => api.get('/traffic/analytics'),
  getRecent: (params = {}) => api.get('/traffic/recent', { params }),
  getByIp: (ipAddress) => api.get(`/traffic/ip/${ipAddress}`),
};

export default api;
