# PodcastW4GZ - Project Structure

## Root Directory

```
podcastw4gz/
├── .env.example               # Template for environment variables
├── .env.local                 # Local env (git-ignored)
├── .eslintrc.json             # ESLint configuration
├── .gitignore                 # Git ignore rules
├── .prettierrc                # Prettier configuration
├── documents/                 # Open Spec documentation (this folder)
│   ├── spec.yaml
│   ├── overview.md
│   ├── tech-stack.md
│   ├── project-structure.md
│   ├── environment.md
│   └── deployment.md
├── next.config.mjs            # Next.js configuration
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── prisma/
│   ├── schema.prisma          # Prisma ORM schema
│   ├── migrations/            # Database migrations
│   └── dev.db                 # SQLite database (git-ignored)
├── public/
│   ├── favicon.ico
│   └── images/                # Static images
├── tailwind.config.ts         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── src/                       # Application source code
```

---

## Source Code (`src/`)

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout with header/sidebar
│   ├── page.tsx                  # Home page
│   ├── search/page.tsx           # Search results
│   ├── podcast/[id]/page.tsx     # Podcast detail
│   ├── episode/[id]/page.tsx     # Episode detail
│   ├── compare/page.tsx          # Comparison
│   ├── analytics/page.tsx        # Dashboard
│   ├── directory/page.tsx        # Directory
│   └── api/                      # API routes
│       ├── search/route.ts
│       ├── shows/[id]/route.ts
│       ├── shows/[id]/episodes/route.ts
│       ├── episodes/[id]/route.ts
│       ├── compare/route.ts
│       ├── analytics/[id]/route.ts
│       └── export/route.ts
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Header, Footer, Sidebar
│   ├── search/                   # SearchBar, SearchFilters, SearchResults
│   ├── podcast/                  # PodcastCard, PodcastGrid, PodcastDetailHeader, EpisodeList
│   ├── episode/                  # EpisodeCard, EpisodeDetail
│   ├── analytics/                # Charts, StatsCards
│   └── compare/                  # CompareSelector, CompareTable
├── lib/
│   ├── spotify/                  # Spotify client, auth, types
│   ├── cache.ts
│   ├── utils.ts
│   └── constants.ts
├── hooks/                        # Custom React hooks
└── types/                        # TypeScript type definitions
```

---

## Detailed File Descriptions

### `src/app/` -- Pages and API Routes

| File                                    | Type             | Rendering   | Description                                                                |
| --------------------------------------- | ---------------- | ----------- | -------------------------------------------------------------------------- |
| `layout.tsx`                            | Layout           | Server      | Root layout. Renders `<html>`, `<body>`, global font, Header, Sidebar.     |
| `page.tsx`                              | Page             | Server      | Home page. Hero section, trending podcasts, quick search prompt.            |
| `search/page.tsx`                       | Page             | Client      | Reads `?q=` search param, calls `/api/search`, renders paginated results.  |
| `podcast/[id]/page.tsx`                 | Page             | Server      | Fetches show metadata and first page of episodes. Server-rendered.          |
| `episode/[id]/page.tsx`                 | Page             | Server      | Fetches episode metadata. Shows description, duration, audio preview.       |
| `compare/page.tsx`                      | Page             | Client      | Multi-select podcasts, calls `/api/compare`, renders comparison table.      |
| `analytics/page.tsx`                    | Page             | Client      | Reads show ID from query param, calls `/api/analytics/{id}`, renders charts.|
| `directory/page.tsx`                    | Page             | Server      | Renders category grid. Fetches curated directory data from database.        |
| `api/search/route.ts`                   | Route Handler    | Server      | Proxies to Spotify Search API. Caches results.                             |
| `api/shows/[id]/route.ts`              | Route Handler    | Server      | Fetches single show from Spotify. Caches and persists to DB.               |
| `api/shows/[id]/episodes/route.ts`     | Route Handler    | Server      | Fetches paginated episodes for a show. Caches results.                     |
| `api/episodes/[id]/route.ts`           | Route Handler    | Server      | Fetches single episode from Spotify. Caches result.                        |
| `api/compare/route.ts`                 | Route Handler    | Server      | Accepts comma-separated IDs, fetches shows in parallel, returns combined.  |
| `api/analytics/[id]/route.ts`          | Route Handler    | Server      | Computes analytics from DB snapshots and Spotify data. Returns stats.      |
| `api/export/route.ts`                  | Route Handler    | Server      | Generates CSV or JSON file from show/episode data. Returns download.       |

### `src/components/` -- React Components

#### `components/ui/` -- shadcn/ui Primitives

These are copied from shadcn/ui and customized. They follow the shadcn/ui file naming convention.

| File              | Exports                                         |
| ----------------- | ------------------------------------------------ |
| `button.tsx`      | `Button`, `buttonVariants`                       |
| `input.tsx`       | `Input`                                          |
| `card.tsx`        | `Card`, `CardHeader`, `CardTitle`, `CardContent` |
| `badge.tsx`       | `Badge`                                          |
| `skeleton.tsx`    | `Skeleton`                                       |
| `table.tsx`       | `Table`, `TableRow`, `TableCell`, etc.           |
| `tabs.tsx`        | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| `select.tsx`      | `Select`, `SelectTrigger`, `SelectContent`, etc. |
| `dialog.tsx`      | `Dialog`, `DialogTrigger`, `DialogContent`       |
| `separator.tsx`   | `Separator`                                      |
| `sheet.tsx`       | `Sheet`, `SheetTrigger`, `SheetContent`          |
| `tooltip.tsx`     | `Tooltip`, `TooltipTrigger`, `TooltipContent`    |
| `pagination.tsx`  | `Pagination`, `PaginationItem`, etc.             |

#### `components/layout/` -- Layout Components

| File              | Props                            | Description                                           |
| ----------------- | -------------------------------- | ----------------------------------------------------- |
| `Header.tsx`      | none                             | Top navigation bar with logo, search, nav links.      |
| `Footer.tsx`      | none                             | Footer with links and attribution.                    |
| `Sidebar.tsx`     | `isOpen: boolean`                | Side navigation for desktop; Sheet on mobile.         |

#### `components/search/` -- Search Components

| File                | Props                                          | Description                                           |
| ------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `SearchBar.tsx`     | `onSearch: (query: string) => void`            | Input field with search icon. Debounced (300ms).      |
| `SearchFilters.tsx` | `filters: Filters; onChange: (f: Filters) => void` | Market selector, sort order dropdown.             |
| `SearchResults.tsx` | `results: SpotifyShow[]; loading: boolean`     | Grid of PodcastCards. Shows Skeleton during loading.  |

#### `components/podcast/` -- Podcast Components

| File                       | Props                                      | Description                                              |
| -------------------------- | ------------------------------------------ | -------------------------------------------------------- |
| `PodcastCard.tsx`          | `show: SpotifyShow`                        | Card with cover art, name, publisher, episode count.     |
| `PodcastGrid.tsx`          | `shows: SpotifyShow[]`                     | Responsive grid layout of PodcastCards.                  |
| `PodcastDetailHeader.tsx`  | `show: SpotifyShow`                        | Large hero with cover art, metadata, Spotify link.       |
| `EpisodeList.tsx`          | `episodes: SpotifyEpisode[]; total: number`| Paginated list of EpisodeCards with load-more.           |

#### `components/episode/` -- Episode Components

| File                | Props                          | Description                                                   |
| ------------------- | ------------------------------ | ------------------------------------------------------------- |
| `EpisodeCard.tsx`   | `episode: SpotifyEpisode`      | Compact card: name, date, duration, play preview button.      |
| `EpisodeDetail.tsx` | `episode: SpotifyEpisode`      | Full detail: description, duration, release date, audio player.|

#### `components/analytics/` -- Analytics Components

| File                     | Props                          | Description                                           |
| ------------------------ | ------------------------------ | ----------------------------------------------------- |
| `DurationTrendChart.tsx` | `data: DataPoint[]`            | Line chart of episode duration over time.             |
| `FrequencyChart.tsx`     | `data: DataPoint[]`            | Bar chart of episodes per month.                      |
| `PublishHeatmap.tsx`     | `data: HeatmapData[]`         | Day-of-week x time heatmap for publishing patterns.   |
| `StatsCards.tsx`         | `stats: ShowStats`             | Grid of stat cards (total eps, avg duration, etc.).   |

#### `components/compare/` -- Comparison Components

| File                  | Props                                          | Description                                           |
| --------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `CompareSelector.tsx` | `selected: string[]; onChange: (ids: string[]) => void` | Multi-select search for adding podcasts (max 4). |
| `CompareTable.tsx`    | `shows: SpotifyShow[]`                         | Side-by-side table comparing show metadata.           |

### `src/lib/` -- Utility Libraries

#### `lib/spotify/` -- Spotify API Client

| File            | Exports                                          | Description                                           |
| --------------- | ------------------------------------------------ | ----------------------------------------------------- |
| `client.ts`     | `spotifyFetch(endpoint, params)`                 | Authenticated fetch wrapper. Handles token refresh.   |
| `auth.ts`       | `getAccessToken()`                               | Client Credentials flow. Caches token until expiry.   |
| `types.ts`      | Spotify response type definitions                | Typed interfaces for Spotify API responses.           |

```ts
// src/lib/spotify/auth.ts
import { cache } from "@/lib/cache";

