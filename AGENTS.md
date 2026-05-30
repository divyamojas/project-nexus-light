# Agents Guide — project-nexus-light (Leaflet Frontend)

## Purpose
Next.js 14 App Router frontend for Leaflet. Talks exclusively to FastAPI backend.

## Out of Scope
- Supabase SDK imports (no direct Supabase calls)
- TypeScript files (.ts/.tsx)
- External UI component libraries (no MUI, no Chakra, no Radix)
- Business logic (owned by backend)
- Docker orchestration

## Key Files
| File | Role |
|------|------|
| `app/layout.js` | Root layout: AuthProvider, AppChrome, ErrorBoundary |
| `middleware.js` | Cookie-based route protection (edge) |
| `components/AuthProvider.js` | AuthContext: user, profile, role, auth actions |
| `components/RouteGate.js` | Client-side access control + redirect |
| `lib/api.js` | **Only** way to call backend |
| `lib/auth.js` | Token management: setToken, clearToken, login, logout |
| `lib/storage.js` | IndexedDB cache — **only** persistence boundary |

## Run (from root via Docker)
```bash
cd .. && ./start.sh          # starts frontend + proxy
./start.sh --logs=app        # tail frontend logs
./start.sh --attach          # shell into container
```

## Test
```bash
node --test tests/**/*.test.mjs
```

## Rules
- `'use client'` on any component using hooks or browser APIs
- Every component: named export + default export
- No `<form>` tags — controlled inputs + onClick
- `lib/api.js` only for backend calls
- `lib/storage.js` only for persistence
- No Supabase SDK imports anywhere
