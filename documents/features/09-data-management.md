---
id: data-management
title: Caching & Data Management
phase: 1
status: planned
priority: critical
depends_on: []
api_routes: []
screens: []
created: 2026-02-27
updated: 2026-02-27
---

# Caching & Data Management

## Overview

The data management layer handles server-side caching with `node-cache`, persistent storage with SQLite via Prisma, background metadata synchronization, Spotify API rate limit handling with exponential backoff, and data freshness indicators. This is an infrastructure feature that underpins all other features. It ensures fast responses by caching Spotify API results, protects against rate limits, and keeps indexed directory data current through background sync processes.

## User Stories

- **US-01**: As a user, I want pages to load quickly so I do not wait for repeated Spotify API calls.
- **US-02**: As a user, I want to see when data was last updated so I know if the information is current.
- **US-03**: As a user, I want to manually refresh podcast data so I can get the latest information on demand.
- **US-04**: As a system operator, I want the app to handle Spotify rate limits gracefully without crashing or losing data.
- **US-05**: As a system operator, I want background sync to keep indexed data fresh without manual intervention.

## Technical Spec

### Server-Side Cache (node-cache)

File: `src/lib/cache.ts`

```typescript
import NodeCache from "node-cache";

// Single cache instance shared across all API routes
const cache = new NodeCache({
  stdTTL: 3600,          // Default TTL: 1 hour (in seconds)
  checkperiod: 600,      // Check for expired keys every 10 minutes
  useClones: false,      // Return references for performance (data is read-only)
  maxKeys: 5000,         // Prevent unbounded memory growth
});

export default cache;

// Typed cache helpers
export function getCached<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function setCached<T>(key: string, value: T, ttl?: number): boolean {
  return cache.set(key, value, ttl ?? 3600);
}

export function invalidate(key: string): number {
  return cache.del(key);
}

export function invalidatePattern(pattern: string): number {
  const keys = cache.keys().filter(k => k.startsWith(pattern));
  return cache.del(keys);
}

export function getCacheStats(): { keys: number; hits: number; misses: number; hitRate: number } {
  const stats = cache.getStats();
  const total = stats.hits + stats.misses;
  return {
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: total > 0 ? stats.hits / total : 0,
  };
}
```

### TTL Configuration

File: `src/lib/cache-config.ts`

```typescript
export const CACHE_TTL = {
  // Search results: 1 hour (data changes frequently)
  SEARCH: 3600,

  // Show details: 24 hours (metadata changes rarely)
  SHOW: 86400,

  // Episode list: 1 hour (new episodes may appear)
  EPISODES: 3600,

  // Analytics: 24 hours (computed from episode data)
  ANALYTICS: 86400,

  // Spotify access token: 55 minutes (tokens expire in 60 minutes)
  TOKEN: 3300,

  // Topics and recommendations: 24 hours (depends on directory data)
  TOPICS: 86400,
  RECOMMENDATIONS: 86400,

  // Directory data: served from SQLite, no cache needed
} as const;
```

### Cache Key Schema

All cache keys follow a consistent naming convention:

| Key Pattern                              | TTL      | Data Type              |
|------------------------------------------|----------|------------------------|
| `token`                                  | 55 min   | Spotify access token   |
| `search:{q}:{type}:{market}:{offset}:{limit}` | 1 hour  | Search results       |
| `show:{id}:{market}`                     | 24 hours | Show metadata          |
| `episodes:{id}:{market}:{offset}:{limit}`| 1 hour  | Episode page           |
| `analytics:{id}`                         | 24 hours | Computed analytics     |
| `topics:{limit}:{category}`             | 24 hours | Topic keywords         |
| `recommendations:{id}:{limit}`          | 24 hours | Recommendations        |

### Spotify Token Management

File: `src/lib/spotify/auth.ts`

