---
openspec: 0.1.0
kind: api
metadata:
  name: Spotify API Integration
  description: Detailed specification of the Spotify Web API integration, including Client Credentials authentication, token management, rate limit handling, request/response transformation, error mapping, and TypeScript type definitions.
  status: planned
  updated: 2026-02-27
dependencies:
  env_vars:
    - SPOTIFY_CLIENT_ID
    - SPOTIFY_CLIENT_SECRET
  packages: []
  files:
    - src/lib/spotify/client.ts
    - src/lib/spotify/auth.ts
    - src/lib/spotify/types.ts
    - src/lib/spotify/cache.ts
    - src/lib/spotify/errors.ts
---

# Spotify API Integration

## Overview

PodcastW4GZ uses the Spotify Web API to access public podcast data. The integration is entirely server-side -- the Spotify `client_secret` never reaches the browser. Next.js API routes proxy all requests through a centralized Spotify client that handles authentication, caching, rate limiting, and error mapping.

---

## Architecture

```
Browser (Client)
     |
     | fetch('/api/search?q=...')
     v
Next.js API Route (src/app/api/search/route.ts)
     |
     | spotifyClient.search(query, options)
     v
SpotifyClient (src/lib/spotify/client.ts)
     |
     |  1. Check cache -> hit? return cached
     |  2. Get valid token (auth.ts)
     |  3. Make HTTP request to Spotify
     |  4. Handle errors / retry on 429
     |  5. Transform response
     |  6. Cache result
     |  7. Return to API route
     v
Spotify Web API (https://api.spotify.com/v1/...)
```

---

## 1. Client Credentials Flow

### Overview

The Client Credentials flow is used to obtain an access token that is not associated with any user. It grants access to all public endpoints (search, shows, episodes).

**No user login or OAuth redirect is involved.**

### Implementation

**File:** `src/lib/spotify/auth.ts`

```typescript
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number; // seconds, typically 3600
}

interface TokenState {
  accessToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

let tokenState: TokenState | null = null;

export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5-minute buffer)
  if (tokenState && Date.now() < tokenState.expiresAt - 5 * 60 * 1000) {
    return tokenState.accessToken;
  }

  // Request new token
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new SpotifyAuthError('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new SpotifyAuthError(
      `Token request failed: ${error.error_description || response.statusText}`
    );
  }

  const data: SpotifyTokenResponse = await response.json();

  tokenState = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return tokenState.accessToken;
}
```

### Token Request

```
POST https://accounts.spotify.com/api/token
Authorization: Basic <base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
```

### Token Response

```json
{
  "access_token": "BQDj...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Token Lifecycle

| Event                   | Action                                                      |
|-------------------------|-------------------------------------------------------------|
| First API request       | Fetch new token                                             |
| Token in memory & valid | Reuse cached token (skip fetch)                             |
| Token expires in < 5min | Proactively refresh before expiry                           |
| Token expired           | Fetch new token before making Spotify request               |
| Token request fails     | Throw `SpotifyAuthError`, return 500 to client              |
| Server restart          | Token state lost, fetched fresh on next request             |

---

## 2. Token Management

### Auto-Refresh Strategy

The token is stored in a module-level variable (singleton per serverless instance). Before every Spotify API call, the client checks:

1. Is there a cached token?
2. Is the token still valid (expires more than 5 minutes from now)?
3. If no or expired: fetch a new token.

The 5-minute buffer prevents edge cases where a token expires mid-request.

### Concurrency Handling

In serverless environments (Vercel), multiple instances may each hold their own token. This is acceptable because:
- The Client Credentials flow has no request limit for token generation.
- Each token is valid for 1 hour.
- Multiple valid tokens can coexist.

### Serverless Cold Start

On cold start, `tokenState` is `null`. The first request triggers a token fetch, adding approximately 100-300ms latency. Subsequent requests in the same instance reuse the cached token.

---

## 3. Rate Limit Handling

### Spotify Rate Limit Behavior

Spotify enforces rate limits per app (based on `client_id`). When exceeded:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
```

