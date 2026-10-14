# ShopKart — frontend

The React 19 + Vite SPA for ShopKart. Full setup instructions, the API contract and the
environment variable reference live in the [root README](../README.md).

## Quick reference

```bash
cd frontend
npm install
copy .env.example .env    # macOS / Linux: cp .env.example .env
npm run dev               # http://localhost:5173
```

| Script | Does |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built output locally |
| `npm run lint` | Oxlint |

The API base URL comes from `VITE_API_URL` in `frontend/.env` (default
`http://localhost:3000`). It must stay absolute — `/products`, `/cart`, `/wishlist` and
`/orders` are both API paths and React routes, so a relative base URL or a dev proxy
would make a page navigation return JSON instead of the app shell. Cross-origin access
is handled by the backend's CORS policy instead. See `backend/index.js`.
