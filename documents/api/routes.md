---
openspec: 0.1.0
kind: api
metadata:
  name: API Route Specification
  description: Complete specification for all PodcastW4GZ API routes, including request/response schemas, query parameters, error handling, and caching behavior.
  status: planned
  base_url: /api
  auth: none (public routes; Spotify auth is server-side only)
  updated: 2026-02-27
---

# API Route Specification

## Overview

PodcastW4GZ exposes a set of Next.js API routes under `/api/*` that act as a proxy to the Spotify Web API. All routes are public (no user authentication required). Spotify authentication is handled server-side using the Client Credentials flow. Responses are cached server-side to reduce Spotify API calls and improve performance.

---

## Base Configuration

```
Base URL:        /api
Content-Type:    application/json
Authentication:  None (public)
Rate Limiting:   Inherited from Spotify (429 responses proxied with retry headers)
```

---

## Routes

### 1. GET /api/search

Search for podcasts or episodes via the Spotify Web API.

**Path:** `/api/search`
**Method:** `GET`
**File:** `src/app/api/search/route.ts`

#### Query Parameters

| Parameter | Type    | Required | Default | Constraints       | Description                           |
|-----------|---------|----------|---------|-------------------|---------------------------------------|
| `q`       | string  | Yes      | -       | min 1 char        | Search query string                   |
| `type`    | string  | No       | `show`  | `show`, `episode` | Type of content to search             |
| `market`  | string  | No       | `VN`    | ISO 3166-1 alpha-2| Spotify market code                   |
| `offset`  | integer | No       | `0`     | 0-1000            | Pagination offset                     |
| `limit`   | integer | No       | `20`    | 1-50              | Number of results per page            |

#### Success Response (200)

```typescript
// When type=show
{
  "shows": {
    "items": SpotifyShow[],
    "total": number,
    "offset": number,
    "limit": number,
    "next": string | null,
    "previous": string | null
  }
}

// When type=episode
{
  "episodes": {
    "items": SpotifyEpisode[],
    "total": number,
    "offset": number,
    "limit": number,
    "next": string | null,
    "previous": string | null
  }
}
```

#### Caching

```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=1800
```

- Results cached for 1 hour server-side.
- Stale responses served for up to 30 additional minutes while revalidating.
- Cache key: `search:{type}:{q}:{market}:{offset}:{limit}`

#### Example

```
GET /api/search?q=technology&type=show&market=VN&offset=0&limit=20
```

---

### 2. GET /api/shows/[id]

Get full metadata for a single podcast (show).

**Path:** `/api/shows/[id]`
**Method:** `GET`
**File:** `src/app/api/shows/[id]/route.ts`

#### Path Parameters

| Parameter | Type   | Required | Description        |
|-----------|--------|----------|--------------------|
| `id`      | string | Yes      | Spotify show ID    |

#### Query Parameters

| Parameter | Type   | Required | Default | Description           |
|-----------|--------|----------|---------|-----------------------|
| `market`  | string | No       | `VN`    | Spotify market code   |

#### Success Response (200)

```typescript
{
  "id": string,
  "name": string,
  "description": string,
  "html_description": string,
  "publisher": string,
  "languages": string[],
  "total_episodes": number,
  "media_type": string,
  "explicit": boolean,
  "images": Array<{
    "url": string,
    "height": number,
    "width": number
  }>,
  "available_markets": string[],
  "is_externally_hosted": boolean,
  "copyrights": Array<{
    "text": string,
    "type": string
  }>,
  "external_urls": {
    "spotify": string
  },
  "uri": string
}
```

#### Caching

```
Cache-Control: public, s-maxage=86400, stale-while-revalidate=3600
```

- Cached for 24 hours. Show metadata changes infrequently.
- Cache key: `show:{id}:{market}`

#### Example

```
GET /api/shows/4rOoJ6Egrf8K2IrywzwOMk
```

---

### 3. GET /api/shows/[id]/episodes

Get the episode list for a specific podcast, paginated.

**Path:** `/api/shows/[id]/episodes`
**Method:** `GET`
**File:** `src/app/api/shows/[id]/episodes/route.ts`

#### Path Parameters

| Parameter | Type   | Required | Description        |
|-----------|--------|----------|--------------------|
| `id`      | string | Yes      | Spotify show ID    |

#### Query Parameters

| Parameter | Type    | Required | Default | Constraints | Description             |
|-----------|---------|----------|---------|-------------|-------------------------|
| `market`  | string  | No       | `VN`    | ISO 3166-1  | Spotify market code     |
| `offset`  | integer | No       | `0`     | 0-unlimited | Pagination offset       |
| `limit`   | integer | No       | `20`    | 1-50        | Episodes per page       |

