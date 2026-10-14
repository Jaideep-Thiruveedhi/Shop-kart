# ShopKart — MERN Full-Stack E-Commerce

A production-shaped storefront built across six labs: JWT auth, a searchable product
catalogue, a per-customer wishlist and cart, and a Razorpay-backed checkout with order
history.

**Stack:** React 19 + Vite + Tailwind CSS 4 (frontend) · Express 5 + Mongoose 9 (backend) · MongoDB · Razorpay (test mode)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [API reference](#api-reference)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment)

---

## Features

| Area | What it does |
| --- | --- |
| **Auth** | Register / login / logout, JWT in an `HttpOnly` cookie, session rehydration on refresh, change-password |
| **Catalogue** | Product listing with debounced search, category filter and price sorting; detail page with stock-aware add-to-cart |
| **Wishlist** | Per-customer wishlist stored as `Product` references; add / remove / toggle, heart state synced across pages |
| **Cart** | Quantity edits, live totals, stock clamping, merged with the cart of an already-signed-in customer on sign-in |
| **Checkout + payments** | Shipping address capture, Razorpay order creation, signature verification, success and failure handling |
| **Orders** | Order history with status badges, detail view, and a price **snapshot** so past invoices never change |
| **Bonus** | Conversational register/login UI with an animated robot assistant, mobile-responsive layout |

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 8, Tailwind CSS 4, axios, Oxlint |
| Backend | Node.js, Express 5, Mongoose 9, bcrypt, jsonwebtoken, cookie-parser, cors, dotenv |
| Database | MongoDB (local `mongod` or MongoDB Atlas) |
| Payments | Razorpay (test mode) |

---

## Project structure

```
shop-kart/
├── backend/
│   ├── config/razorpay.js          # Razorpay client + key-presence guard
│   ├── controllers/                # customer, product, wishlist, cart, order
│   ├── middlewares/auth.middleware.js
│   ├── models/                     # customer.model.js, product.model.js, order.model.js
│   ├── routes/                     # /customers /products /wishlist /cart /orders
│   ├── utils/generateToken.js
│   ├── .env.example                # copy to .env — never commit the real .env
│   ├── index.js                    # app + Mongo connect-with-retry + graceful shutdown
│   ├── seed.js                     # sample catalogue
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, ProductCard, CartItem, OrderCard, AuthChat…
│   │   ├── context/                # AuthContext, CartContext
│   │   ├── hooks/                  # useWishlistAction
│   │   ├── lib/                    # format helpers, Razorpay loader, wishlist sync
│   │   ├── pages/                  # Products, ProductDetails, Wishlist, Cart, Checkout, Orders…
│   │   ├── services/api.js         # single axios instance
│   │   ├── App.jsx                 # routes + auth guards
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── package.json                    # root convenience scripts
└── README.md
```

---

## Prerequisites

- **Node.js 20.19+ or 22.12+** (`node -v`) — Vite 8 requires it
- **npm 10+**
- **MongoDB** either:
  - running locally (`mongodb://localhost:27017`), or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster
- Optional: a Razorpay account in **test mode** — only needed to exercise the payment flow

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Jaideep-Thiruveedhi/Shop-kart.git
cd Shop-kart
npm run install:all
```

This installs `backend/` and `frontend/` dependencies in one go. You can also run
`npm install` inside each folder.

### 2. Configure the backend

```bash
cd backend
cp .env.example .env      # macOS / Linux
copy .env.example .env    # Windows CMD
```

Then edit `backend/.env`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/shopkart
JWT_SECRET=<paste-a-long-random-string-here>
NODE_ENV=development
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret_here
```

Generate a real secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> `.env` is listed in `.gitignore` and must never be committed. Only `.env.example`,
> which contains placeholders, is tracked.

**Using MongoDB Atlas instead?** Put the connection string in `MONGO_URI`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/shopkart?retryWrites=true&w=majority
```

### 3. Configure the frontend

```bash
cd frontend
cp .env.example .env      # macOS / Linux
copy .env.example .env    # Windows CMD
```

```env
VITE_API_URL=http://localhost:3000
```

### 4. Seed the catalogue

```bash
npm run seed
```

Inserts 10 sample products. The script is idempotent — it refuses to run if products
already exist, so re-running it cannot duplicate data. To replace the catalogue:

```bash
npm run seed -- --force
```

You can also add products by hand with `POST /products` (see the API reference).

### 5. Run both servers

Two terminals, from the project root:

```bash
npm run dev:backend    # terminal 1 → http://localhost:3000
npm run dev:frontend   # terminal 2 → http://localhost:5173
```

Open **http://localhost:5173** — `/` redirects to `/products`.

The backend waits for MongoDB before it starts listening, so if the database is down
you get step-by-step recovery instructions in the terminal instead of a silent hang.
It retries every 5 seconds, so you can start MongoDB after the fact without
restarting the backend.

---

## Environment variables

### `backend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | no (default `3000`) | Port the Express API listens on |
| `MONGO_URI` | no (defaults to `mongodb://localhost:27017/shopkart`) | MongoDB connection string |
| `JWT_SECRET` | **yes** | Signing secret for session tokens |
| `NODE_ENV` | no (default `development`) | `production` enables `secure` cookies and disables the CORS loopback shortcut |
| `CORS_ORIGINS` | in production | Comma-separated allowed origins, e.g. `https://shopkart.example.com` |
| `RAZORPAY_KEY_ID` | for payments | Razorpay **test** key id |
| `RAZORPAY_KEY_SECRET` | for payments | Razorpay **test** key secret — backend only, never exposed to the browser |

### `frontend/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | no (defaults to `http://localhost:3000`) | Absolute base URL of the API |

> `VITE_API_URL` must stay **absolute**. `/products`, `/cart`, `/wishlist` and `/orders`
> are both API paths and React routes, so a relative base URL or a dev proxy would make
> a page navigation return the backend's JSON instead of the app shell.

---

## Available scripts

Run from the project root:

| Script | Does |
| --- | --- |
| `npm run install:all` | Installs dependencies for `backend/` and `frontend/` |
| `npm run dev:backend` | Starts the API (`node index.js`) |
| `npm run dev:frontend` | Starts Vite with HMR |
| `npm run seed` | Seeds the sample product catalogue |
| `npm run build:frontend` | Production build of the SPA into `frontend/dist` |
| `npm run lint` | Runs Oxlint over the frontend |

Also available inside each sub-package (`cd backend` / `cd frontend`): `npm start`,
`npm run dev`, `npm test`, `npm run build`, `npm run preview`.

---

## API reference

Base URL: `http://localhost:3000`. Routes marked 🔒 require the `token` cookie.

### Customers

| Method | Endpoint | Auth | Body / notes |
| --- | --- | --- | --- |
| `POST` | `/customers/register` | — | `fullName`, `email`, `password` (min 6), `phone` |
| `POST` | `/customers/login` | — | `email`, `password` → sets `token` cookie |
| `GET` | `/customers/me` | 🔒 | Current customer profile (no password) |
| `POST` | `/customers/logout` | 🔒 | Clears the cookie |
| `PATCH` | `/customers/change-password` | 🔒 | `oldPassword`, `newPassword` |

### Products

| Method | Endpoint | Auth | Body / notes |
| --- | --- | --- | --- |
| `POST` | `/products` | — | `name`, `description`, `price`, `category`, `image`, `stock` |
| `GET` | `/products` | — | `?search=` `?category=` `?sort=price_asc\|price_desc` |
| `GET` | `/products/:id` | — | Single product |

```bash
curl -X POST http://localhost:3000/products -H "Content-Type: application/json" \
  -d '{"name":"USB-C Hub","description":"7-in-1 hub","price":1999,"category":"Electronics","image":"https://example.com/hub.jpg","stock":20}'
```

### Wishlist 🔒 · Cart 🔒 · Orders 🔒

| Method | Endpoint | Body / notes |
| --- | --- | --- |
| `POST` | `/wishlist/:productId` | Add to wishlist |
| `GET` | `/wishlist` | Current customer's wishlist |
| `DELETE` | `/wishlist/:productId` | Remove from wishlist |
| `PATCH` | `/wishlist/:productId/toggle` | Toggle membership |
| `POST` | `/cart/:productId` | Add to cart (`quantity` optional, default 1) |
| `GET` | `/cart` | Cart with live product data and total |
| `PATCH` | `/cart/:productId` | `quantity` |
| `DELETE` | `/cart/:productId` | Remove line |
| `POST` | `/orders/create-payment-order` | `items`, `shippingAddress` → Razorpay order |
| `POST` | `/orders/verify-payment` | `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature` |
| `GET` | `/orders` | Current customer's orders |
| `GET` | `/orders/:id` | Order detail |
| `PATCH` | `/orders/:id/status` | Dev/bonus only |

Every protected route takes its owner from the verified JWT — there is deliberately
no `/wishlist/:userId` or `/orders/:userId`, so one customer can never read another's
data by guessing an id.

---

## Security notes

- `.env` files are git-ignored; only placeholder `.env.example` files are tracked.
- Passwords are stored as **bcrypt hashes** (10 salt rounds) and stripped from every response.
- The JWT lives in an `HttpOnly`, `SameSite=Strict` cookie — it is unreachable from JavaScript,
  so XSS cannot steal it. `Secure` is enabled when `NODE_ENV=production`.
- Login returns one generic message whether the email or the password is wrong, so the
  endpoint cannot be used to enumerate accounts.
- `RAZORPAY_KEY_SECRET` is backend-only: it is never sent to the browser and never returned
  by an API. Card details and CVV are never stored — they stay with Razorpay.
- Payment signatures are verified server-side with an HMAC before an order is marked `PAID`.
- Order totals are recalculated on the server from current product prices; the client's
  number is never trusted.

---

## Troubleshooting

**"Network Error" in the console, but the Network tab shows 200.** The backend returned a
perfect response without an `Access-Control-Allow-Origin` header, so the browser refused to
hand it to JavaScript. In development the backend accepts any `localhost`/`127.0.0.1` port
automatically; if you are serving the frontend from another host, add it to `CORS_ORIGINS`
in `backend/.env`.

**`[DB] MongoDB connection failed`.** MongoDB is not running or `MONGO_URI` is wrong.

```bash
sc query MongoDB          # Windows service status
net start MongoDB         # start it
mongosh --eval "db.runCommand({ ping: 1 })"   # verify
```

The backend keeps retrying every 5 seconds and stays up meanwhile.

**Login succeeds but the next request is 401.** The browser only stores the cookie when the
request includes credentials — `services/api.js` sets `withCredentials: true`; keep it.

**Vite prints a port other than 5173.** Port 5173 was busy, so Vite fell back. Nothing to
fix — the CORS policy accepts any loopback port in development.

**Razorpay checkout returns an error.** Check that `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
are **test-mode** keys and are set in `backend/.env`, then restart the backend. The
remaining flows work without Razorpay configured.

---

## Deployment

Deployment is optional, but the pieces are deployment-ready:

1. **Database** — create a free Atlas cluster and set `MONGO_URI` to its connection string.
2. **Backend** — any Node host (Render, Railway, Fly.io). Start command `npm start`,
   root directory `backend`. Set `PORT`, `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`,
   `CORS_ORIGINS=<your frontend origin>` and the Razorpay test keys as environment variables.
3. **Frontend** — any static host (Vercel, Netlify, Cloudflare Pages). Build command
   `npm run build`, output directory `dist`, root directory `frontend`, with `VITE_API_URL`
   set to the deployed backend URL.

> With `NODE_ENV=production` the `token` cookie is set with `Secure`, so the site must be
> served over HTTPS or login will silently fail.