The `Retry-After` header contains the number of seconds to wait.

### Exponential Backoff Implementation

**File:** `src/lib/spotify/client.ts`

```typescript
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 0
): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 429 && retries < MAX_RETRIES) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
    const delay = Math.min(
      retryAfter * 1000,
      BASE_DELAY_MS * Math.pow(2, retries) // exponential backoff
    );

    // Use the larger of Retry-After and exponential backoff
    const waitTime = Math.max(delay, retryAfter * 1000);

    // Cap at 60 seconds
    const cappedWait = Math.min(waitTime, 60_000);

    await sleep(cappedWait);
    return fetchWithRetry(url, options, retries + 1);
  }

  return response;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### Retry Strategy

| Retry # | Base Delay | Max Wait (capped) | Notes                              |
|---------|------------|--------------------|------------------------------------|
| 0       | -          | -                  | Initial request                    |
| 1       | 1s         | 60s                | Wait max(1s, Retry-After)          |
| 2       | 2s         | 60s                | Wait max(2s, Retry-After)          |
| 3       | 4s         | 60s                | Wait max(4s, Retry-After)          |
| 4+      | -          | -                  | Give up, return 429 to client      |

---

## 4. Spotify Endpoints Used

### 4.1 Search

```
GET https://api.spotify.com/v1/search
Authorization: Bearer {access_token}
```

| Parameter | Type   | Required | Description                     |
|-----------|--------|----------|---------------------------------|
| `q`       | string | Yes      | Search query                    |
| `type`    | string | Yes      | `show` or `episode`             |
| `market`  | string | No       | ISO 3166-1 alpha-2 market code  |
| `limit`   | number | No       | 1-50 (default: 20)              |
| `offset`  | number | No       | 0-1000 (default: 0)             |

**Response (type=show):**
```typescript
{
  shows: {
    href: string;
    items: SpotifyShow[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  }
}
```

**Response (type=episode):**
```typescript
{
  episodes: {
    href: string;
    items: SpotifyEpisode[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
  }
}
```

### 4.2 Get Show

```
GET https://api.spotify.com/v1/shows/{id}
Authorization: Bearer {access_token}
```

| Parameter | Type   | In    | Required | Description        |
|-----------|--------|-------|----------|--------------------|
| `id`      | string | path  | Yes      | Spotify show ID    |
| `market`  | string | query | No       | Market code        |

**Response:** `SpotifyShow`

### 4.3 Get Several Shows

```
GET https://api.spotify.com/v1/shows
Authorization: Bearer {access_token}
```

| Parameter | Type   | Required | Description                      |
|-----------|--------|----------|----------------------------------|
| `ids`     | string | Yes      | Comma-separated IDs (max 50)     |
| `market`  | string | No       | Market code                      |

**Response:**
```typescript
{
  shows: SpotifyShow[]
}
```

### 4.4 Get Show Episodes

```
GET https://api.spotify.com/v1/shows/{id}/episodes
Authorization: Bearer {access_token}
```

| Parameter | Type   | In    | Required | Description        |
|-----------|--------|-------|----------|--------------------|
| `id`      | string | path  | Yes      | Spotify show ID    |
| `market`  | string | query | No       | Market code        |
| `limit`   | number | query | No       | 1-50 (default: 20) |
| `offset`  | number | query | No       | 0+ (default: 0)    |

**Response:**
```typescript
{
  href: string;
  items: SpotifyEpisode[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}
```

### 4.5 Get Episode

```
GET https://api.spotify.com/v1/episodes/{id}
Authorization: Bearer {access_token}
```

| Parameter | Type   | In    | Required | Description          |
|-----------|--------|-------|----------|----------------------|
| `id`      | string | path  | Yes      | Spotify episode ID   |
| `market`  | string | query | No       | Market code          |

**Response:** `SpotifyEpisode` (with nested `show` object)

### 4.6 Get Several Episodes

```
GET https://api.spotify.com/v1/episodes
Authorization: Bearer {access_token}
```

| Parameter | Type   | Required | Description                      |
|-----------|--------|----------|----------------------------------|
| `ids`     | string | Yes      | Comma-separated IDs (max 50)     |
| `market`  | string | No       | Market code                      |

**Response:**
```typescript
{
  episodes: SpotifyEpisode[]
}
```

### 4.7 Get Available Markets

```
GET https://api.spotify.com/v1/markets
Authorization: Bearer {access_token}
```

**Response:**
```typescript
{
  markets: string[] // ["AD", "AE", ..., "VN", ...]
}
```

---

## 5. Request/Response Transformation

### Spotify Client Methods

**File:** `src/lib/spotify/client.ts`

```typescript
class SpotifyClient {
  // Search
  async search(
    query: string,
    options: { type?: 'show' | 'episode'; market?: string; limit?: number; offset?: number }
  ): Promise<SearchResponse>;

  // Shows
  async getShow(id: string, market?: string): Promise<SpotifyShow>;
  async getShows(ids: string[], market?: string): Promise<SpotifyShow[]>;
  async getShowEpisodes(
    id: string,
    options: { market?: string; limit?: number; offset?: number }
  ): Promise<PaginatedEpisodes>;

  // Episodes
  async getEpisode(id: string, market?: string): Promise<SpotifyEpisode>;
  async getEpisodes(ids: string[], market?: string): Promise<SpotifyEpisode[]>;

  // Markets
  async getMarkets(): Promise<string[]>;
}
```

### Response Transformation

Spotify responses are passed through largely unchanged to preserve the full data. However, the following transformations are applied:

1. **Image selection**: The response includes all image sizes. The client picks the optimal size:
   - Card thumbnail: 64x64 image
   - Grid card: 300x300 image
   - Detail header: 640x640 image

2. **Duration formatting**: `duration_ms` is kept as-is in the API response. Formatting (to `mm:ss` or `X hours Y minutes`) happens on the client side.

3. **Date formatting**: `release_date` is kept as-is (YYYY, YYYY-MM, or YYYY-MM-DD). Formatting happens client-side using `date-fns`.

4. **Description sanitization**: `html_description` is sanitized server-side to remove potentially unsafe HTML before sending to the client:

```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeDescription(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}
```

5. **Null handling**: Nullable fields (`audio_preview_url`, deprecated fields) are preserved as `null` in responses.

---

## 6. Error Mapping

Spotify API errors are mapped to PodcastW4GZ error responses for consistent client-side handling.

**File:** `src/lib/spotify/errors.ts`

### Error Classes

```typescript
export class SpotifyError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public spotifyError?: string
  ) {
    super(message);
    this.name = 'SpotifyError';
  }
}

export class SpotifyAuthError extends SpotifyError {
  constructor(message: string) {
    super(message, 500, 'AUTH_FAILURE');
    this.name = 'SpotifyAuthError';
  }
}

export class SpotifyNotFoundError extends SpotifyError {
  constructor(resourceType: string, id: string) {
    super(`${resourceType} not found: ${id}`, 404, 'NOT_FOUND');
    this.name = 'SpotifyNotFoundError';
  }
}

export class SpotifyRateLimitError extends SpotifyError {
  constructor(public retryAfter: number) {
    super(`Rate limited. Retry after ${retryAfter}s`, 429, 'RATE_LIMITED');
    this.name = 'SpotifyRateLimitError';
  }
}
```

### Error Mapping Table

| Spotify Status | Spotify Error         | PodcastW4GZ Status | PodcastW4GZ Code      | Notes                          |
|---------------|----------------------|--------------------|-----------------------|--------------------------------|
| 400           | Bad Request          | 400                | `INVALID_REQUEST`     | Invalid query params           |
| 401           | Unauthorized         | 500                | `AUTH_FAILURE`        | Token expired/invalid, retry   |
| 403           | Forbidden            | 403                | `FORBIDDEN`           | Content restricted in market   |
| 404           | Not Found            | 404                | `NOT_FOUND`           | Invalid show/episode ID        |
| 429           | Too Many Requests    | 429                | `RATE_LIMITED`        | After retry exhaustion         |
| 500           | Internal Server Error| 502                | `UPSTREAM_ERROR`      | Spotify server error           |
| 502           | Bad Gateway          | 502                | `UPSTREAM_ERROR`      | Spotify infrastructure issue   |
| 503           | Service Unavailable  | 503                | `SERVICE_UNAVAILABLE` | Spotify is down                |
| Network error | -                    | 503                | `SERVICE_UNAVAILABLE` | DNS/connection failure         |

### Error Handler in API Routes

```typescript
import { NextResponse } from 'next/server';
import { SpotifyError, SpotifyRateLimitError } from '@/lib/spotify/errors';

function handleSpotifyError(error: unknown): NextResponse {
  if (error instanceof SpotifyRateLimitError) {
    return NextResponse.json(
      {
        error: {
          status: 429,
          message: `Rate limit exceeded. Please retry after ${error.retryAfter} seconds.`,
          code: 'RATE_LIMITED',
        },
      },
      {
        status: 429,
        headers: { 'Retry-After': String(error.retryAfter) },
      }
    );
  }

  if (error instanceof SpotifyError) {
    return NextResponse.json(
      {
        error: {
          status: error.statusCode,
          message: error.message,
          code: error.spotifyError || 'SPOTIFY_ERROR',
        },
      },
      { status: error.statusCode }
    );
  }

  // Unknown error
  console.error('Unexpected error:', error);
  return NextResponse.json(
    {
      error: {
        status: 500,
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
    },
    { status: 500 }
  );
}
```

---

## 7. TypeScript Types

**File:** `src/lib/spotify/types.ts`

### SpotifyImage

```typescript
export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}
```

### SpotifyCopyright

```typescript
export interface SpotifyCopyright {
  text: string;
  type: 'C' | 'P'; // C = copyright, P = performance copyright
}
```

### SpotifyExternalUrls

```typescript
export interface SpotifyExternalUrls {
  spotify: string;
}
```

### SpotifyShow

```typescript
export interface SpotifyShow {
  id: string;
  name: string;
  description: string;
  html_description: string;
  publisher: string;
  languages: string[];
  total_episodes: number;
  media_type: string;
  explicit: boolean;
  images: SpotifyImage[];
  available_markets: string[];
  is_externally_hosted: boolean;
  copyrights: SpotifyCopyright[];
  external_urls: SpotifyExternalUrls;
  uri: string;
  href: string;
  type: 'show';
}
```

### SpotifySimplifiedShow

```typescript
export interface SpotifySimplifiedShow {
  id: string;
  name: string;
  publisher: string;
  images: SpotifyImage[];
  external_urls: SpotifyExternalUrls;
  href: string;
  type: 'show';
}
```

### SpotifyEpisode

```typescript
export interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  html_description: string;
  duration_ms: number;
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  languages: string[];
  explicit: boolean;
  audio_preview_url: string | null;
  images: SpotifyImage[];
  is_playable: boolean;
  is_externally_hosted: boolean;
  show: SpotifySimplifiedShow;
  external_urls: SpotifyExternalUrls;
  uri: string;
  href: string;
  type: 'episode';
}
```

### SpotifySimplifiedEpisode

```typescript
export interface SpotifySimplifiedEpisode {
  id: string;
  name: string;
  description: string;
  html_description: string;
  duration_ms: number;
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  languages: string[];
  explicit: boolean;
  audio_preview_url: string | null;
  images: SpotifyImage[];
  is_playable: boolean;
  is_externally_hosted: boolean;
  external_urls: SpotifyExternalUrls;
  uri: string;
  href: string;
  type: 'episode';
}
```

### Paginated Response

```typescript
export interface SpotifyPaginatedResponse<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}
```

### Search Response

```typescript
export interface SpotifySearchResponse {
  shows?: SpotifyPaginatedResponse<SpotifyShow>;
  episodes?: SpotifyPaginatedResponse<SpotifySimplifiedEpisode>;
}
```

### Token Response

```typescript
export interface SpotifyTokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
}
```

### Spotify Error Response

```typescript
export interface SpotifyErrorResponse {
  error: {
    status: number;
    message: string;
  };
}
```

---

## 8. Caching Layer

**File:** `src/lib/spotify/cache.ts`

### Implementation

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 3600,          // Default: 1 hour
  checkperiod: 600,      // Check for expired keys every 10 min
  useClones: false,       // Performance: return reference, not clone
  maxKeys: 1000,          // Prevent unbounded memory growth
});

export function getCached<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCached<T>(key: string, value: T, ttlSeconds?: number): void {
  if (ttlSeconds) {
    cache.set(key, value, ttlSeconds);
  } else {
    cache.set(key, value);
  }
}

export function invalidate(key: string): void {
  cache.del(key);
}

export function getStats() {
  return cache.getStats();
}
```