#### Success Response (200)

```typescript
{
  "items": SpotifyEpisode[],
  "total": number,
  "offset": number,
  "limit": number,
  "next": string | null,
  "previous": string | null
}
```

Each `SpotifyEpisode` contains:

```typescript
{
  "id": string,
  "name": string,
  "description": string,
  "html_description": string,
  "duration_ms": number,
  "release_date": string,
  "release_date_precision": "year" | "month" | "day",
  "languages": string[],
  "explicit": boolean,
  "audio_preview_url": string | null,
  "images": Array<{ "url": string, "height": number, "width": number }>,
  "is_playable": boolean,
  "is_externally_hosted": boolean,
  "external_urls": { "spotify": string },
  "uri": string
}
```

#### Caching

```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=1800
```

- Cached for 1 hour. New episodes may appear.
- Cache key: `show-episodes:{id}:{market}:{offset}:{limit}`

#### Example

```
GET /api/shows/4rOoJ6Egrf8K2IrywzwOMk/episodes?offset=0&limit=20
```

---

### 4. GET /api/episodes/[id]

Get full metadata for a single episode.

**Path:** `/api/episodes/[id]`
**Method:** `GET`
**File:** `src/app/api/episodes/[id]/route.ts`

#### Path Parameters

| Parameter | Type   | Required | Description          |
|-----------|--------|----------|----------------------|
| `id`      | string | Yes      | Spotify episode ID   |

#### Query Parameters

| Parameter | Type   | Required | Default | Description           |
|-----------|--------|----------|---------|-----------------------|
| `market`  | string | No       | `VN`    | Spotify market code   |

#### Success Response (200)

```typescript
{
  "id": string,
  "name": string,
  "description": string,
  "html_description": string,
  "duration_ms": number,
  "release_date": string,
  "release_date_precision": "year" | "month" | "day",
  "languages": string[],
  "explicit": boolean,
  "audio_preview_url": string | null,
  "images": Array<{ "url": string, "height": number, "width": number }>,
  "is_playable": boolean,
  "is_externally_hosted": boolean,
  "show": {
    "id": string,
    "name": string,
    "publisher": string,
    "images": Array<{ "url": string, "height": number, "width": number }>,
    "external_urls": { "spotify": string }
  },
  "external_urls": { "spotify": string },
  "uri": string
}
```

#### Caching

```
Cache-Control: public, s-maxage=86400, stale-while-revalidate=3600
```

- Cached for 24 hours. Episode metadata rarely changes.
- Cache key: `episode:{id}:{market}`

#### Example

```
GET /api/episodes/512ojhOuo1ktJprKbVcKyQ
```

---

### 5. GET /api/compare

Get comparison data for multiple podcasts (up to 4).

**Path:** `/api/compare`
**Method:** `GET`
**File:** `src/app/api/compare/route.ts`

#### Query Parameters

| Parameter | Type   | Required | Default | Constraints              | Description                            |
|-----------|--------|----------|---------|--------------------------|----------------------------------------|
| `ids`     | string | Yes      | -       | Comma-separated, max 4   | Spotify show IDs to compare            |
| `market`  | string | No       | `VN`    | ISO 3166-1 alpha-2       | Spotify market code                    |

#### Success Response (200)

```typescript
{
  "shows": Array<{
    "id": string,
    "name": string,
    "publisher": string,
    "images": Array<{ "url": string, "height": number, "width": number }>,
    "totalEpisodes": number,
    "avgDurationMs": number,
    "totalContentHours": number,
    "avgFrequencyDays": number,
    "schedulePattern": "daily" | "weekly" | "biweekly" | "monthly" | "irregular",
    "languages": string[],
    "explicit": boolean,
    "status": "active" | "on_hiatus" | "ended",
    "firstEpisodeDate": string,
    "lastEpisodeDate": string,
    "external_urls": { "spotify": string }
  }>
}
```

#### Implementation Details

This route performs multiple Spotify API calls internally:
1. `GET /shows?ids={ids}` -- Batch fetch show metadata (Spotify supports up to 50 IDs).
2. For each show: `GET /shows/{id}/episodes?limit=50` -- Fetch all episodes (may require multiple pages) to compute analytics.

Analytics (avgDuration, totalContentHours, frequency, status, etc.) are computed server-side from the raw episode data.

#### Caching

```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=1800
```

- Cached for 1 hour.
- Cache key: `compare:{sorted_ids}:{market}`
- IDs are sorted before cache key generation to ensure consistent keys regardless of input order.

#### Example

```
GET /api/compare?ids=4rOoJ6Egrf8K2IrywzwOMk,1HGw3J4MCjbMoHyz5VbWDv&market=VN
```

