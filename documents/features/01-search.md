---
id: search
title: Search & Discovery
phase: 1
status: planned
priority: critical
depends_on: []
api_routes:
  - GET /api/search
screens:
  - /search
created: 2026-02-27
updated: 2026-02-27
---

# Search & Discovery

## Overview

The search feature is the primary entry point for PodcastW4GZ. Users search for Vietnamese podcasts and episodes using keywords, with results filtered by market (VN), language (vi), and advanced criteria. All search queries are proxied through Next.js API routes to the Spotify Web API using Client Credentials authentication. The search input is debounced at 300ms to minimize API calls. Search state is persisted in URL search params for shareability and browser history support.

## User Stories

- **US-01**: As a researcher, I want to search podcasts by keyword so I can discover Vietnamese shows on a specific topic.
- **US-02**: As a researcher, I want to search episodes by keyword so I can find specific content across all podcasts.
- **US-03**: As a researcher, I want to filter results by language (Vietnamese) so I only see relevant content.
- **US-04**: As a researcher, I want to apply advanced filters (explicit content, episode count range, publisher) so I can narrow results precisely.
- **US-05**: As a researcher, I want the search state in the URL so I can share or bookmark a specific search query.

## Technical Spec

### API Route

**`GET /api/search`**

File: `src/app/api/search/route.ts`

| Parameter  | Type    | Required | Default | Description                                      |
|------------|---------|----------|---------|--------------------------------------------------|
| `q`        | string  | yes      | -       | Search query string                              |
| `type`     | string  | no       | `show`  | `show` or `episode`                              |
| `market`   | string  | no       | `VN`    | ISO 3166-1 alpha-2 market code                   |
| `language` | string  | no       | `vi`    | ISO 639-1 language code for client-side filtering|
| `limit`    | integer | no       | `10`    | Results per page (max 10 per Spotify constraint) |
| `offset`   | integer | no       | `0`     | Pagination offset (max 1000)                     |
| `explicit` | string  | no       | -       | `true` or `false` to filter explicit content     |
| `minEpisodes` | integer | no   | -       | Minimum total_episodes (client-side filter)      |
| `maxEpisodes` | integer | no   | -       | Maximum total_episodes (client-side filter)      |
| `publisher`   | string  | no   | -       | Publisher name substring match (client-side)     |

**Request flow:**

```
Client GET /api/search?q=kinh+te&type=show&market=VN&language=vi&limit=10&offset=0
  -> API route validates params
  -> Check node-cache for cache hit (key: search:{q}:{type}:{market}:{offset}:{limit})
  -> If miss: fetch Spotify token (Client Credentials)
  -> GET https://api.spotify.com/v1/search?q={q}&type={type}&market={market}&limit={limit}&offset={offset}
  -> Apply client-side filters: language, explicit, minEpisodes, maxEpisodes, publisher
  -> Cache response (TTL: 1 hour)
  -> Return filtered JSON
```

**Response shape:**

```typescript
interface SearchResponse {
  items: SpotifyShow[] | SpotifyEpisode[];
  total: number;
  limit: number;
  offset: number;
  query: string;
  type: "show" | "episode";
  filters: {
    market: string;
    language: string | null;
    explicit: boolean | null;
    minEpisodes: number | null;
    maxEpisodes: number | null;
    publisher: string | null;
  };
}
```

**Error responses:**

| Status | Condition                        |
|--------|----------------------------------|
| 400    | Missing `q` parameter            |
| 429    | Spotify rate limit (retry-after) |
| 502    | Spotify API error                |

### Spotify API Calls

1. **Podcast search**: `GET https://api.spotify.com/v1/search?q={q}&type=show&market=VN&limit=10&offset={offset}`
2. **Episode search**: `GET https://api.spotify.com/v1/search?q={q}&type=episode&market=VN&limit=10&offset={offset}`

### Components

#### SearchBar

File: `src/components/search/search-bar.tsx`

```typescript
interface SearchBarProps {
  defaultValue?: string;
  onSearch: (query: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}
```

- shadcn/ui `Input` with `Search` icon (lucide-react) on the left
- Debounce input changes by 300ms using a `useDebounce` hook
- Show a `Loader2` spinner icon when `isLoading` is true
- On Enter key press, trigger search immediately (bypass debounce)
- Clear button (X icon) appears when input has value

