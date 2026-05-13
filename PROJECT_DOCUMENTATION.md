# AIMirror — Project documentation (for developers and AI agents)

This document describes the **aimirror** monorepo: a clothing storefront with an **AI virtual try-on** flow, a **Node/Express/MongoDB** API, and integrations with **Hugging Face**, optional **WhatsApp** delivery, and **email**.

---

## 1. What this project is

- **client-store** — Public e-commerce-style UI: home, product listing with filters, product detail, and an **admin** area for managing products (JWT-protected).
- **client-tryon** — Standalone **try-on wizard**: welcome → pick product (manual) or event type (auto) → camera/upload → server-side generation → result with optional WhatsApp/email share.
- **server** — REST API, MongoDB persistence, file uploads under `server/uploads/`, and orchestration of virtual try-on via **Hugging Face Spaces** (`@gradio/client`) plus optional **Hugging Face Inference** for auto product suggestion.

**Naming note:** `server/services/geminiService.js` implements **Hugging Face** try-on and text inference, not Google Gemini/Vertex AI. The npm package `@google-cloud/vertexai` is listed in `server/package.json` but is **not referenced** in the current server code paths.

---

## 2. Tech stack

| Layer | Technologies |
|--------|----------------|
| Store & Try-on UIs | React 19, Vite 8, Axios, CSS Modules |
| Store routing | `react-router-dom` 7 |
| Server | Express 4, Mongoose 8, Multer, JWT (`jsonwebtoken`), bcryptjs, dotenv, cors |
| DB | MongoDB (via `MONGO_URI`) |
| Try-on image generation | Hugging Face Space + `@gradio/client` (default space: `yisol/IDM-VTON`) |
| Auto product pick (text) | Hugging Face Inference API (router) |
| Outbound messaging | Twilio WhatsApp API **or** Meta Graph WhatsApp (`WHATSAPP_PROVIDER`) |
| Email | Nodemailer (SMTP) |
| Root orchestration | `concurrently` to run all three apps |

---

## 3. Repository layout (high level)

```
aimirror/
├── package.json              # Root scripts: dev (all), dev:server, dev:store, dev:tryon, seed
├── client-store/             # Vite React app, port 5173
├── client-tryon/             # Vite React app, port 5174
├── server/                   # Express API, default port 5000
├── DESIGN_REDESIGN_TASK.md   # Design/task notes (human-oriented)
├── tasks.js                  # Unrelated docx generation script (uses `docx` — not a runtime dep of server)
└── PROJECT_DOCUMENTATION.md  # This file
```

**Generated or local-only artifacts (do not treat as source of truth):**

- `client-*/dist/` — production build output.
- `server/uploads/` — uploaded product images, session user photos, generated results; may contain sample images from seeding or dev runs.
- `node_modules/` — dependencies.

---

## 4. How to run

From the repo root (`aimirror/`):

| Command | Effect |
|---------|--------|
| `npm install` | Install root `concurrently` (run `npm install` inside `client-store`, `client-tryon`, and `server` as needed). |
| `npm run dev` | Runs server + both clients concurrently. |
| `npm run dev:server` | API only. |
| `npm run dev:store` | Store only (port 5173). |
| `npm run dev:tryon` | Try-on only (port 5174). |
| `npm run seed` | Runs `server/seeders/seed.js` (wipes and repopulates products; uses files under `server/uploads/products/`). |

**Prerequisites:** MongoDB reachable at `MONGO_URI`. Configure `server/.env` from `server/.env.example`. Configure each client’s `.env` from its `.env.example`.

**Vite dev proxies:** Both clients proxy `/api` and `/uploads` to `http://localhost:5000`, so relative URLs work during development.

---

## 5. Environment variables

### 5.1 Server (`server/.env`)

See `server/.env.example` for the canonical list. Summary:

