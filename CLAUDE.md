# CLAUDE.md — PADELEANDO

## Project Overview

PADELEANDO is a full-stack web app for managing padel tennis tournaments. It supports two tournament formats (Liga/Americano), two modes (Free players/Fixed pairs), live match tracking, standings, stats, invitations, and public sharing of tournaments. Users have public profiles with personal stats (win %, streaks, recent matches, frequent partners, americano championships). Premium accounts unlock extra features (photo galleries, avatar uploads). An admin dashboard is available to users with `role = 'admin'`.

---

## Repositories

| Repo | Path | Purpose |
|------|------|---------|
| Frontend | `c:\Users\Fabry\Programacion\padeliando` | React + Vite SPA |
| Backend API | `c:\Users\Fabry\Programacion\padeliando-api` | Express REST API |

Both repos are independent — they are **not** a monorepo.

---

## Tech Stack

**Frontend**
- React 19.2 + React Router 7.13
- Vite 6.3 (build tool)
- Tailwind CSS 4.2 (via `@tailwindcss/vite` plugin — no `tailwind.config.js`)
- Lucide React (icons)

**Backend**
- Node.js + Express 5.2
- Neon serverless PostgreSQL (`@neondatabase/serverless`)
- JWT authentication (1h access token, 30d refresh token via httpOnly cookies)
- Bcrypt for password hashing
- Resend for transactional email (password reset, email verification)
- Cloudinary for image uploads (avatars, tournament photos)
- Mercado Pago for subscriptions (currently disabled)

---

## Dev Commands

### Frontend (`padeliando/`)
```bash
npm run dev       # Start Vite dev server (http://localhost:5173)
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

### Backend (`padeliando-api/`)
```bash
npm run dev       # Start Express server with nodemon (http://localhost:3001)
npm start         # Start without hot reload
```

---

## Environment Variables

### Frontend (`.env.local`)
| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Backend base URL (`http://localhost:3001` in dev, `https://padeliando-api.onrender.com` in prod) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID |

### Backend (`.env`)
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `PORT` | API port (default: 3001) |
| `CORS_ORIGIN` | Allowed frontend origin |
| `FRONTEND_URL` | Used in email links (verification, password reset) |
| `JWT_SECRET` | Signs access tokens |
| `GOOGLE_CLIENT_ID` | Google OAuth verification |
| `RESEND_API_KEY` | Transactional email service |
| `MAIL_FROM` | Sender address for emails (default: `Padeleando <onboarding@resend.dev>`) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud for image uploads |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `MP_ACCESS_TOKEN` | Mercado Pago token (subscription feature disabled) |
| `NODE_ENV` | `production` or `development` |

---

## Architecture

```
Browser
  └── React App (AuthContext + ThemeContext)
        └── React Router routes
              └── Components
                    └── useTournament hook  ←→  src/utils/api.js  →  Express API  →  Neon DB
                                                                                  →  Cloudinary (images)
```

- **`src/utils/api.js`** is the single API client. It handles auth token refresh on 401 automatically. All HTTP calls must go through it.
- **`src/context/AuthContext.jsx`** wraps the entire app and provides `user`, `login()`, `logout()`, `isLoggedIn`.
- **`src/hooks/useTournament.js`** is the central hook for all tournament operations (matches, players, pairs, scores, bracket). Components should use this hook rather than calling `api.js` directly.
- **`src/utils/helpers.js`** normalizes API responses (`adaptTournament`, `adaptMatch`, `adaptPair`), patches stale bracket names (`patchBracketNames`), and calculates standings client-side (`calcStandings`).

---

## Key Conventions

### API Calls
- **Never use `fetch()` directly in components.** All API calls go through `src/utils/api.js`.
- The api wrapper handles 401 → token refresh → retry automatically.
- Multipart (file upload) calls use `reqMultipart()` internally — exposed as `api.auth.uploadAvatar`, `api.photos.upload`.

