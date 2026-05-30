# project-nexus-light — Leaflet Frontend

## Current State
Next.js 14 App Router frontend for Leaflet (community book-sharing). Talks exclusively to
the FastAPI backend at `NEXT_PUBLIC_API_URL`. No direct Supabase SDK calls — all data and
auth go through the backend.

See the root `project-nexus/CLAUDE.md` for the complete cross-repo contract.

---

## Stack
- **Next.js 14** — App Router (server + client components)
- **React 18** — hooks, context
- **JavaScript only** — NO TypeScript, NO `.ts`/`.tsx` files anywhere
- **Tailwind CSS** — all styling; no external UI component libraries
- **next-pwa** — service worker + PWA manifest
- Node 20

---

## Full File Structure

```
app/
  layout.js                'use server' — root layout: metadata, AuthProvider, ErrorBoundary,
                            AppChrome mount; dark-mode class on <html>
  page.js                  root: no content — middleware handles redirect
  globals.css              @tailwind directives + CSS custom properties for theme tokens

  app/
    page.js                'use client' — authenticated main dashboard
  auth/
    page.js                'use client' — login / signup / reset password (3-view)
    callback/
      page.js              'use client' — OAuth callback: extract token from URL → setToken → redirect
  admin/
    page.js                'use client' — admin panel (RouteGate requires admin+)
  books/
    page.js                'use client' — browse all books; search + filter
    [id]/
      page.js              'use client' — book detail; borrow/save/review actions
  profile/
    page.js                'use client' — profile edit form
  onboarding/
    page.js                'use client' — first-login profile setup; sets leaflet_onboarded cookie
  pending/
    page.js                public — waiting-for-approval screen
  landing/
    page.js                public — marketing / splash page
  legal/
    privacy/
      page.js              fetches GET /legal/privacy; falls back to static text
    terms/
      page.js              fetches GET /legal/terms; falls back to static text

components/
  AuthProvider.js          'use client' — AuthContext: user, profile, role, loading, auth actions
  RouteGate.js             'use client' — client-side access control; redirects on role/approval fail
  AuthDock.js              'use client' — top-right auth strip: display name, avatar, logout button
  AppChrome.js             'use client' — persistent nav shell: logo, links, admin link, dark toggle
  ErrorBoundary.js         class component — top-level error boundary; shows fallback UI
  BookCard.js              'use client' — book card with contextual action buttons
  BookModal.js             'use client' — book detail overlay: cover, info, borrow/save, reviews
  AddBookModal.js          'use client' — add book: catalog typeahead search → condition select
                            or full form (title/author/isbn/condition/cover)
  BookGrid.js              responsive book grid layout (pure layout, no data fetching)
  AdminDashboard.js        'use client' — full admin panel: stats, approval queue, users,
                            books, loans, requests (tabbed)
  ProfileSetup.js          'use client' — profile form used by both /onboarding and /profile
  Toast.js                 'use client' — toast notification system + ToastContext provider
  PageLoader.js            centered full-page spinner (no hooks, no 'use client' needed)

hooks/
  useAppearance.js         'use client' — dark/light toggle; reads/writes localStorage('leaflet-theme');
                            applies 'dark' class to document.documentElement
  useDebounce.js           generic debounce hook: useDebounce(value, delay)

lib/
  storage.js               IndexedDB persistence boundary — the ONLY place persistence logic lives
  auth.js                  token management + backend auth helpers
  api.js                   fetch wrapper: the ONLY way to call the backend
  admin.js                 admin API helpers (thin wrappers over apiFetch)
  themes.js                color palette + mood definitions
  featureFlags.js          hasFeature(key) → all return true until monetization gates needed
  utils.js                 pure utilities: formatDisplayName, formatDate, truncate, etc.

middleware.js              cookie-based route protection (Next.js edge middleware)

public/
  manifest.json            PWA manifest
  icons/
    icon-192.png           PWA icon
    icon-512.png           PWA icon

next.config.js             withPWA wrapper; image remote patterns
tailwind.config.js         darkMode: 'class'; brand green palette; content paths
postcss.config.js          tailwindcss + autoprefixer
package.json               next@14, react@18, next-pwa, tailwind
Dockerfile                 node:20-alpine; npm install; npm run dev
.env.example               NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL, KEY
.gitignore
.dockerignore
CLAUDE.md
AGENTS.md
```