---

### 6. GET /api/analytics/[id]

Get computed analytics for a single podcast.

**Path:** `/api/analytics/[id]`
**Method:** `GET`
**File:** `src/app/api/analytics/[id]/route.ts`

#### Path Parameters

| Parameter | Type   | Required | Description        |
|-----------|--------|----------|--------------------|
| `id`      | string | Yes      | Spotify show ID    |

#### Query Parameters

| Parameter | Type   | Required | Default | Description           |
|-----------|--------|----------|---------|-----------------------|
| `market`  | string | No       | `VN`    | Spotify market code   |

#### Success Response (200)

```typescript
{
  "showId": string,
  "showName": string,
  "computedAt": string, // ISO 8601

  "summary": {
    "totalEpisodes": number,
    "avgDurationMs": number,
    "totalContentHours": number,
    "status": "active" | "on_hiatus" | "ended",
    "durationTrend": "increasing" | "decreasing" | "stable"
  },

  "episodes": {
    "longest": { "id": string, "name": string, "durationMs": number },
    "shortest": { "id": string, "name": string, "durationMs": number },
    "firstEpisodeDate": string,
    "lastEpisodeDate": string
  },

  "frequency": {
    "avgDaysBetweenEpisodes": number,
    "schedulePattern": "daily" | "weekly" | "biweekly" | "monthly" | "irregular",
    "longestGapDays": number,
    "longestGapStart": string,
    "longestGapEnd": string
  },

  "charts": {
    "durationOverTime": Array<{
      "date": string,
      "durationMin": number,
      "episodeName": string
    }>,
    "episodesPerMonth": Array<{
      "month": string, // "YYYY-MM"
      "count": number
    }>,
    "episodesByDayOfWeek": Array<{
      "day": string, // "Mon", "Tue", etc.
      "dayIndex": number, // 0=Mon, 6=Sun
      "count": number
    }>
  }
}
```

#### Implementation Details

1. Fetches all episodes for the show (paginated, may require multiple requests to Spotify).
2. Computes all analytics server-side from episode `duration_ms` and `release_date` fields.
3. Status is determined by the last episode date:
   - `active`: last episode < 30 days ago
   - `on_hiatus`: last episode 30-180 days ago
   - `ended`: last episode > 180 days ago
4. Duration trend is computed via linear regression on the last 20 episodes.

#### Caching

```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=1800
```

- Cached for 1 hour. Analytics depend on current episode data.
- Cache key: `analytics:{id}:{market}`

#### Example

```
GET /api/analytics/4rOoJ6Egrf8K2IrywzwOMk
```

---

### 7. GET /api/export

Export podcast data as CSV or JSON file download.

**Path:** `/api/export`
**Method:** `GET`
**File:** `src/app/api/export/route.ts`

#### Query Parameters

| Parameter | Type   | Required | Default | Constraints     | Description                       |
|-----------|--------|----------|---------|-----------------|-----------------------------------|
| `id`      | string | Yes      | -       | Spotify show ID | Show to export data for           |
| `format`  | string | No       | `csv`   | `csv`, `json`   | Export file format                |
| `type`    | string | No       | `episodes` | `episodes`, `analytics`, `compare` | Data type to export |
| `ids`     | string | No       | -       | Comma-separated | For compare export (show IDs)     |
| `market`  | string | No       | `VN`    | ISO 3166-1      | Spotify market code               |

#### Success Response (200)

**CSV format:**

```
Content-Type: text/csv
Content-Disposition: attachment; filename="podcastw4gz-{show_name}-episodes-{date}.csv"
```

```csv
Episode Name,Release Date,Duration (min),Duration (ms),Explicit,Language,Spotify URL
"Episode Title Here","2026-02-20",42.25,2535000,false,"vi","https://open.spotify.com/episode/..."
```

**JSON format:**

```
Content-Type: application/json
Content-Disposition: attachment; filename="podcastw4gz-{show_name}-episodes-{date}.json"
```

```json
{
  "exported": "2026-02-27T10:30:00Z",
  "source": "PodcastW4GZ",
  "show": {
    "id": "...",
    "name": "..."
  },
  "episodes": [
    {
      "name": "Episode Title",
      "releaseDate": "2026-02-20",
      "durationMin": 42.25,
      "durationMs": 2535000,
      "explicit": false,
      "language": "vi",
      "spotifyUrl": "https://open.spotify.com/episode/..."
    }
  ]
}
```

#### Caching

```
Cache-Control: no-cache
```

No caching for export routes. Each request generates a fresh file.

#### Example

```
GET /api/export?id=4rOoJ6Egrf8K2IrywzwOMk&format=csv&type=episodes
```

---

## Error Responses

