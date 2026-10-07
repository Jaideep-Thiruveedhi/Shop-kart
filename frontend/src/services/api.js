import axios from 'axios';

// Single axios instance for every ShopKart API call.
// withCredentials:true is REQUIRED — backend sets JWT in HttpOnly cookie,
// browser only sends/stores it when credentials are included.
// Without this, POST /customers/login succeeds but cookie is dropped,
// so GET /customers/me will always 401.
//
// baseURL must stay ABSOLUTE. It cannot be made relative ("/"):
// /products, /cart, /wishlist and /orders are BOTH API paths and React routes,
// so proxying them would make a page navigation like http://localhost:5173/products
// return the backend's JSON instead of index.html, and the SPA would never boot.
//
// That leaves cross-origin requests, which the browser only allows if the
// backend's cors() origin list contains the frontend's origin — see
// backend/index.js. When it does, axios resolves and the page populates.
// When it does not, the request still reaches the backend and returns 200 in
// the Network tab, but the browser withholds the response body from JS (no
// Access-Control-Allow-Origin), axios rejects with a plain Network Error, and
// the page shows its generic error state. The Network tab looks healthy; the
// UI does not. That mismatch is the symptom to look for.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