---

## Architectural Decisions

1. **`lib/api.js` is the only route to the backend.** Components never call `fetch()` with `NEXT_PUBLIC_API_URL` directly.
2. **`lib/storage.js` is the only persistence layer.** IndexedDB caches server data. Backend is always source of truth.
3. **No Supabase SDK import anywhere in this repo.** Auth and all data go through FastAPI.
4. **Token in both localStorage and cookie.** `localStorage('leaflet_token')` for API calls; `leaflet_token` cookie for Next.js middleware.
5. **No `<form>` tags.** Controlled inputs + button `onClick` handlers only.
6. **Every component: named export + default export.**
   ```js
   export function BookCard({ book }) { ... }
   export default BookCard
   ```
7. **`'use client'` on any component using `useState`/`useEffect`/browser APIs.**
8. **Dark mode via `dark` class on `<html>`.** Toggle stored in `localStorage('leaflet-theme')`.

---

## Routing Rules

| Route | Access | Behaviour |
|-------|--------|-----------|
| `/` | public | middleware: → `/landing` (no token) or `/app` (has token) |
| `/landing` | public | marketing page |
| `/auth` | public | login / signup / reset |
| `/auth/callback` | public | OAuth token finalization |
| `/legal/*` | public | privacy, terms |
| `/onboarding` | authed | first-time profile setup; sets `leaflet_onboarded=true` cookie |
| `/pending` | authed | waiting screen for pending approval |
| `/app` | authed + approved | main dashboard |
| `/books` | authed + approved | browse |
| `/books/[id]` | authed + approved | book detail |
| `/profile` | authed + approved | profile edit |
| `/admin` | authed + admin/super_admin | admin panel |

### middleware.js (edge)
```js
import { NextResponse } from 'next/server'
export function middleware(request) {
  const token = request.cookies.get('leaflet_token')?.value
  const { pathname } = request.nextUrl
  const PUBLIC = ['/', '/auth', '/landing', '/legal', '/_next', '/icons', '/favicon', '/manifest']
  const isPublic = PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!token && !isPublic) return NextResponse.redirect(new URL('/landing', request.url))
  if (token && pathname === '/')  return NextResponse.redirect(new URL('/app', request.url))
  return NextResponse.next()
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon|icons|manifest).*)'] }
```

### RouteGate (client-side second layer)
- Wraps protected page content
- Reads `AuthContext` for `role` and `profile.approval_status`
- Redirects if insufficient; shows `<PageLoader />` while loading

---

## lib/auth.js Contract

```js
export function getToken()              // localStorage.getItem('leaflet_token') ?? null
export function setToken(token)         // localStorage + document.cookie
export function clearToken()            // remove localStorage + expire cookie
export async function login(email, pw)  // POST /auth/login → setToken → returns profile
export async function signup(email, pw) // POST /auth/signup → returns {user}
export async function logout()          // POST /auth/logout → clearToken
export async function resetPassword(email) // POST /auth/reset-password
```

Token storage:
```js
export function setToken(token) {
  localStorage.setItem('leaflet_token', token)
  document.cookie = `leaflet_token=${token}; path=/; SameSite=Lax`
}
export function clearToken() {
  localStorage.removeItem('leaflet_token')
  document.cookie = 'leaflet_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
}
```

---

## lib/api.js Contract

```js
export async function apiFetch(path, options = {}) {
  const token = getToken()
  const res = await fetch(process.env.NEXT_PUBLIC_API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json()
}
```

---

## AuthProvider Contract

`AuthContext` provides:
```js
{
  user: { id, email } | null,         // from GET /auth/me after token set
  profile: ProfileObject | null,      // from GET /users/me
  role: 'user' | 'admin' | 'super_admin',
  loading: boolean,
  isAuthenticated: boolean,
  login(email, password),             // calls lib/auth.js login; updates context
  logout(),                           // calls lib/auth.js logout; clears context
  signup(email, password),
  resetPassword(email),
  refreshProfile(),                   // re-fetches GET /users/me
}
```