#### SearchFilters

File: `src/components/search/search-filters.tsx`

```typescript
interface SearchFiltersProps {
  filters: SearchFilterValues;
  onChange: (filters: SearchFilterValues) => void;
}

interface SearchFilterValues {
  type: "show" | "episode";
  market: string;
  language: string;
  explicit: boolean | null;
  minEpisodes: number | null;
  maxEpisodes: number | null;
  publisher: string;
}
```

- **Type toggle**: shadcn/ui `Tabs` with two options: "Podcasts" (show) and "Episodes" (episode)
- **Market select**: shadcn/ui `Select` dropdown, default `VN`, options: `VN`, `US`, `All Markets`
- **Language select**: shadcn/ui `Select` dropdown, default `vi`, options: `vi` (Vietnamese), `en` (English), `All`
- **Explicit toggle**: shadcn/ui `Switch` with label "Exclude explicit"
- **Episode count range**: Two shadcn/ui `Input` fields (min, max) with type `number`
- **Publisher filter**: shadcn/ui `Input` for publisher name substring
- **Reset button**: clears all filters to defaults

#### SearchResults

File: `src/components/search/search-results.tsx`

```typescript
interface SearchResultsProps {
  results: SearchResponse | null;
  isLoading: boolean;
  onPageChange: (offset: number) => void;
}
```

- Renders a responsive grid of `PodcastCard` components (when type=show) or `EpisodeCard` components (when type=episode)
- Grid layout: 1 column on mobile, 2 on `md`, 3 on `lg`
- Shows skeleton loading cards (shadcn/ui `Skeleton`) when `isLoading`
- Shows "No results found" empty state with suggestion text
- Result count display: "Showing {offset+1}-{offset+items.length} of {total} results"
- Pagination controls at bottom using shadcn/ui `Button` (Previous / Next)

### State Management

File: `src/app/search/page.tsx`

All search state is synced to URL search params using `useSearchParams()` and `useRouter()`:

```
/search?q=kinh+te&type=show&market=VN&language=vi&limit=10&offset=0
```

**State flow:**

1. Page reads initial state from URL search params on mount
2. User types in SearchBar -> debounce 300ms -> update `q` param -> trigger fetch
3. User changes filter -> update corresponding param -> reset offset to 0 -> trigger fetch
4. User clicks Next/Previous -> update `offset` param -> trigger fetch
5. Data fetching via `fetch('/api/search?' + params.toString())`
6. Loading state managed with `useState<boolean>`

### Data Flow Diagram

```
URL Search Params (source of truth)
  |
  v
SearchPage (reads params, constructs fetch URL)
  |
  +-- SearchBar (updates ?q= on debounced input)
  |
  +-- SearchFilters (updates ?type=, ?market=, ?language=, etc.)
  |
  +-- SearchResults (renders data, pagination updates ?offset=)
        |
        +-- PodcastCard[] (links to /podcast/[id])
        +-- EpisodeCard[] (links to /episode/[id])
```

## Acceptance Criteria

- [ ] Searching with a keyword returns podcast results from Spotify filtered to market=VN
- [ ] Switching type to "episode" returns episode results instead of shows
- [ ] Search input is debounced at 300ms; typing fast does not trigger multiple API calls
- [ ] Pressing Enter triggers search immediately without waiting for debounce
- [ ] Language filter with `vi` only shows podcasts where `languages` array includes `"vi"`
- [ ] Market defaults to `VN`; changing market to `US` returns US market results
- [ ] Advanced filters (explicit, episode count range, publisher) correctly narrow results
- [ ] URL search params update on every filter/query change
- [ ] Refreshing the page restores the exact search state from URL params
- [ ] Pagination shows correct result count and navigates between pages
- [ ] Loading state shows skeleton cards during fetch
- [ ] Empty state shows "No results found" when query returns zero items
- [ ] API route returns 400 when `q` parameter is missing
- [ ] API route handles Spotify 429 rate limit by returning appropriate error to client
- [ ] Cached search results are served for identical queries within 1-hour TTL
