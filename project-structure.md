# Project Structure — PADELEANDO

## Frontend (`padeliando/`)

### Directory Tree

```
padeliando/
├── index.html                      # HTML entry point
├── vite.config.js                  # Vite + React + Tailwind plugin
├── eslint.config.js                # ESLint flat config (v9)
├── jsconfig.json                   # JS compiler options (casing: false for Windows)
├── package.json                    # Dependencies & scripts
├── vercel.json                     # Vercel deployment: all routes → /index.html
├── .env.local                      # Local env vars (VITE_API_URL, VITE_GOOGLE_CLIENT_ID)
│
├── public/
│   ├── favicon.ico / favicon.svg
│   ├── icons.svg
│   ├── manifest.json               # PWA manifest
│   ├── robots.txt
│   └── logo*.png
│
└── src/
    ├── main.jsx                    # ReactDOM entry point, wraps app with providers
    ├── App.jsx                     # Router definition, PrivateRoute, AdminRoute, layout
    ├── App.css                     # App-level styles
    ├── index.css                   # Global CSS: Tailwind imports + @theme CSS variables
    │
    ├── assets/                     # Images and SVGs (logo, hero)
    │
    ├── components/
    │   ├── shared/                 # Reusable UI primitives
    │   │   ├── Header.jsx          # Top nav: logo, user menu, theme toggle, help
    │   │   ├── Footer.jsx          # Footer
    │   │   ├── Modal.jsx           # Generic modal wrapper
    │   │   ├── FadeInCard.jsx      # Card with fade-in animation
    │   │   ├── Skeleton.jsx        # Loading skeleton placeholder
    │   │   ├── AdBanner.jsx        # Ad banner container (desktop sidebar)
    │   │   ├── PlayerAvatar.jsx    # User avatar with premium ring; PairAvatar for two players
    │   │   ├── AvatarCropper.jsx   # Crop/preview image before uploading avatar
    │   │   └── MapPicker.jsx       # Location picker for group address (Google Maps embed)
    │   │
    │   ├── Loader/
    │   │   └── Loader.jsx          # Full-page loading spinner
    │   │
    │   ├── Home/
    │   │   └── HomeView.jsx        # Dashboard: user's tournaments, profile/group search, create button
    │   │
    │   ├── Auth/
    │   │   ├── AuthView.jsx        # Login + register forms, Google OAuth
    │   │   ├── ProfileView.jsx     # Public user profile: stats, win streak, recent matches, frequent partners
    │   │   ├── ResetPassword.jsx   # Password reset (token from email link)
    │   │   └── VerifyEmail.jsx     # Email verification (token from email link)
    │   │
    │   ├── Admin/
    │   │   ├── AdminDashboard.jsx  # Site-wide stats (users, tournaments, activity) — admin only
    │   │   ├── AdminUsers.jsx      # User list, search, grant/revoke premium — admin only
    │   │   ├── AdminTournaments.jsx# Tournament list with filters — admin only
    │   │   └── TimeseriesChart.jsx # Activity timeseries chart component
    │   │
    │   ├── Group/
    │   │   └── GroupView.jsx       # Group landing: info, tournament history, edit, location
    │   │
    │   ├── Setup/
    │   │   ├── Setup.jsx           # Tournament creation wizard (format → players → pairs)
    │   │   ├── PlayerInput.jsx     # Player name input row
    │   │   └── PairBuilder.jsx     # Assign players to fixed pairs
    │   │
    │   ├── Main/
    │   │   └── Main.jsx            # Tournament hub with tabs (Standings / Matches / Stats / Management / Photos)
    │   │
    │   ├── Matches/
    │   │   ├── Matches.jsx         # Match list, live match timer, add/delete
    │   │   ├── MatchForm.jsx       # Add/edit match form (teams, scores, date, duration)
    │   │   └── MatchCard.jsx       # Individual match display card
    │   │
    │   ├── Standings/
    │   │   └── Standings.jsx       # Leaderboard table (client-side calcStandings); hides champion banner for americano
    │   │
    │   ├── Stats/
    │   │   └── Stats.jsx           # Per-player stats + tournament history
    │   │
    │   ├── Photos/
    │   │   └── PhotoGallery.jsx    # Tournament photo gallery (premium upload, public view)
    │   │
    │   ├── Americano/
    │   │   ├── Bracket.jsx         # Bracket visualization + winner advancement
    │   │   └── Previa.jsx          # Americano match schedule/preview
    │   │
    │   ├── ReadonlyView/
    │   │   └── ReadonlyView.jsx    # Public shareable tournament view (no auth required)
    │   │
    │   ├── Invitations/
    │   │   └── InvitationsView.jsx # Pending invitations inbox for logged-in user
    │   │
    │   ├── Management/
    │   │   ├── Management.jsx      # Admin panel: reset scores, finalize tournament
    │   │   ├── PlayerManager.jsx   # Add / rename / remove players
    │   │   └── PairManager.jsx     # Create / edit / remove fixed pairs
    │   │
    │   ├── Subscription/           # DISABLED — routes commented out in App.jsx
    │   │   ├── SubscriptionTest.jsx
    │   │   └── SubscriptionSuccess.jsx
    │   │
    │   └── Tutorial/
    │       ├── TutorialView.jsx    # Tutorial landing with section list
    │       ├── TutorialSection.jsx # Section wrapper component
    │       ├── TutorialMedia.jsx   # Image/video display within tutorial
    │       └── sections/           # One file per tutorial topic
    │           ├── RegistroSection.jsx
    │           ├── PerfilSection.jsx
    │           ├── CrearTorneoSection.jsx
    │           ├── CrearJornadaSection.jsx
    │           ├── CrearPartidoSection.jsx
    │           ├── EditarTorneoSection.jsx
    │           ├── FinalizarSection.jsx
    │           ├── FormatosSection.jsx
    │           ├── JugadoresSection.jsx
    │           └── PrivacidadSection.jsx
    │
    ├── context/
    │   ├── AuthContext.jsx         # Auth state (user, login, logout, isLoggedIn)
    │   ├── ThemeContext.jsx        # Dark/light theme toggle (persisted to localStorage)
    │   └── useAuth.js              # useContext(AuthContext) convenience hook
    │
    ├── hooks/
    │   └── useTournament.js        # Central hook: all tournament CRUD, match/player/pair ops, schedule/bracket
    │
    └── utils/
        ├── api.js                  # Fetch wrapper: all API endpoints, auto token refresh on 401
        ├── auth.js                 # Auth helper functions
        ├── helpers.js              # Pure utility functions (see table below)
        └── storage.js              # localStorage read/write helpers
```

