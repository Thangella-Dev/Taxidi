# 02 - Taxiro Codebase Size And Technology Stack

**Date:** 23 July 2026

## Codebase Size

Measured locally excluding `node_modules`, `.next`, `.git`, coverage, dist, and build folders.

| Category | Files | Lines |
|---|---:|---:|
| Frontend app routes | 23 | 9,822 |
| Frontend components | 41 | 4,279 |
| Client/server helpers | 19 | 1,883 |
| Type definitions | 1 | 406 |
| Database migrations | 40 | 5,816 |
| Tests | 9 | 372 |
| Scripts/tooling | 2 | 47 |
| Documentation | 65 | 5,095 |
| Project config/assets | 14 | 12,877 |
| **Total** | **214** | **40,597** |

## Lines By Extension

| Extension | Files | Lines |
|---|---:|---:|
| `.tsx` | 57 | 12,309 |
| `.ts` | 38 | 3,291 |
| `.sql` | 41 | 9,170 |
| `.md` | 66 | 5,907 |
| `.json` | 6 | 8,628 |
| `.css` | 1 | 1,203 |
| `.mjs` | 4 | 69 |
| `.js` | 1 | 20 |
| **Total** | **214** | **40,597** |

## Current Technology Stack

### Frontend

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Local shadcn-style UI primitives
- Lucide React icons
- Leaflet and React Leaflet

### Backend / Database

- Supabase Auth
- Supabase PostgreSQL
- Supabase Realtime
- Supabase Storage
- PostGIS
- Row Level Security policies
- SQL migrations
- Supabase RPC functions

### Maps And Routing

- OpenStreetMap tiles
- Nominatim search/reverse geocoding
- OSRM route summary/path
- Coordinate-based fallback ETA/distance

### Deployment / Tooling

- Vercel
- GitHub
- ESLint
- TypeScript compiler
- Vitest
- Playwright foundation
- Custom migration validator