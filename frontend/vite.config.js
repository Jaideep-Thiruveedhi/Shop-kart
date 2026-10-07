import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// NOTE: do NOT proxy /products, /cart, /wishlist or /orders here.
//
// Those paths COLLIDE with the React routes of the same name. A browser
// navigating to http://localhost:5173/products is requesting the PAGE; a proxy
// rule for '/products' would intercept that document request and return the
// backend's JSON instead of index.html, so the SPA would never boot on that
// route. Verified: GET :5199/products returns JSON, not the app shell.
//
// Cross-origin API calls are therefore handled by the backend's cors()
// allow-list instead (backend/index.js), which is why the frontend calls
// http://localhost:3000 directly from services/api.js. Adding the dev port to
// that list is the correct fix; see the notes there.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