| Variable | Purpose |
|----------|---------|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Signing key for admin JWTs |
| `PORT` | API port (default 5000) |
| `CLIENT_STORE_URL`, `CLIENT_TRYON_URL` | CORS allowlist origins (if unset, CORS allows all) |
| `PUBLIC_BASE_URL` | Public origin used to build absolute URLs for WhatsApp media (e.g. `http://localhost:5000`); **must** be reachable by Twilio/Meta when sending images |
| `HF_API_TOKEN` | Hugging Face token (required for Space client with token; required for Inference API product suggestion) |
| `HF_SPACE_ID` | Hugging Face Space id (default `yisol/IDM-VTON`) |
| `HF_SPACE_API_NAME` | Gradio API name (default `/tryon`) |
| `HF_INFERENCE_BASE_URL` | Optional; default `https://router.huggingface.co/hf-inference/models` |
| `HF_TRYON_MODEL` | Model id for **text** inference (product id suggestion) |
| `HF_TEXT_MODEL` | Optional override; falls back to `HF_TRYON_MODEL` |
| `TRYON_FALLBACK_COPY_USER_IMAGE` | If `true`, on HF failure copies user photo to result path for local testing |
| **SMTP** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) | Nodemailer for `/send-email` |
| **Twilio WhatsApp** (`TWILIO_*`) | When `WHATSAPP_PROVIDER=twilio` |
| **Meta WhatsApp** (`WHATSAPP_API_URL`, `WHATSAPP_API_TOKEN`) | When provider is not twilio |

### 5.2 client-store (`.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL (default `http://localhost:5000`) |
| `VITE_TRYON_TOOL_URL` | Link target for “Launch Try-On Tool” (default `http://localhost:5174`) |

### 5.3 client-tryon (`.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API base URL |
| `VITE_STORE_URL` | Available for linking back to the store (check screens if used) |

---

## 6. REST API reference

Base path: **`/api`**. JSON bodies unless multipart is noted.

### 6.1 Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/login` | No | Body: `{ username, password }` → `{ token }` (JWT, 24h) |
| POST | `/register-first-admin` | No | Bootstraps first admin only if collection empty; `{ username, password }` |
| GET | `/me` | Bearer JWT | Returns `{ username, role }` |

### 6.2 Products — `/api/products`

**Route order matters in Express:** specific paths like `/categories` and `/admin/all` are registered before `/:id`.

**Public**

| Method | Path | Query / body | Response notes |
|--------|------|--------------|----------------|
| GET | `/` | `category`, `categories` (comma-separated), `gender`, `minPrice`, `maxPrice`, `featured=true`, `search`, `page`, `limit` | Paginated `{ products, total, page, totalPages }`; only `isActive: true` |
| GET | `/categories` | — | Array of `{ category, count }` for each enum category |
| GET | `/:id` | — | Single product; 404 if missing or inactive |

