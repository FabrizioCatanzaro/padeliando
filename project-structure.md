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
    ├── App.jsx                     # Router definition, RequireAuth, layout
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
    │   │   └── Loader.jsx          # Full-page loading spinner
    │   │
    │   ├── Home/
    │   │   └── HomeView.jsx        # Dashboard: user's tournaments, profile/group search, create button
    │   │
    │   ├── Auth/
    │   │   ├── AuthView.jsx        # Login + register forms, Google OAuth
    │   │   ├── ProfileView.jsx     # Public user profile with tournament history & stats
    │   │   └── ResetPassword.jsx   # Password reset (token from email link)
    │   │
    │   ├── Group/
    │   │   └── GroupView.jsx       # Group landing: info, tournament history, edit
    │   │
    │   ├── Setup/
    │   │   ├── Setup.jsx           # Tournament creation wizard (format → players → pairs)
    │   │   ├── PlayerInput.jsx     # Player name input row
    │   │   └── PairBuilder.jsx     # Assign players to fixed pairs
    │   │
    │   ├── Main/
    │   │   └── Main.jsx            # Tournament hub with tabs (Standings / Matches / Stats / Management)
    │   │
    │   ├── Matches/
    │   │   ├── Matches.jsx         # Match list, live match timer, add/delete
    │   │   ├── MatchForm.jsx       # Add/edit match form (teams, scores, date, duration)
    │   │   └── MatchCard.jsx       # Individual match display card
    │   │
    │   ├── Standings/
    │   │   └── Standings.jsx       # Leaderboard table (client-side calcStandings)
    │   │
    │   ├── Stats/
    │   │   └── Stats.jsx           # Per-player stats + tournament history
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
| `ProfileView` | `/u/:username` | Public user profile + history |
| `ResetPassword` | `/reset-password/:token` | Complete password reset flow |
| `GroupView` | `/groups/:groupId` | Group info, tournament history |
| `Setup` | `/groups/:groupId/tournament/new` | Create tournament wizard |
| `Main` | `/groups/:groupId/tournament/:tournamentId` | Tournament hub with tabs |
| `Matches` | (tab in Main) | Match list + live timer |
| `MatchForm` | (modal in Matches) | Add/edit a match result |
| `Standings` | (tab in Main) | Leaderboard table |
| `Stats` | (tab in Main) | Player stats + history |
| `Bracket` | (tab in Main — Americano) | Bracket visualization |
| `Previa` | (tab in Main — Americano) | Match schedule |
| `Management` | (tab in Main) | Admin: reset, finalize |
| `ReadonlyView` | `/readonly/:id` | Public shareable view |
| `InvitationsView` | `/invitations` | Pending invitations |
| `TutorialView` | `/tutorial` | Help/onboarding guide |

---

## Routing

### Public Routes
| Path | Component |
|------|-----------|
| `/` | HomeView |
| `/login` | AuthView |
| `/register` | AuthView |
| `/reset-password/:token` | ResetPassword |
| `/u/:username` | ProfileView |
| `/readonly/:id` | ReadonlyView |
| `/tutorial` | TutorialView |
| `/groups/:groupId` | GroupView |

### Protected Routes (require auth via `<RequireAuth>`)
| Path | Component |
|------|-----------|
| `/groups/:groupId/tournament/new` | Setup |
| `/groups/:groupId/tournament/:tournamentId` | Main |
| `/invitations` | InvitationsView |

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
| `adaptTournament(t)` | Normalize API tournament response to frontend shape |
| `getTournamentWinnerLabel(t)` | Derive winner display string from tournament data |
| `localDateStr()` | Today's date as `YYYY-MM-DD` |
| `emptyForm()` | Return blank match form template object |

---

## API Client (`src/utils/api.js`)

Base URL: `VITE_API_URL` env var. All requests include `credentials: 'include'` for cookies.
On 401 response, automatically attempts token refresh and retries the original request once.

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
- `updateMe(data)` — PATCH /auth/me