const TOKEN_URL = "https://accounts.spotify.com/api/token";

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export async function getAccessToken(): Promise<string> {
  const cached = cache.get<string>("spotify:token");
  if (cached) return cached;

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Spotify auth failed: ${response.status}`);
  }

  const data: SpotifyToken = await response.json();

  // Cache token with 60s buffer before actual expiry
  cache.set("spotify:token", data.access_token, data.expires_in - 60);

  return data.access_token;
}
```

```ts
// src/lib/spotify/client.ts
import { getAccessToken } from "./auth";

const BASE_URL = "https://api.spotify.com/v1";

export async function spotifyFetch<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`${BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${endpoint}`);
  }

  return response.json() as Promise<T>;
}
```

#### `lib/cache.ts` -- Cache Configuration

```ts
// src/lib/cache.ts
import NodeCache from "node-cache";

export const cache = new NodeCache({
  stdTTL: 900,
  checkperiod: 120,
  useClones: false,
  maxKeys: 5000,
});
```

#### `lib/utils.ts` -- General Utilities

```ts
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format milliseconds to "Xh Ym" or "Ym Zs" */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Format a date string "YYYY-MM-DD" to locale display */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
```

#### `lib/constants.ts` -- Application Constants

```ts
// src/lib/constants.ts
export const APP_NAME = "PodcastW4GZ";
export const DEFAULT_MARKET = "VN";
export const DEFAULT_LIMIT = 20;
export const MAX_COMPARE = 4;
export const CACHE_TTL_SEARCH = 900;     // 15 minutes
export const CACHE_TTL_SHOW = 1800;      // 30 minutes
export const CACHE_TTL_EPISODE = 1800;   // 30 minutes
```

### `src/hooks/` -- Custom React Hooks

| File                   | Hook                    | Description                                              |
| ---------------------- | ----------------------- | -------------------------------------------------------- |
| `useSearch.ts`         | `useSearch(query)`      | Fetches `/api/search`, returns `{ data, loading, error }`|
| `useShow.ts`           | `useShow(id)`           | Fetches `/api/shows/{id}`, returns show data.            |
| `useEpisodes.ts`       | `useEpisodes(showId)`   | Fetches paginated episodes, supports load-more.          |
| `useCompare.ts`        | `useCompare(ids)`       | Fetches `/api/compare`, returns array of shows.          |
| `useAnalytics.ts`      | `useAnalytics(id)`      | Fetches `/api/analytics/{id}`, returns analytics data.   |
| `useDebounce.ts`       | `useDebounce(value, delay)` | Debounces a value by the given delay in ms.          |

### `src/types/` -- TypeScript Type Definitions

| File              | Key Types                                                             |
| ----------------- | --------------------------------------------------------------------- |
| `spotify.ts`      | `SpotifyShow`, `SpotifyEpisode`, `SpotifySearchResponse`, `SpotifyImage` |
| `analytics.ts`    | `ShowStats`, `DataPoint`, `HeatmapData`, `AnalyticsResponse`         |
| `compare.ts`      | `CompareResponse`, `CompareItem`                                     |

```ts
// src/types/spotify.ts
export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyShow {
  id: string;
  name: string;
  publisher: string;
  description: string;
  html_description: string;
  images: SpotifyImage[];
  total_episodes: number;
  languages: string[];
  explicit: boolean;
  media_type: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  html_description: string;
  images: SpotifyImage[];
  duration_ms: number;
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  language: string;
  explicit: boolean;
  audio_preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResponse {
  shows: {
    href: string;
    items: SpotifyShow[];
    limit: number;
    offset: number;
    total: number;
    next: string | null;
    previous: string | null;
  };
}

export interface SpotifyEpisodeList {
  href: string;
  items: SpotifyEpisode[];
  limit: number;
  offset: number;
  total: number;
  next: string | null;
  previous: string | null;
}
```

```ts
// src/types/analytics.ts
export interface ShowStats {
  totalEpisodes: number;
  averageDurationMs: number;
  medianDurationMs: number;
  longestEpisode: { name: string; durationMs: number };
  shortestEpisode: { name: string; durationMs: number };
  firstEpisodeDate: string;
  latestEpisodeDate: string;
  averageEpisodesPerMonth: number;
}

export interface DataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface HeatmapData {
  day: number;   // 0=Sunday, 6=Saturday
  hour: number;  // 0-23
  count: number;
}

export interface AnalyticsResponse {
  showId: string;
  showName: string;
  stats: ShowStats;
  durationTrend: DataPoint[];
  episodesPerMonth: DataPoint[];
  publishHeatmap: HeatmapData[];
}
```

```ts
// src/types/compare.ts
export interface CompareItem {
  show: SpotifyShow;
  stats: {
    totalEpisodes: number;
    averageDurationMs: number;
    latestEpisodeDate: string;
  };
}

export interface CompareResponse {
  items: CompareItem[];
}
```
