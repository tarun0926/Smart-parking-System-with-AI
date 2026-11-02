import axios from 'axios';

// API Client service configured for SmartPark AI
// Use relative path so Vite dev proxy forwards to backend (no CORS issues)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 8000,
});

// Request interceptor to attach JWT auth tokens automatically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartpark_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error responses
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || 'Network error or backend service unreachable.',
      status: error.response?.status || 500,
    };
    return Promise.reject(customError);
  }
);

// Modular API endpoints
export const ParkingAPI = {
  getAll: (params) => apiClient.get('/parking', { params }),
  getById: (id) => apiClient.get(`/parking/${id}`),
  getSlots: (id) => apiClient.get(`/parking/${id}/slots`),
  getNearby: (lat, lng, maxKm = 10) =>
    apiClient.get('/parking/nearby', { params: { lat, lng, maxKm } }),
  getPrediction: (id) => apiClient.get(`/parking/${id}/prediction`),
  getRecommendation: (params) => apiClient.get('/parking/recommend', { params }),
  create: (data) => apiClient.post('/parking', data),
  update: (id, data) => apiClient.put(`/parking/${id}`, data),
  delete: (id) => apiClient.delete(`/parking/${id}`),
  updateSlot: (parkingId, slotId, status) =>
    apiClient.put(`/parking/${parkingId}/slots/${slotId}`, { status }),
  addSlot: (parkingId, data) => apiClient.post(`/parking/${parkingId}/slots`, data),
};

export const BookingAPI = {
  create: (data) => apiClient.post('/bookings', data),
  getMyBookings: () => apiClient.get('/bookings/my'),
  getAllBookings: () => apiClient.get('/bookings'),
  getOwnerBookings: () => apiClient.get('/bookings/owner'),
  getById: (id) => apiClient.get(`/bookings/${id}`),
  cancel: (id) => apiClient.put(`/bookings/${id}/cancel`),
};

export const UserAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  getAllUsers: () => apiClient.get('/users'),
  updateStatus: (id, data) => apiClient.put(`/users/${id}/status`, data),
  deleteUser: (id) => apiClient.delete(`/users/${id}`),
};

export const AnalyticsAPI = {
  getAdmin: () => apiClient.get('/analytics/admin'),
  getOwner: () => apiClient.get('/analytics/owner'),
};

export const AuthAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
};

export default apiClient;