---

## Component Map

| Component | Route | Purpose |
|-----------|-------|---------|
| `HomeView` | `/` | User's tournament list, search, create entry point |
| `AuthView` | `/login` `/register` | Email + Google OAuth login/register |
| `ProfileView` | `/u/:username` | Public user profile: stats, streaks, recent matches, frequent partners |
| `ResetPassword` | `/reset-password/:token` | Complete password reset flow |
| `VerifyEmail` | `/verify-email/:token` | Complete email verification flow |
| `GroupView` | `/cat/:groupId` | Group info, tournament history, location |
| `Setup` | `/cat/:groupId/torneo/new` | Create tournament wizard |
| `Main` | `/cat/:groupId/torneo/:tournamentId` | Tournament hub with tabs |
| `Matches` | (tab in Main) | Match list + live timer |
| `MatchForm` | (modal in Matches) | Add/edit a match result |
| `Standings` | (tab in Main) | Leaderboard table |
| `Stats` | (tab in Main) | Player stats + history |
| `Bracket` | (tab in Main — Americano) | Bracket visualization |
| `Previa` | (tab in Main — Americano) | Match schedule |
| `Management` | (tab in Main) | Admin: reset, finalize |
| `PhotoGallery` | (tab in Main) | Tournament photos (premium upload) |
| `ReadonlyView` | `/view/:id` | Public shareable view (old `/readonly/:id` redirects here) |
| `InvitationsView` | `/invitations` | Pending invitations |
| `TutorialView` | `/tutorial` | Help/onboarding guide |
| `AdminDashboard` | `/admin` | Site stats — admin only |
| `AdminUsers` | `/admin/users` | User management — admin only |
| `AdminTournaments` | `/admin/tournaments` | Tournament list — admin only |

