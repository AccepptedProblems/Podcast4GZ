# PodcastW4GZ - Project Overview

## Purpose

PodcastW4GZ is an open-source podcast research and analysis tool built specifically for the Vietnamese podcast ecosystem. It enables researchers, creators, and listeners to discover, analyze, and compare Vietnamese podcasts using data from the Spotify Web API.

### Goals

- Provide a fast, searchable interface for discovering Vietnamese podcasts on Spotify.
- Surface analytics and trends (episode frequency, duration patterns, publishing schedules) that Spotify does not expose natively.
- Enable side-by-side comparison of podcasts for competitive research.
- Build a curated, browsable directory of Vietnamese podcasts organized by category.
- Export data in CSV and JSON formats for external analysis.

### Non-Goals

- This tool does **not** require Spotify user authentication. It uses the Client Credentials flow only, meaning it never accesses private user data (playlists, listening history, etc.).
- This tool does **not** provide playback functionality beyond Spotify's 30-second preview clips.
- This tool does **not** host or redistribute any audio content.

---

## Data Source

All podcast and episode data is sourced from the **Spotify Web API**.

| Aspect              | Detail                                         |
| ------------------- | ---------------------------------------------- |
| Auth flow           | Client Credentials (OAuth 2.0)                 |
| User auth required  | No                                             |
| Market filter       | `VN` (Vietnam) by default, configurable        |
| Rate limits         | Spotify standard (varies, ~30 req/s burst)     |
| Caching strategy    | Server-side with `node-cache`, 15-min TTL      |
| Persistent storage  | SQLite via Prisma (historical snapshots)        |

### Spotify Endpoints Used

| Endpoint                               | Purpose                              |
| -------------------------------------- | ------------------------------------ |
| `GET /v1/search?type=show`             | Search for podcasts                  |
| `GET /v1/shows/{id}`                   | Get podcast metadata                 |
| `GET /v1/shows/{id}/episodes`          | List episodes for a podcast          |
| `GET /v1/episodes/{id}`                | Get episode metadata                 |
| `POST /api/token` (accounts.spotify)   | Obtain access token (Client Creds)   |

---

## Architecture

```
+--------------------------------------------------+
|                    Browser                        |
|                                                   |
|  +--------------------------------------------+  |
|  |           Next.js Frontend (React)          |  |
|  |                                             |  |
|  |  /search   /podcast/[id]   /compare  ...   |  |
|  +--------------------+------------------------+  |
|                       |                           |
+-----------------------|---------------------------+
                        | fetch()
                        v
+--------------------------------------------------+
|              Next.js API Routes (Server)          |
|                                                   |
|  /api/search   /api/shows/[id]   /api/compare    |
|  /api/episodes/[id]   /api/analytics/[id]         |
|  /api/export                                      |
|                                                   |
|  +-------------+    +-------------------------+   |
|  | node-cache  |    | Spotify Client (lib/)   |   |
|  | (in-memory) |    |  - Token management     |   |
|  +------+------+    |  - Request helpers      |   |
|         |           |  - Type definitions     |   |
|         |           +------------+------------+   |
|         |                        |                |
|  +------v------+                 |                |
|  |   SQLite    |                 | HTTPS          |
|  |  (Prisma)   |                 |                |
|  +-------------+                 |                |
+----------------------------------|----------------+
                                   v
                      +------------------------+
                      |   Spotify Web API      |
                      |   api.spotify.com      |
                      +------------------------+
```

### Data Flow

1. User performs an action in the browser (search, navigate, compare).
2. The React frontend calls the internal Next.js API route via `fetch()`.
3. The API route checks `node-cache` for a cached response.
4. On cache miss, the Spotify client acquires or reuses a Client Credentials token and calls the Spotify Web API.
5. The response is cached in `node-cache` (15-minute TTL) and optionally persisted to SQLite for historical analytics.
6. The API route returns JSON to the frontend, which renders the data.

---

## Phased Rollout Plan

### Phase 1 - MVP (Target: Q2 2026)

The minimum viable product delivers core search, browse, and comparison functionality.

| Feature            | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| Podcast Search     | Full-text search with market filter (`VN`), paginated results |
| Podcast Detail     | Show metadata, description, cover art, total episodes         |
| Episode List       | Paginated episode list for a given podcast                    |
| Episode Detail     | Episode metadata, description, duration, 30s audio preview    |
| Podcast Comparison | Side-by-side comparison of up to 4 podcasts                   |
| Responsive UI      | Mobile-first design with Tailwind CSS + shadcn/ui             |

**Deliverables:**
- Fully functional Next.js application deployable to Vercel.
- Internal API routes wrapping Spotify endpoints.
- Server-side caching with `node-cache`.
- Search with fuzzy matching via `Fuse.js`.

### Phase 2 - Analytics (Target: Q3 2026)

Add analytics and data export capabilities built on top of historically cached data.

| Feature              | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| Analytics Dashboard  | Charts for episode frequency, average duration, publish days    |
| Duration Trends      | Line chart of episode duration over time                        |
| Publishing Patterns  | Heatmap of publish day-of-week and time-of-day                  |
| Data Export           | Download podcast/episode data as CSV or JSON                    |

**Deliverables:**
- SQLite database storing episode snapshots over time.
- Recharts-powered analytics page.
- Export API route returning CSV or JSON files.

### Phase 3 - Directory (Target: Q4 2026)

Build a curated, browsable directory of Vietnamese podcasts.

| Feature              | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| Category Browsing    | Browse podcasts by genre/category                               |
| Curated Collections  | Editorially curated lists (e.g., "Top Tech Podcasts in VN")    |
| Trending             | Surface podcasts with rising episode counts or new launches      |
| Full-Text Directory  | Searchable directory with advanced filters (language, category)  |

**Deliverables:**
- Directory page with category navigation.
- Admin seeding script for curated collections.
- Trending algorithm based on episode publish velocity.
