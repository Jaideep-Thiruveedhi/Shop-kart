import axios from 'axios';

// Single axios instance for all ShopKart auth calls.
// withCredentials:true is REQUIRED — backend sets JWT in HttpOnly cookie,
// browser only sends/stores it when credentials are included.
// Without this, POST /customers/login succeeds but cookie is dropped,
// so GET /customers/me will always 401.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