---

## Routing

### Public Routes
| Path | Component |
|------|-----------|
| `/` | HomeView |
| `/login` | AuthView |
| `/register` | AuthView |
| `/reset-password/:token` | ResetPassword |
| `/verify-email/:token` | VerifyEmail |
| `/u/:username` | ProfileView |
| `/view/:id` | ReadonlyView (old `/readonly/:id` redirects here) |
| `/tutorial` | TutorialView |
| `/cat/:groupId` | GroupView |
| `/cat/:groupId/torneo/:tournamentId` | Main (public — no RequireAuth) |

### Protected Routes (require auth via `<PrivateRoute>`)
| Path | Component |
|------|-----------|
| `/cat/:groupId/torneo/new` | Setup |
| `/invitations` | InvitationsView |

### Admin Routes (require `user.role === 'admin'` via `<AdminRoute>`)
| Path | Component |
|------|-----------|
| `/admin` | AdminDashboard |
| `/admin/users` | AdminUsers |
| `/admin/tournaments` | AdminTournaments |

---

## State Management

### AuthContext (`src/context/AuthContext.jsx`)
Provides:
- `user` — current user object (from localStorage + server verification on mount)
- `isLoggedIn` — boolean
- `loading` — boolean (initial auth check in progress)
- `login(userData)` — saves user to state + localStorage
- `logout()` — clears state, localStorage, calls API logout

### ThemeContext (`src/context/ThemeContext.jsx`)
Provides:
- `theme` — `'dark'` | `'light'`
- `toggleTheme()` — flips `.light` class on `<html>`, persists to localStorage

### useTournament hook (`src/hooks/useTournament.js`)
Manages all tournament state and operations. Returns:
- `tournament`, `matches`, `players`, `pairs` — current tournament data
- `loading`, `error`
- Handlers: `handleCreate`, `handleUpdateMatch`, `handleDeleteMatch`, `handleAddPlayer`, `handleRemovePlayer`, `handleGenerateSchedule`, `handleGenerateBracket`, `handleSetLive`, `handleFinalize`, `handleResetScores`, etc.

---

## Utility Functions (`src/utils/helpers.js`)

| Function | Purpose |
|----------|---------|
| `uid()` | Generate random short ID |
| `fmt(date)` | Format date for Argentina timezone (es-AR locale) |
| `normalize(str)` | Lowercase + trim for comparisons |
| `calcStandings(players, matches)` | Calculate full standings table, sorted by wins → point diff → points for |
| `getPairLabel(pairId, pairs, players)` | Returns `"Player1 & Player2"` string |
| `expandPair(pairId, pairs)` | Returns `[p1_id, p2_id]` from a pair ID |
| `adaptMatch(m)` | Normalize API match response to frontend shape |
| `adaptPair(p)` | Normalize API pair response to frontend shape |
| `patchBracketNames(bracket, pairs, players)` | Re-derive all pair/winner names in a bracket JSONB from current player data (fixes stale stored names) |
| `adaptTournament(t)` | Normalize API tournament response; resolves `linked_name` for all players; calls `patchBracketNames` |
| `getTournamentWinnerLabel(t)` | Derive winner display string from tournament data |
| `localDateStr()` | Today's date as `YYYY-MM-DD` |
| `emptyForm()` | Return blank match form template object |

---

## API Client (`src/utils/api.js`)

Base URL: `VITE_API_URL` env var. All requests include `credentials: 'include'` for cookies.
On 401 response, automatically attempts token refresh and retries the original request once.
File uploads use `reqMultipart()` (no `Content-Type` header; browser sets multipart boundary).

### Endpoint Groups

