/**
 * Frontend API Client
 * 
 * Centralized service for communicating with the Express backend REST endpoints.
 */

const BASE_URL = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {})
    }
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getProfile: () => request('/auth/me')
  },

  // Appointments
  appointments: {
    getMy: () => request('/appointments/my'),
    getAll: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/appointments${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/appointments/${id}`),
    book: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    confirm: (id) => request(`/appointments/${id}/confirm`, { method: 'POST' }),
    cancel: (id, reason) => request(`/appointments/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    reschedule: (id, data) => request(`/appointments/${id}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status, note) => request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note }) }),
    sendUrgentReminder: (id) => request(`/appointments/${id}/remind`, { method: 'POST' })
  },

  // Availability Slots
  availability: {
    getSlots: (date) => request(`/availability${date ? `?date=${date}` : ''}`),
    createSlot: (data) => request('/availability', { method: 'POST', body: JSON.stringify(data) }),
    toggleSlot: (id, isAvailable) => request(`/availability/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ is_available: isAvailable }) })
  },

  // Analytics
  analytics: {
    getDashboard: () => request('/analytics/dashboard'),
    getCustomers: () => request('/analytics/customers')
  },

  // Explainable Risk Engine
  risk: {
    getRules: () => request('/risk/rules'),
    simulate: (params) => request('/risk/simulate', { method: 'POST', body: JSON.stringify(params) }),
    recalculateAll: () => request('/risk/recalculate-all', { method: 'POST' })
  },

  // Feedback & Ratings
  feedback: {
    submit: (data) => request('/feedback', { method: 'POST', body: JSON.stringify(data) }),
    getAll: () => request('/feedback')
  },

  // In-app Notifications
  notifications: {
    getMy: () => request('/notifications')
  },

  // Background Automation
  automation: {
    runCycle: () => request('/automation/run', { method: 'POST' })
  },

  // CloudWatch & System Monitoring
  monitoring: {
    getHealth: () => request('/health'),
    getMetrics: () => request('/metrics'),
    getStream: () => request('/monitoring/stream')
  }
};