**Admin (Bearer JWT)**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/all` | Query: `search`, `page`, `limit`; all products for admin grid |
| GET | `/admin/product/:id` | Single product by id (including inactive) |
| POST | `/` | Multipart: field `images` (files), `data` (JSON string). Creates product; each color variant needs a file |
| PUT | `/:id` | Multipart optional; `data` may include `replaceIndices` for image swaps |
| DELETE | `/:id` | Soft delete: `isActive: false` |
| PATCH | `/:id/toggle-featured` | Toggles `isFeatured` |
| PATCH | `/:id/reactivate` | Sets `isActive: true` |

**Static files:** Product image paths are stored as `/uploads/products/...` and served by Express from `server/uploads`.

### 6.3 Try-on — `/api/tryon`

| Method | Path | Body / multipart | Description |
|--------|------|------------------|-------------|
| POST | `/start` | Multipart field `photo` | Creates `TryOnSession`, saves user image as `/uploads/sessions/{sessionId}-user.{ext}` → `{ sessionId }` |
| POST | `/:sessionId/generate` | JSON: `productId`, optional `colorVariantIndex`, optional `mode` (`manual` default) | Runs virtual try-on; returns `{ imageUrl, source, details }` |
| POST | `/:sessionId/auto-generate` | JSON: `eventType` in `wedding`, `casual`, `office`, `party`, `formal` | Picks product (HF text model or fallback), then generates |
| POST | `/:sessionId/send-whatsapp` | JSON: `phoneNumber` | Sends result image via Twilio or Meta (needs `PUBLIC_BASE_URL` for media URL) |
| POST | `/:sessionId/send-email` | JSON: `email` | SMTP send with image attachment |
| DELETE | `/:sessionId` | — | Deletes session files and DB doc |

**Session expiry:** `TryOnSession` uses Mongoose TTL on `createdAt` (**3600 seconds**): documents expire automatically.

---

## 7. External tools and APIs (what the server actually calls)

### 7.1 Virtual try-on (images)

- **Implementation:** `server/services/geminiService.js` → `generateTryOnImage(sessionId, userImagePath, productImagePath)`.
- **Mechanism:** Dynamic `import('@gradio/client')`, `client(HF_SPACE_ID, { hf_token })`, then `app.predict(HF_SPACE_API_NAME, [...])` with person image, garment image, prompt, and numeric flags.
- **Result:** Downloads output image from returned URL, writes `server/uploads/sessions/{sessionId}-result.jpg`, returns path as `imageUrl`.
- **Failure modes:** Mapped to HTTP-style errors; optional fallback copy of user image if `TRYON_FALLBACK_COPY_USER_IMAGE=true`.

### 7.2 Auto product suggestion (text)

- **Implementation:** `suggestProductIdForEvent(eventType, productSummaries)` in the same service.
- **Mechanism:** POST to `{HF_INFERENCE_BASE_URL}/{HF_TEXT_MODEL || HF_TRYON_MODEL}` with Bearer `HF_API_TOKEN`, `inputs` = prompt listing JSON summaries; parses Mongo ObjectId from response.
- **Fallback:** If parsing fails, chooses lexicographically first product id.

### 7.3 WhatsApp

- **Implementation:** `server/services/whatsappService.js`.
- **Twilio:** `POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json` with `MediaUrl` pointing at `PUBLIC_BASE_URL + imagePath`.
- **Meta:** POST to `WHATSAPP_API_URL` with JSON body (`messaging_product`, `to`, `type: image`, `image.link`).

### 7.4 Email

- **Implementation:** `server/services/emailService.js` — Nodemailer SMTP, attaches result JPEG.

---

## 8. Data models (Mongoose)

### 8.1 `AdminUser` — `server/models/AdminUser.js`

- `username` (unique), `password` (bcrypt hashed on save), `role`, `createdAt`.

### 8.2 `Product` — `server/models/Product.js`

- `name`, `category` (enum `CATEGORY_ENUM`: jacket, tshirt, trousers, dress, shirt, jeans, blouse, coat, skirt, suit, hoodie, shorts, abaya, kaftan, other), `gender` (`men` | `women` | `unisex`), `description`, `price`, `currency` (default `EGP`), `images[]` (`color`, `hex`, `imagePath`), `sizes[]` (`size`, `stock`), `tags[]`, `isFeatured`, `isActive`, `createdAt`.
- Indexes: `{ category, isActive }`, text index on `name`, `tags`, `description`.

### 8.3 `TryOnSession` — `server/models/TryOnSession.js`

- `sessionId` (unique string), `userPhoto`, `selectedProductId`, `selectedVariant`, `generatedImagePath`, `mode` (`manual` | `auto`), `autocategory`, `status` (`pending` | `processing` | `done` | `error`), `whatsappNumber`, `email`, `createdAt` with **TTL 3600s**.

---

## 9. Server file map

| File | Role |
|------|------|
| `server.js` | Express app, CORS, JSON limit 12mb, static `/uploads`, mounts routes, global error handler |
| `config/db.js` | `mongoose.connect(MONGO_URI)` |
| `middleware/auth.js` | JWT Bearer verification; sets `req.admin` |
| `middleware/upload.js` | Multer: product images → `uploads/products`; user photo → `uploads/sessions/{sessionId}-user...` |
| `routes/auth.js` | Login, first-admin register, `/me` |
| `routes/products.js` | Public + admin product CRUD and filters |
| `routes/tryon.js` | Session lifecycle, generate, WhatsApp, email, delete |
| `services/geminiService.js` | Hugging Face Space try-on + HF Inference product suggestion |
| `services/whatsappService.js` | Twilio or Meta WhatsApp image send |
| `services/emailService.js` | SMTP send with attachment |
| `seeders/seed.js` | Dev/demo product seed |

---

## 10. client-store — routes, API helpers, components, pages

### 10.1 Entry and routing

- `src/main.jsx` — React root.
- `src/App.jsx` — `BrowserRouter` routes:
  - `/` → `HomePage`
  - `/products` → `ProductsPage`
  - `/products/:id` → `ProductDetailPage`
  - `/admin/login` → `AdminLoginPage`
  - `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit` → wrapped in `ProtectedRoute`

### 10.2 API modules (`src/api/`)

| File | Role |
|------|------|
| `axios.js` | Shared Axios instance, `VITE_API_URL`, attaches `adminToken`, 401 → redirect to login |
| `auth.js` | Admin auth API calls |
| `products.js` | Product CRUD/list calls |

### 10.3 Components (`src/components/`)

| Component | Role |
|-----------|------|
| `ProtectedRoute` | Requires `localStorage.adminToken`; redirects to `/admin/login` |
| `Navbar` | Site navigation |
| `Footer` | Footer |
| `FilterSidebar` | Category/price/gender filters for listing |
| `ProductGrid` | Grid layout for cards |
| `ProductCard` | Single product card |
| `SizeTag` | Size / stock display |
| `LoadingSpinner` | Loading UI |
| `TryOnBanner` | CTA linking to `VITE_TRYON_TOOL_URL` |

### 10.4 Pages (`src/pages/`)

| Page | Role |
|------|------|
| `Home/HomePage` | Landing |
| `Products/ProductsPage` | Catalog with filters |
| `ProductDetail/ProductDetailPage` | Detail view |
| `Admin/AdminLoginPage` | Admin login |
| `Admin/AdminDashboard` | Admin home |
| `Admin/AdminProductsPage` | Product list management |
| `Admin/AdminProductEditor` | Create/edit product with images |

### 10.5 Other client-store files

- `src/constants/categories.js` — UI category helpers (align with server enum where applicable).
- `src/utils/imageUrl.js` — Builds absolute URLs for images (API + uploads).
- `src/styles/global.module.css` — Global styles.
- `vite.config.js` — Port **5173**, proxy `/api` and `/uploads`.
- `public/` — `favicon.svg`, `icons.svg`.

---

## 11. client-tryon — flow, API, screens

### 11.1 Entry and state machine

- `src/main.jsx` — React root.
- `src/App.jsx` — State-driven flow (no React Router):
  - Query param `?productId=` preloads product and jumps to camera.
  - States in `src/constants/states.js`: welcome → manual pick **or** auto pick → camera → processing → result.
  - On unmount, attempts `DELETE /api/tryon/:sessionId` (best-effort cleanup).

### 11.2 API

- `src/api/client.js` — Axios instance with `VITE_API_URL`.

### 11.3 Screens (`src/screens/`)

| Screen | Role |
|--------|------|
| `WelcomeScreen` | Choose manual vs auto flow |
| `ProductPickerScreen` | Fetch products, user picks one (manual) |
| `AutoPickScreen` | Choose `eventType` for auto flow |
| `CameraScreen` | Capture/upload photo → `POST /api/tryon/start` |
| `ProcessingScreen` | `POST .../generate` or `.../auto-generate` |
| `ResultScreen` | Show result; optional WhatsApp/email; retake / restart |

### 11.4 Other client-tryon files

- `src/utils/imageUrl.js` — Image URL helper.
- `src/styles/global.module.css` — Global styles.
- `vite.config.js` — Port **5174**, same proxy pattern as store.

---

## 12. Security and operations notes (for agents)

- **Secrets:** Never commit `server/.env` or real tokens. Use `.env.example` as the template.
- **Admin JWT:** Stored in `localStorage` as `adminToken` in the store client only.
- **Upload limits:** Products ~5MB per file; user try-on photo ~10MB (see `middleware/upload.js`).
- **CORS:** Restricted to `CLIENT_STORE_URL` and `CLIENT_TRYON_URL` when both are set.
- **WhatsApp image delivery:** Twilio/Meta fetch the image via **public** URL — `PUBLIC_BASE_URL` must point to a host that can serve `/uploads/...` over the internet for production.
- **Dependencies:** If removing unused packages, verify `@google-cloud/vertexai` is unused before dropping it.

---

## 13. Related documents

- `DESIGN_REDESIGN_TASK.md` — UI/UX redesign task breakdown for the product.
- `client-store/README.md`, `client-tryon/README.md` — Client-specific notes if present.

---

*Last updated from repository scan. Regenerate or amend this file when adding routes, env vars, or major folders.*