### TTL Configuration

| Data Type             | TTL        | Rationale                                |
|-----------------------|------------|------------------------------------------|
| Search results        | 1 hour     | Balance freshness with API call reduction|
| Show metadata         | 24 hours   | Metadata changes infrequently            |
| Show episodes list    | 1 hour     | New episodes may be published            |
| Episode metadata      | 24 hours   | Episode data is stable                   |
| Compare data          | 1 hour     | Derived from episodes, moderate staleness|
| Analytics             | 1 hour     | Computed data, moderate staleness         |
| Access token          | ~55 min    | Refreshed 5 min before expiry            |

---

## 9. Environment Variables

| Variable              | Required | Description                              | Example                |
|-----------------------|----------|------------------------------------------|------------------------|
| `SPOTIFY_CLIENT_ID`   | Yes      | Spotify app client ID                    | `a1b2c3d4e5f6...`     |
| `SPOTIFY_CLIENT_SECRET`| Yes     | Spotify app client secret                | `x9y8z7w6v5u4...`     |

### Setup Instructions

1. Go to https://developer.spotify.com/dashboard
2. Create a new application (or use existing)
3. Copy the Client ID and Client Secret
4. Add to `.env.local`:

```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

5. For production (Vercel), add as environment variables in the project settings.

**Important:** Never commit `.env.local` to version control. It is listed in `.gitignore`.

---

## 10. File Structure

```
src/lib/spotify/
├── auth.ts          # Token management (Client Credentials flow)
├── client.ts        # SpotifyClient class (main API interface)
├── cache.ts         # In-memory caching with node-cache
├── errors.ts        # Error classes and error mapping
├── types.ts         # TypeScript interfaces for Spotify API
└── utils.ts         # Helper functions (formatDuration, sanitize, etc.)
```

---

## 11. Deprecated Fields Notice

The following Spotify API fields are marked as deprecated and may be removed in future API versions:

| Field                | Type        | Status      | Impact                                   | Mitigation                             |
|----------------------|-------------|-------------|------------------------------------------|-----------------------------------------|
| `audio_preview_url`  | Episode     | Deprecated  | Preview player may stop working          | Show fallback message, link to Spotify  |
| `publisher`          | Show        | Deprecated  | Publisher name may become unavailable    | Cache publisher data locally            |
| `available_markets`  | Show        | Deprecated  | Market filtering may change              | Use `market` query param instead        |
| `languages`          | Show/Episode| Stable      | Currently stable, monitor                | -                                       |

The application should handle these fields gracefully by checking for `null`/`undefined` and providing appropriate fallbacks.