**groups**
- `list()` — GET /groups (user's groups)
- `search(query)` — GET /groups/search?q=
- `participating()` — GET /groups/participating
- `get(id)` — GET /groups/:id
- `history(id)` — GET /groups/:id/history
- `create(data)` — POST /groups
- `update(id, data)` — PATCH /groups/:id
- `delete(id)` — DELETE /groups/:id
- `byUsername(username)` — GET /groups/user/:username

**players**
- `search(query)` — GET /players/search?q=
- `resolve(id)` — GET /players/:id/resolve
- `rename(id, name)` — PATCH /players/:id
- `removeFromTournament(playerId, tournamentId)` — DELETE /players/:id/tournament/:tournamentId
- `removeFromGroup(playerId, groupId)` — DELETE /players/:id/group/:groupId

**tournaments**
- `get(id)` — GET /tournaments/:id
- `create(groupId, data)` — POST /groups/:groupId/tournaments
- `update(id, data)` — PATCH /tournaments/:id
- `delete(id)` — DELETE /tournaments/:id
- `resetScores(id)` — POST /tournaments/:id/reset-scores
- `setLive(id, matchData)` — POST /tournaments/:id/live
- `schedule(id)` — POST /tournaments/:id/schedule
- `bracket(id)` — POST /tournaments/:id/bracket

**matches**
- `create(tournamentId, data)` — POST /tournaments/:id/matches
- `update(id, data)` — PATCH /matches/:id
- `delete(id)` — DELETE /matches/:id

**pairs**
- `create(tournamentId, data)` — POST /tournaments/:id/pairs
- `update(id, data)` — PATCH /pairs/:id
- `delete(id)` — DELETE /pairs/:id

**readonly**
- `get(id)` — GET /readonly/:id (public, no auth)

**invitations**
- `list()` — GET /invitations
- `count()` — GET /invitations/count
- `send(data)` — POST /invitations
- `respond(id, status)` — PATCH /invitations/:id
- `cancel(id)` — DELETE /invitations/:id

**subscriptions** *(disabled)*
- `me()`, `checkout(plan)`, `cancel()`

---

## Backend (`padeliando-api/`)

### Directory Tree

```
padeliando-api/
├── package.json                    # Express 5, Neon, JWT, Bcrypt, Resend, Mercado Pago
├── .env                            # Secrets (DB, JWT, Google, Resend, MP)
├── .env.example                    # Template for environment setup
│
└── src/
    ├── index.js                    # Express app: CORS, cookie-parser, route mounting
    ├── db.js                       # Neon database connection pool
    ├── db-init.js                  # Runs schema.sql on startup (idempotent)
    ├── uid.js                      # Unique ID generator
    ├── schema.sql                  # Base schema (all tables except users)
    │
    ├── routes/
    │   ├── auth.js                 # Register, login, Google OAuth, refresh, logout, search, password reset
    │   ├── groups.js               # Group CRUD, search, public profiles, history
    │   ├── tournaments.js          # Tournament CRUD, bracket, schedule, live match, reset scores
    │   ├── matches.js              # Match create/update/delete
    │   ├── pairs.js                # Pair create/update/delete
    │   ├── players.js              # Player search, rename, resolve identity, remove
    │   ├── invitations.js          # Invitation send/respond/cancel/list
    │   └── readonly.js             # Public tournament access (no auth)
    │
    ├── middleware/
    │   └── auth.js                 # requireAuth (blocks) + optionalAuth (enriches) JWT middleware
    │
    └── migrations/
        ├── migration_americano.sql           # Adds format + bracket JSONB columns to tournaments
        ├── migration_tournament_players.sql  # tournament_players table (per-tournament roster)
        ├── migration_player_invitations.sql  # player_invitations table + user_id on players
        ├── migration_subscriptions.sql       # subscriptions table + plan tracking
        └── migration_mp_preapproval.sql      # Mercado Pago preapproval_id on subscriptions
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
| created_at | TIMESTAMPTZ | |

### `groups`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| name | TEXT | |
| description | TEXT | |
| owner_id | TEXT FK → users | |
| created_at | TIMESTAMPTZ | |

### `players`
| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| name | TEXT | display name |
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
| bracket | JSONB | bracket state for Americano format |
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
| played_at | DATE | |
| duration | INTEGER | minutes |
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
| status | TEXT | `pending`, `accepted`, `rejected`, `cancelled` |
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
| ends_at | TIMESTAMPTZ | |
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

---

## External Integrations

| Service | Purpose | SDK/Library |
|---------|---------|-------------|
| Google OAuth 2.0 | Social login | `google-auth-library` |
| Neon PostgreSQL | Database (serverless) | `@neondatabase/serverless` |
| Resend | Transactional email (password reset) | `resend` |
| Mercado Pago | Subscription billing (disabled) | `mercadopago` |
| Vercel | Frontend hosting | `vercel.json` config |
| Render.com | Backend hosting | Environment vars in dashboard |