**auth**
- `register(data)` — POST /auth/register
- `login(data)` — POST /auth/login
- `google(token)` — POST /auth/google
- `me()` — GET /auth/me
- `logout()` — POST /auth/logout
- `search(query)` — GET /auth/search?q=
- `forgotPassword(email)` — POST /auth/forgot-password
- `resetPassword(token, password)` — POST /auth/reset-password
- `verifyEmail(token)` — POST /auth/verify-email
- `resendVerification(email)` — POST /auth/resend-verification
- `updateMe(data)` — PATCH /auth/me
- `uploadAvatar(file)` — POST /auth/me/avatar (multipart)
- `deleteAvatar()` — DELETE /auth/me/avatar

**groups**
- `list()` — GET /groups (user's groups)
- `search(query)` — GET /groups/search?q=
- `nearby(lat, lon, radius)` — GET /groups/nearby
- `participating()` — GET /groups/participating
- `get(id)` — GET /groups/:id
- `history(id)` — GET /groups/:id/history
- `create(data)` — POST /groups
- `update(id, data)` — PUT /groups/:id
- `delete(id)` — DELETE /groups/:id
- `byUsername(username)` — GET /groups/user/:username (public profile + stats)

**players**
- `search(query, groupId, mine)` — GET /players
- `resolve(name, groupId, tournamentId)` — POST /players/resolve
- `rename(id, name, groupId)` — PATCH /players/:id
- `removeFromTournament(playerId, tournamentId)` — DELETE /players/:id/tournament/:tournamentId
- `removeFromGroup(playerId, groupId)` — DELETE /players/:id/group/:groupId

**tournaments**
- `get(id)` — GET /tournaments/:id
- `create(body)` — POST /tournaments
- `update(id, data)` — PATCH /tournaments/:id
- `delete(id)` — DELETE /tournaments/:id
- `resetScores(id)` — DELETE /tournaments/:id/matches
- `setLive(id, matchData)` — PATCH /tournaments/:id/live
- `schedule(id)` — POST /tournaments/:id/schedule
- `bracket(id)` — POST /tournaments/:id/bracket
- `updateBracket(id, matchId, body)` — PATCH /tournaments/:id/bracket/:matchId
- `setBracket(id, bracket)` — PATCH /tournaments/:id/bracket

**matches**
- `create(body)` — POST /matches
- `update(id, data)` — PUT /matches/:id
- `delete(id)` — DELETE /matches/:id

**pairs**
- `create(body)` — POST /pairs
- `update(id, data)` — PUT /pairs/:id
- `delete(id)` — DELETE /pairs/:id

**readonly**
- `get(id)` — GET /readonly/:id (public, no auth)

**invitations**
- `list()` — GET /invitations
- `count()` — GET /invitations/count
- `send(playerId, groupId, identifier)` — POST /invitations
- `respond(id, action)` — PATCH /invitations/:id
- `cancel(id)` — DELETE /invitations/:id

**photos**
- `list(tournamentId)` — GET /tournaments/:id/photos
- `upload(tournamentId, file, caption)` — POST /tournaments/:id/photos (multipart, premium only)
- `updateCaption(tournamentId, photoId, caption)` — PATCH /tournaments/:id/photos/:photoId
- `delete(tournamentId, photoId)` — DELETE /tournaments/:id/photos/:photoId

**admin** *(admin role required)*
- `stats()` — GET /admin/stats
- `timeseries(days)` — GET /admin/timeseries
- `users({ q, page, limit })` — GET /admin/users
- `tournaments({ q, status, page, limit })` — GET /admin/tournaments
- `grantPremium(userId, duration_days)` — POST /admin/users/:id/grant-premium
- `revokePremium(userId)` — POST /admin/users/:id/revoke-premium

**subscriptions** *(disabled)*
- `me()`, `checkout(plan)`, `cancel()`

---

## Backend (`padeliando-api/`)

### Directory Tree

```
padeliando-api/
├── package.json                    # Express 5, Neon, JWT, Bcrypt, Resend, Cloudinary, Mercado Pago
├── .env                            # Secrets (DB, JWT, Google, Resend, Cloudinary, MP)
├── .env.example                    # Template for environment setup
│
└── src/
    ├── index.js                    # Express app: CORS, cookie-parser, route mounting
    ├── db.js                       # Neon database connection pool
    ├── db-init.js                  # Runs schema.sql on startup (idempotent)
    ├── uid.js                      # Unique ID generator
    ├── schema.sql                  # Base schema (all tables + idempotent ALTERs)
    │
    ├── routes/
    │   ├── auth.js                 # Register, login, Google OAuth, refresh, logout, search, password reset, email verification, avatar upload
    │   ├── groups.js               # Group CRUD, search, nearby, public profiles (/user/:username), history with full player stats
    │   ├── tournaments.js          # Tournament CRUD, bracket, schedule, live match, reset scores
    │   ├── matches.js              # Match create/update/delete
    │   ├── pairs.js                # Pair create/update/delete
    │   ├── players.js              # Player search, rename, resolve identity, remove
    │   ├── invitations.js          # Invitation send/respond/cancel/list; acceptance syncs player name to user's real name
    │   ├── readonly.js             # Public tournament access (no auth)
    │   ├── photos.js               # Tournament photo upload/manage (premium only, Cloudinary)
    │   ├── subscriptions.js        # Subscription plan management (Mercado Pago, mostly disabled)
    │   └── admin.js                # Admin dashboard: stats, user management, premium grants
    │
    ├── middleware/
    │   ├── auth.js                 # requireAuth (blocks) + optionalAuth (enriches) JWT middleware
    │   ├── requirePremium.js       # Blocks non-premium users from premium endpoints
    │   └── upload.js               # Multer config for in-memory file upload (before Cloudinary)
    │
    ├── lib/
    │   └── cloudinary.js           # Cloudinary upload/delete helpers (uploadBuffer, deleteByPublicId)
    │
    └── emails/
        ├── VerifyEmail.jsx         # React Email template for email verification
        └── ResetPassword.jsx       # React Email template for password reset
```

---

## Database Schema

**Database:** Neon serverless PostgreSQL (region: sa-east-1)

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| email | TEXT UNIQUE | |
| password_hash | TEXT | nullable (Google-only users) |
| google_id | TEXT | nullable |
| name | TEXT | display name |
| username | TEXT UNIQUE | used in profile URLs `/u/:username` |
| avatar_url | TEXT | nullable; Cloudinary URL |
| avatar_public_id | TEXT | nullable; Cloudinary public ID for deletion |
| email_verified_at | TIMESTAMPTZ | nullable; NULL means unverified (Google users auto-verified) |
| role | TEXT | `user` (default) or `admin` |
| social_links | JSONB | array of `{ platform, url }` objects (default `[]`) |
| created_at | TIMESTAMPTZ | |

### `groups`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| name | TEXT | |
| description | TEXT | |
| owner_id | TEXT FK → users | |
| location_name | TEXT | nullable; human-readable address |
| place_id | TEXT | nullable; Google Maps place ID |
| lat | DOUBLE PRECISION | nullable |
| lon | DOUBLE PRECISION | nullable |
| created_at | TIMESTAMPTZ | |

### `players`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| name | TEXT | display name (may be overwritten when invitation is accepted) |
| user_id | TEXT FK → users | nullable; set when invitation is accepted |
| created_at | TIMESTAMPTZ | |

### `group_players`
| Column | Type | Notes |
|--------|------|-------|
| group_id | TEXT FK → groups | composite PK |
| player_id | TEXT FK → players | composite PK |
| added_at | TIMESTAMPTZ | |

### `tournaments`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| group_id | TEXT FK → groups | |
| name | TEXT | |
| mode | TEXT | `free` or `pairs` |
| format | TEXT | `liga` or `americano` |
| status | TEXT | `active` or `finished` |
| bracket | JSONB | bracket state for Americano format; names are patched client-side via `patchBracketNames` |
| live_match | JSONB | currently active match timer data |
| created_at | TIMESTAMPTZ | |

### `tournament_players`
| Column | Type | Notes |
|--------|------|-------|
| tournament_id | TEXT FK → tournaments | composite PK |
| player_id | TEXT FK → players | composite PK |
| added_at | TIMESTAMPTZ | |

### `pairs`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| tournament_id | TEXT FK → tournaments | |
| p1_id | TEXT FK → players | |
| p2_id | TEXT FK → players | |

### `matches`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| tournament_id | TEXT FK → tournaments | |
| team1_p1 | TEXT FK → players | |
| team1_p2 | TEXT FK → players | nullable (free mode: 1v1) |
| team2_p1 | TEXT FK → players | |
| team2_p2 | TEXT FK → players | nullable |
| score1 | INTEGER | team 1 score |
| score2 | INTEGER | team 2 score |
| played_at | DATE NOT NULL | used for chronological ordering (win streak, recent matches) |
| created_at | TIMESTAMPTZ | |

### `player_invitations`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| player_id | TEXT FK → players | the anonymous player slot being claimed |
| group_id | TEXT FK → groups | |
| invited_by | TEXT FK → users | who sent the invite |
| invited_identifier | TEXT | email or username sent to |
| invited_user_id | TEXT FK → users | resolved when accepted |
| status | TEXT | `pending`, `accepted`, `rejected` |
| created_at | TIMESTAMPTZ | |

### `email_verifications`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| user_id | TEXT FK → users | |
| token_hash | TEXT UNIQUE | hashed verification token |
| expires_at | TIMESTAMPTZ | |
| used | BOOLEAN | default FALSE |
| created_at | TIMESTAMPTZ | |

### `tournament_photos`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| tournament_id | TEXT FK → tournaments | |
| uploaded_by | TEXT FK → users | |
| url | TEXT | Cloudinary URL |
| public_id | TEXT | Cloudinary public ID |
| caption | TEXT | nullable |
| created_at | TIMESTAMPTZ | |

### `subscriptions`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| user_id | TEXT FK → users | |
| plan | TEXT | `free` or `premium` |
| billing_period | TEXT | `monthly`, `quarterly`, `annual`, `trial` |
| status | TEXT | `active`, `cancelled`, `expired` |
| starts_at | TIMESTAMPTZ | |
| ends_at | TIMESTAMPTZ | nullable (free plan: no expiry) |
| mp_preapproval_id | TEXT | Mercado Pago preapproval reference |
| created_at | TIMESTAMPTZ | |

---

## Migration History

| File | What it added |
|------|---------------|
| `migration_americano.sql` | `format` TEXT and `bracket` JSONB columns on `tournaments` |
| `migration_tournament_players.sql` | `tournament_players` join table for per-tournament rosters |
| `migration_player_invitations.sql` | `player_invitations` table + `user_id` column on `players` |
| `migration_subscriptions.sql` | `subscriptions` table for premium plan tracking |
| `migration_mp_preapproval.sql` | `mp_preapproval_id` on `subscriptions` for recurring billing |
| `migration_photos.sql` | `avatar_url`/`avatar_public_id` on `users`; `tournament_photos` table |
| `migration_email_verification.sql` | `email_verified_at` on `users`; `email_verifications` table |
| `migration_admin_role.sql` | `role` column on `users` (`user`/`admin`) |
| `migration_groups_location.sql` | `location_name`, `place_id`, `lat`, `lon` on `groups` |
| `migration_user_social_links.sql` | `social_links` JSONB on `users` |

---

## External Integrations

| Service | Purpose | SDK/Library |
|---------|---------|-------------|
| Google OAuth 2.0 | Social login | `google-auth-library` |
| Neon PostgreSQL | Database (serverless) | `@neondatabase/serverless` |
| Resend | Transactional email (password reset, email verification) | `resend` |
| Cloudinary | Image storage (avatars, tournament photos) | `cloudinary` |
| Mercado Pago | Subscription billing (disabled) | `mercadopago` |
| Vercel | Frontend hosting | `vercel.json` config |
| Render.com | Backend hosting | Environment vars in dashboard |