All error responses follow a consistent schema:

```typescript
interface ErrorResponse {
  error: {
    status: number;
    message: string;
    code: string;
    details?: string;
  };
}
```

### 400 Bad Request

Returned when query parameters are invalid or missing.

```json
{
  "error": {
    "status": 400,
    "message": "Missing required parameter: q",
    "code": "INVALID_REQUEST"
  }
}
```

Common causes:
- Missing required parameters (`q` for search, `id` for show/episode)
- Invalid parameter values (non-numeric offset, limit out of range)
- Too many IDs in compare request (> 4)
- Invalid format value in export

### 404 Not Found

Returned when a specific resource does not exist.

```json
{
  "error": {
    "status": 404,
    "message": "Show not found: abc123invalid",
    "code": "NOT_FOUND"
  }
}
```

Common causes:
- Invalid Spotify show ID
- Invalid Spotify episode ID
- Show/episode not available in the specified market

### 429 Too Many Requests

Proxied from Spotify when rate limits are exceeded.

```json
{
  "error": {
    "status": 429,
    "message": "Rate limit exceeded. Please retry after 30 seconds.",
    "code": "RATE_LIMITED",
    "details": "Spotify API rate limit reached"
  }
}
```

Response headers:
```
Retry-After: 30
```

The API route attempts automatic retry with exponential backoff before returning 429 to the client.

### 500 Internal Server Error

Returned for unexpected server-side errors.

```json
{
  "error": {
    "status": 500,
    "message": "An unexpected error occurred",
    "code": "INTERNAL_ERROR"
  }
}
```

Common causes:
- Spotify API is down or unreachable
- Token refresh failure
- Unexpected response format from Spotify

### 503 Service Unavailable

Returned when the Spotify API is unreachable.

```json
{
  "error": {
    "status": 503,
    "message": "Spotify API is currently unavailable. Please try again later.",
    "code": "SERVICE_UNAVAILABLE"
  }
}
```

---

## Caching Strategy Summary

| Route                        | TTL     | Stale-While-Revalidate | Cache Key Pattern                    |
|------------------------------|---------|------------------------|--------------------------------------|
| `GET /api/search`            | 1 hour  | 30 min                 | `search:{type}:{q}:{market}:{offset}:{limit}` |
| `GET /api/shows/[id]`        | 24 hours| 1 hour                 | `show:{id}:{market}`                 |
| `GET /api/shows/[id]/episodes`| 1 hour | 30 min                 | `show-episodes:{id}:{market}:{offset}:{limit}` |
| `GET /api/episodes/[id]`     | 24 hours| 1 hour                 | `episode:{id}:{market}`              |
| `GET /api/compare`           | 1 hour  | 30 min                 | `compare:{sorted_ids}:{market}`      |
| `GET /api/analytics/[id]`    | 1 hour  | 30 min                 | `analytics:{id}:{market}`            |
| `GET /api/export`            | None    | None                   | N/A                                  |

Cache implementation uses `node-cache` in-memory cache on the server. Cache is invalidated on server restart.

---

## Request/Response Headers

### Request Headers (from client)

```
Content-Type: application/json (for POST, not currently used)
Accept: application/json
```

### Response Headers (all routes)

```
Content-Type: application/json
Cache-Control: <see per-route specification>
X-Powered-By: PodcastW4GZ
X-Request-Id: <uuid>
```

### CORS

CORS is not explicitly configured since all API routes are same-origin (Next.js serves both frontend and API). If external access is needed in the future, CORS headers should be added.

---

## Rate Limiting Notes

PodcastW4GZ does not implement its own rate limiting for end users. Rate limiting is inherited from the Spotify Web API:

1. Spotify enforces per-app rate limits based on the Client Credentials token.
2. When a 429 is received from Spotify, the API route:
   - Reads the `Retry-After` header value.
   - Waits the specified duration (up to a maximum of 60 seconds).
   - Retries the request once.
   - If the retry also fails, returns 429 to the client.
3. The `Retry-After` header from Spotify is forwarded to the client response.

Future enhancement: Implement a request queue with configurable concurrency to smooth out bursts.

---

## API Route File Structure

```
src/app/api/
├── search/
│   └── route.ts              # GET /api/search
├── shows/
│   └── [id]/
│       ├── route.ts           # GET /api/shows/[id]
│       └── episodes/
│           └── route.ts       # GET /api/shows/[id]/episodes
├── episodes/
│   └── [id]/
│       └── route.ts           # GET /api/episodes/[id]
├── compare/
│   └── route.ts              # GET /api/compare
├── analytics/
│   └── [id]/
│       └── route.ts           # GET /api/analytics/[id]
└── export/
    └── route.ts              # GET /api/export
```