### Data Normalization
- API responses are always normalized through adapter functions in `helpers.js` before use:
  - `adaptTournament(t)` — normalize tournament; resolves `linked_name`, patches bracket names
  - `adaptMatch(m)` — normalize match
  - `adaptPair(p)` — normalize pair

### Name Resolution (`linked_name` pattern)
- When a user accepts an invitation, their player slot gains a `user_id` link. From that point on, the backend returns `u.name AS linked_name` alongside `p.name` for all player queries.
- `adaptTournament` resolves every player to `linked_name ?? name`, so components always show the real account name.
- Bracket names are baked into the stored JSONB. `patchBracketNames` (called inside `adaptTournament`) re-derives all pair/winner names from the current player list, fixing stale stored names retroactively.
- Consequence: **all name resolution happens in `adaptTournament`**. Backend queries must include `LEFT JOIN users u ON u.id = p.user_id` and `u.name AS linked_name` wherever players are fetched.

### Standings
- Always calculated **client-side** with `calcStandings(players, matches)` from `helpers.js`.
- Sorted by: wins → point differential → points for.
- In americano format, the champion is determined by `bracket.final.winner_id`, not the standings table.

### Theming
- Theme variables live in `src/index.css` as CSS custom properties under `@theme`.
- Dark mode is the **default**. Light mode adds the `.light` class to `<html>`.
- Use `--color-brand` (lime yellow `#e8f04a`) for primary accent, `--color-surface` for card backgrounds.
- Never hardcode colors — always use the CSS variables.

### Routing & Auth
- Protected routes use the `<PrivateRoute>` component wrapper in `App.jsx`.
- Admin-only routes use `<AdminRoute>` (checks `user.role === 'admin'`).
- Group/tournament URLs use the `/cat/` prefix (e.g. `/cat/:groupId/torneo/:tournamentId`).
- Public routes include: `/`, `/login`, `/register`, `/u/:username`, `/readonly/:id`, `/tutorial`, `/cat/:groupId`, `/verify-email/:token`, `/reset-password/:token`.

### Tailwind CSS
- Tailwind 4 is configured via the Vite plugin only — there is no `tailwind.config.js`.
- Custom theme values are defined in `src/index.css` using `@theme {}`.

### Component Organization
- Feature components live in `src/components/<Feature>/`.
- Shared/reusable components live in `src/components/shared/`.
- New components should follow the existing file-per-component pattern.

---

## What NOT to Do

- **Don't bypass `api.js`** — the token refresh logic lives there; skipping it breaks auth.
- **Don't add subscription/payment UI** — the Subscription feature is intentionally disabled (components exist but routes are commented out in App.jsx).
- **Don't store auth tokens in localStorage** — tokens use httpOnly cookies; only the `user` object (no secrets) is stored in localStorage.
- **Don't use a `tailwind.config.js`** — Tailwind 4 doesn't use one; extend the theme via `@theme {}` in `index.css`.
- **Don't calculate standings server-side** — standings are always derived client-side.
- **Don't show a "CAMPEONES" banner in americano tournaments** — champion is determined by the bracket final, not standings.
- **Don't hardcode player names** — always go through `adaptTournament` / `linked_name` pattern so invited users see their real name.

---

## Deployment

| Layer | Platform | URL |
|-------|----------|-----|
| Frontend | Vercel | `vercel.json` handles SPA rewrites (all → `/index.html`) |
| Backend | Render.com | `https://padeliando-api.onrender.com` |
| Database | Neon (serverless PostgreSQL) | Region: sa-east-1 (São Paulo) |
| Images | Cloudinary | Avatars in `avatars/` folder, tournament photos in `tournament-photos/` |

---

## Database Migrations

Migration files are in `padeliando-api/src/` (flat, alongside routes). Run them manually against Neon when needed. The base schema (all tables + idempotent ALTERs) is in `padeliando-api/src/schema.sql`.

---

## See Also

- [project-structure.md](project-structure.md) — Full component map, routing table, API endpoints, and DB schema reference.