```typescript
import { getCached, setCached, CACHE_TTL } from "@/lib/cache";

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function getSpotifyToken(): Promise<string> {
  const cached = getCached<string>("token");
  if (cached) return cached;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status} ${response.statusText}`);
  }

  const data: SpotifyToken = await response.json();
  setCached("token", data.access_token, CACHE_TTL.TOKEN);

  return data.access_token;
}
```

### Rate Limit Handling with Exponential Backoff

File: `src/lib/spotify/client.ts`

```typescript
import { getSpotifyToken } from "./auth";

interface SpotifyClientConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_CONFIG: SpotifyClientConfig = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
};

export async function spotifyFetch<T>(
  path: string,
  config: Partial<SpotifyClientConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs } = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const token = await getSpotifyToken();

    const response = await fetch(`https://api.spotify.com/v1${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
      const backoffDelay = Math.min(
        Math.max(retryAfter * 1000, baseDelayMs * Math.pow(2, attempt)),
        maxDelayMs
      );

      console.warn(
        `Spotify rate limited (attempt ${attempt + 1}/${maxRetries + 1}). ` +
        `Retry-After: ${retryAfter}s, waiting: ${backoffDelay}ms`
      );

      await delay(backoffDelay);
      continue;
    }

    if (response.status === 401) {
      // Token expired, invalidate and retry
      invalidate("token");
      continue;
    }

    lastError = new Error(`Spotify API error: ${response.status} ${response.statusText}`);

    // Don't retry client errors (4xx) other than 401 and 429
    if (response.status >= 400 && response.status < 500) {
      throw lastError;
    }

    // Retry server errors (5xx) with backoff
    const backoffDelay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
    await delay(backoffDelay);
  }

  throw lastError || new Error("Spotify API request failed after max retries");
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### SQLite Storage via Prisma

File: `prisma/schema.prisma` (shared with directory feature)

**Database file location**: `prisma/podcastw4gz.db`

**Environment variable**: `DATABASE_URL="file:./podcastw4gz.db"`

**Prisma client initialization:**

File: `src/lib/db.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
```

This singleton pattern prevents multiple Prisma client instances during Next.js hot reloads in development.

### Background Sync for Metadata Refresh

File: `src/lib/sync/background-sync.ts`

**Sync strategy:**

1. Query all `IndexedPodcast` records ordered by `lastSyncedAt` ascending (oldest first)
2. For each podcast (in batches of 10):
   - Re-fetch show metadata from Spotify: `/shows/{id}?market=VN`
   - Compare `total_episodes` with stored value
   - If changed: update `IndexedPodcast`, fetch new episodes, update `activeStatus`
   - Update `lastSyncedAt` timestamp
3. Rate limit: 100ms delay between requests, respect 429 with backoff
4. Track sync progress and errors

```typescript
interface SyncResult {
  totalProcessed: number;
  updated: number;
  unchanged: number;
  errors: Array<{ showId: string; error: string }>;
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export async function runBackgroundSync(batchSize: number = 10): Promise<SyncResult> {
  const result: SyncResult = {
    totalProcessed: 0, updated: 0, unchanged: 0, errors: [],
    startedAt: new Date().toISOString(), completedAt: "", durationMs: 0,
  };
  const startTime = Date.now();

  const podcasts = await prisma.indexedPodcast.findMany({
    orderBy: { lastSyncedAt: "asc" },
    take: batchSize,
  });

  for (const podcast of podcasts) {
    try {
      const freshData = await spotifyFetch<SpotifyShow>(`/shows/${podcast.id}?market=VN`);

      const hasChanges = freshData.total_episodes !== podcast.totalEpisodes ||
                         freshData.name !== podcast.name ||
                         freshData.publisher !== podcast.publisher;

      if (hasChanges) {
        await prisma.indexedPodcast.update({
          where: { id: podcast.id },
          data: {
            name: freshData.name,
            publisher: freshData.publisher,
            description: freshData.description,
            htmlDescription: freshData.html_description,
            totalEpisodes: freshData.total_episodes,
            explicit: freshData.explicit,
            lastSyncedAt: new Date(),
            syncVersion: { increment: 1 },
          },
        });

        // Fetch new episodes if episode count changed
        if (freshData.total_episodes !== podcast.totalEpisodes) {
          await syncEpisodesForShow(podcast.id);
        }

        // Update active status
        await updateActiveStatus(podcast.id);

        result.updated++;
      } else {
        await prisma.indexedPodcast.update({
          where: { id: podcast.id },
          data: { lastSyncedAt: new Date() },
        });
        result.unchanged++;
      }

      result.totalProcessed++;
      await delay(100);
    } catch (error) {
      result.errors.push({
        showId: podcast.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  result.completedAt = new Date().toISOString();
  result.durationMs = Date.now() - startTime;
  return result;
}

async function syncEpisodesForShow(showId: string): Promise<void> {
  let offset = 0;
  const limit = 50;

  while (true) {
    const data = await spotifyFetch<{ items: SpotifyEpisode[]; total: number }>(
      `/shows/${showId}/episodes?market=VN&limit=${limit}&offset=${offset}`
    );

    if (!data.items?.length) break;

    for (const ep of data.items) {
      await prisma.indexedEpisode.upsert({
        where: { id: ep.id },
        create: mapEpisodeToModel(ep, showId),
        update: mapEpisodeToUpdateModel(ep),
      });
    }

    offset += limit;
    if (offset >= data.total) break;
    await delay(100);
  }
}

async function updateActiveStatus(showId: string): Promise<void> {
  const latestEpisode = await prisma.indexedEpisode.findFirst({
    where: { showId },
    orderBy: { releaseDate: "desc" },
  });

  if (!latestEpisode) return;

  const daysSince = Math.floor(
    (Date.now() - new Date(latestEpisode.releaseDate).getTime()) / 86400000
  );

  let status: string;
  if (daysSince <= 45) status = "active";
  else if (daysSince <= 180) status = "on-hiatus";
  else status = "ended";

  await prisma.indexedPodcast.update({
    where: { id: showId },
    data: { activeStatus: status, lastEpisodeDate: latestEpisode.releaseDate },
  });
}
```

**Sync trigger:**

File: `src/app/api/sync/route.ts`

```typescript
export async function POST(request: Request) {
  const syncKey = request.headers.get("x-sync-key");
  if (syncKey !== process.env.SYNC_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const batchSize = Math.min(body.batchSize || 10, 50);

  const result = await runBackgroundSync(batchSize);
  return Response.json(result);
}
```

### "Last Synced" Timestamp Display

File: `src/components/data/last-synced.tsx`

```typescript
interface LastSyncedProps {
  timestamp: string | null; // ISO 8601 string
  onRefresh: () => void;
  isRefreshing: boolean;
}
```

- Displays: "Last updated: {relative time}" using `Intl.RelativeTimeFormat('vi')`
- Relative time examples: "5 minutes ago", "2 hours ago", "1 day ago"
- Tooltip on hover shows exact timestamp in `vi-VN` locale
- Uses `text-xs text-muted-foreground` styling

**Relative time computation:**

```typescript
function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  const rtf = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });

  if (diffSeconds < 60) return rtf.format(-diffSeconds, "second");
  if (diffSeconds < 3600) return rtf.format(-Math.floor(diffSeconds / 60), "minute");
  if (diffSeconds < 86400) return rtf.format(-Math.floor(diffSeconds / 3600), "hour");
  return rtf.format(-Math.floor(diffSeconds / 86400), "day");
}
```

### Manual Refresh Button

File: `src/components/data/refresh-button.tsx`

```typescript
interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}
```

- shadcn/ui `Button` variant `ghost` size `sm` with `RefreshCw` icon (lucide-react)
- When `isRefreshing`: icon spins (`animate-spin`), button disabled
- On click: calls `onRefresh` callback which:
  1. Invalidates the relevant cache keys via `DELETE /api/cache?key={pattern}`
  2. Re-fetches the data from Spotify (forces cache miss)
  3. Updates the "Last synced" timestamp

**Cache invalidation endpoint:**

File: `src/app/api/cache/route.ts`

```typescript
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  if (!key) {
    return Response.json({ error: "Missing key parameter" }, { status: 400 });
  }

  // Invalidate exact key or pattern (prefix match)
  const deleted = key.endsWith("*")
    ? invalidatePattern(key.slice(0, -1))
    : invalidate(key);

  return Response.json({ deleted });
}
```

### Page Integration

The `LastSynced` and `RefreshButton` components are placed on:

| Page               | Cache Key Pattern        | Behavior                                              |
|--------------------|--------------------------|-------------------------------------------------------|
| Podcast detail     | `show:{id}:*`           | Invalidates show + episodes cache, re-fetches         |
| Analytics section  | `analytics:{id}`        | Invalidates analytics cache, re-computes              |
| Directory page     | Shows `lastSyncedAt` from database | Refresh triggers background sync for stale entries |

### Data Flow Diagram

```
                        +-----------+
                        |  Client   |
                        +-----+-----+
                              |
                        fetch /api/*
                              |
                  +-----------v-----------+
                  |   Next.js API Route   |
                  +-----------+-----------+
                              |
                   +----------+----------+
                   |                     |
            getCached(key)        spotifyFetch(path)
                   |                     |
            +------v------+     +--------v--------+
            |  node-cache |     | Spotify Web API  |
            | (in-memory) |     |  (with backoff)  |
            +------+------+     +--------+---------+
                   |                     |
            hit: return             fetch + cache
            miss: fall through      setCached(key, data, ttl)
                                         |
                                         v
                                   Return to client

Background Sync:
                  +------------------+
                  | Cron / Manual    |
                  | POST /api/sync   |
                  +--------+---------+
                           |
                  +--------v---------+
                  | runBackgroundSync |
                  +--------+---------+
                           |
              For each stale IndexedPodcast:
                  +--------v---------+
                  | spotifyFetch     |
                  | (with backoff)   |
                  +--------+---------+
                           |
                  +--------v---------+
                  | Prisma upsert    |
                  | (SQLite)         |
                  +------------------+
```

## Acceptance Criteria

- [ ] `node-cache` is initialized as a singleton shared across all API routes
- [ ] Search results are cached with 1-hour TTL
- [ ] Show details are cached with 24-hour TTL
- [ ] Episode lists are cached with 1-hour TTL
- [ ] Analytics data is cached with 24-hour TTL
- [ ] Spotify access tokens are cached for 55 minutes (5-minute buffer before expiry)
- [ ] Cache key schema follows documented patterns consistently across all API routes
- [ ] Maximum 5000 cache keys enforced to prevent unbounded memory growth
- [ ] Spotify 429 rate limit triggers exponential backoff starting at 1 second, capped at 60 seconds
- [ ] Spotify 429 response `Retry-After` header is respected when present
- [ ] Spotify 401 response triggers token invalidation and automatic re-authentication
- [ ] Server errors (5xx) are retried up to 5 times with exponential backoff
- [ ] Client errors (4xx, except 401/429) are not retried and thrown immediately
- [ ] Prisma client is a singleton that survives Next.js hot reloads in development
- [ ] Background sync processes podcasts ordered by oldest `lastSyncedAt` first
- [ ] Background sync detects changes in episode count and re-fetches episodes when changed
- [ ] Background sync updates `activeStatus` based on latest episode release date
- [ ] Sync endpoint requires valid `x-sync-key` header and returns 401 without it
- [ ] "Last updated" timestamp displays relative time in Vietnamese locale
- [ ] Manual refresh button invalidates cache and re-fetches fresh data from Spotify
- [ ] Refresh button shows spinning icon during refresh operation
- [ ] Cache invalidation endpoint supports both exact key and prefix pattern matching
- [ ] Cache statistics (keys, hits, misses, hit rate) are accessible for monitoring