Mount behaviour: read `leaflet_token` from localStorage → `GET /users/me` → set `profile` + `role`.

---

## lib/storage.js Contract

IndexedDB database: `leaflet-db`, version 1.

Object stores:
- `books` (keyPath: `id`) — book list cache
- `profile` (keyPath: `id`) — user profile cache
- `drafts` (keyPath: `key`) — form drafts (add book form, etc.)

```js
export async function openDB()
export async function cacheBooks(books)
export async function getCachedBooks()       // returns [] if empty
export async function cacheProfile(profile)
export async function getCachedProfile()     // returns null if empty
export async function saveDraft(key, data)
export async function getDraft(key)          // returns null if not found
export async function clearDraft(key)
export async function clearAll()             // on logout
```

**Pattern:** components fetch from backend → on success, write to storage; on mount, read cache first (instant UI), then fetch (refresh).

---

## Data Shapes (from backend)

### Enriched book object
```js
{
  id: string,
  user_id: string,
  status: 'available' | 'scheduled' | 'lent',
  condition: string,
  created_at: string,
  archived: boolean,
  catalog: { id, title, author, cover_url },
  is_saved: boolean,
  borrowed_by: string | null,           // borrower_id of active loan
  return_request_id: string | null,
  request_status: string | null,        // current user's outgoing request status
  request_id: string | null,
}
```

### Profile object
```js
{
  id: string,
  username: string,
  first_name: string,
  last_name: string,
  bio: string,
  avatar_url: string,
  role: 'user' | 'admin' | 'super_admin',
  approval_status: 'pending' | 'approved' | 'rejected',
  created_at: string,
}
```

---

## Dashboard (`/app`) Sections

1. **My Books** — `GET /books` filtered to `user_id === me`; archive/delete/view-requests actions
2. **Incoming Requests** — `GET /requests/incoming`; Accept / Reject buttons per request
3. **Outgoing Requests** — `GET /requests/outgoing`; Cancel button per request
4. **Active Transfers** — `GET /transfers`; Confirm / Complete physical handoff buttons
5. **Active Loans** — books I'm lending or borrowing; Return Request button
6. **Browse** — `BookGrid` with subset of available books; links to `/books`
7. **Feedback** — quick message form → `POST /feedback`

---

## Admin Panel (`/admin`) Tabs

| Tab | Endpoint | Actions |
|-----|----------|---------|
| Stats | `GET /admin/stats` | display counts |
| Approval Queue | `GET /admin/users` filtered pending | Approve / Reject |
| Users | `GET /admin/users` | change role; delete (not self) |
| Books | `GET /admin/books` | archive/unarchive |
| Loans | `GET /admin/loans` | mark returned |
| Requests | `GET /admin/requests` | update status |

---

## Tailwind Color Palette

```
Primary:     emerald-600 / green-700        (brand green)
Background:  stone-50 (light) / slate-900 (dark)
Surface:     white (light) / slate-800 (dark)
Border:      stone-200 (light) / slate-700 (dark)
Text:        slate-800 (light) / slate-200 (dark)
Muted text:  stone-500 (light) / slate-400 (dark)
Danger:      red-600
Warning:     amber-500
```

---

## Rules
- **No TypeScript** — only `.js`/`.jsx`
- **Named + default export** on every component
- **`'use client'`** on any component with hooks or browser APIs
- **No `<form>` tags** — controlled inputs + `onClick`
- **`lib/api.js` only** for backend calls
- **`lib/storage.js` only** for persistence
- **No Supabase SDK imports**
- **No external UI component libraries** (no MUI, no Chakra, no Radix)

---

## Not Yet Wired
- OAuth sign-in button (backend `/auth/oauth/start` exists; UI stub only)
- User reviews tab in admin (endpoint exists; not shown in UI yet)
- Sync status indicator (`GET /sync/status`; not shown in UI yet)

---

## Permanently Out of Scope
- Server-side data fetching for user-specific content (all user data is client-side)
- Realtime subscriptions (Supabase Realtime connects directly from frontend using the public anon key — NOT proxied through FastAPI)
- File upload proxy (avatar + book cover uploads go directly to Supabase Storage using anon key)
- TypeScript migration
