---
openspec: 0.1.0
kind: screen
metadata:
  name: Search Page
  description: Full search experience with query input, filters, tabbed results (Podcasts/Episodes), sort, pagination, and responsive grid layout.
  status: planned
  phase: 1
  route: /search?q={query}
  file: src/app/search/page.tsx
  updated: 2026-02-27
dependencies:
  packages:
    - nuqs (URL state management)
    - lucide-react
  components:
    - "@/components/search/SearchBar"
    - "@/components/search/SearchFilters"
    - "@/components/search/TabToggle"
    - "@/components/search/SearchResults"
    - "@/components/search/PodcastGrid"
    - "@/components/search/EpisodeGrid"
    - "@/components/search/Pagination"
    - "@/components/shared/PodcastCard"
    - "@/components/shared/EpisodeCard"
    - "@/components/ui/input"
    - "@/components/ui/button"
    - "@/components/ui/select"
    - "@/components/ui/tabs"
    - "@/components/ui/skeleton"
    - "@/components/ui/badge"
    - "@/components/ui/sheet"
  api-routes:
    - GET /api/search
---

# Search Page

## Overview

The Search Page is the primary discovery interface. Users enter a query (pre-filled from URL param `q`), apply filters, and browse results in a responsive grid. Results are tabbed into Podcasts and Episodes. Sorting, pagination, and filter controls allow refined exploration.

---

## Wireframe

### Desktop

```
+------------------------------------------------------------------+
|                          HEADER (layout)                          |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------------------------------------------+  [Go]  |
|  | [Search icon] vietnamese technology podcasts...       |         |
|  +------------------------------------------------------+         |
|                                                                    |
+------------------------------------------------------------------+
|         |                                                          |
| FILTERS |  [Podcasts] [Episodes]              Sort: [Relevance v] |
|         |                                                          |
| Language|  Showing 1-20 of 142 results for "technology"            |
| [x] Vi  |                                                          |
| [ ] En  |  +----------+ +----------+ +----------+ +----------+    |
| [ ] All |  | [Cover]  | | [Cover]  | | [Cover]  | | [Cover]  |    |
|         |  | Name     | | Name     | | Name     | | Name     |    |
| Market  |  | Pub.     | | Pub.     | | Pub.     | | Pub.     |    |
| [VN  v] |  | 42 eps   | | 18 eps   | | 95 eps   | | 33 eps   |    |
|         |  +----------+ +----------+ +----------+ +----------+    |
| Explicit|                                                          |
| [Any v] |  +----------+ +----------+ +----------+ +----------+    |
|         |  | [Cover]  | | [Cover]  | | [Cover]  | | [Cover]  |    |
| Episodes|  | Name     | | Name     | | Name     | | Name     |    |
| [0]-[999]  | Pub.     | | Pub.     | | Pub.     | | Pub.     |    |
|         |  | 12 eps   | | 67 eps   | | 24 eps   | | 51 eps   |    |
| Publisher  +----------+ +----------+ +----------+ +----------+    |
| [     ] |                                                          |
|         |                                                          |
| [Reset] |  [< Prev]  Page 1 of 8  [Next >]                       |
|         |                                                          |
+------------------------------------------------------------------+
|                          FOOTER (layout)                          |
+------------------------------------------------------------------+
```

### Mobile

```
+-------------------------------+
|        HEADER (layout)        |
+-------------------------------+
| +---------------------------+ |
| | Search podcasts...   [Go] | |
| +---------------------------+ |
|                               |
| [Filters]  Sort: [Relevance] |
|                               |
| [Podcasts] [Episodes]        |
|                               |
| 1-20 of 142 for "technology" |
|                               |
| +---------------------------+ |
| | [Cover] Name              | |
| |         Publisher  42 eps | |
| +---------------------------+ |
| +---------------------------+ |
| | [Cover] Name              | |
| |         Publisher  18 eps | |
| +---------------------------+ |
| ...                           |
|                               |
| [< Prev] 1 of 8 [Next >]    |
+-------------------------------+

Filter Sheet (mobile):
+-------------------------------+
| Filters                  [X]  |
|                               |
| Language                      |
| [x] Vietnamese  [ ] English  |
|                               |
| Market                        |
| [VN (Vietnam)           v]    |
|                               |
| Explicit Content              |
| [Any                    v]    |
|                               |
| Episode Count                 |
| Min [0   ] Max [999  ]       |
|                               |
| Publisher                     |
| [Type publisher name...]     |
|                               |
| [Reset Filters] [Apply]      |
+-------------------------------+
```

---

## Component Tree

```
SearchPage (src/app/search/page.tsx)
├── SearchBar (src/components/search/SearchBar.tsx)
│   ├── Input (pre-filled from searchParams.q)
│   └── Button "Search"
├── SearchControls (flex row)
│   ├── FilterToggle (mobile: opens Sheet)
│   ├── SearchFilters (src/components/search/SearchFilters.tsx)
│   │   ├── LanguageFilter (checkbox group: vi, en, all)
│   │   ├── MarketSelect (dropdown: VN default, US, global)
│   │   ├── ExplicitFilter (dropdown: any, yes, no)
│   │   ├── EpisodeCountRange (min/max number inputs)
│   │   ├── PublisherInput (text input)
│   │   └── ResetButton
│   ├── TabToggle (src/components/search/TabToggle.tsx)
│   │   ├── Tab "Podcasts" (type=show)
│   │   └── Tab "Episodes" (type=episode)
│   └── SortDropdown
│       ├── Option "Relevance" (default)
│       ├── Option "Episodes (most)"
│       ├── Option "Name (A-Z)"
│       └── Option "Publisher"
├── ResultsSummary "Showing 1-20 of 142 results for {q}"
├── SearchResults (src/components/search/SearchResults.tsx)
│   ├── PodcastGrid (when tab=Podcasts)
│   │   └── PodcastCard[] (src/components/shared/PodcastCard.tsx)
│   │       ├── Cover art (next/image, 640x640 -> responsive)
│   │       ├── Podcast name (truncated 2 lines)
│   │       ├── Publisher name
│   │       ├── Episode count badge
│   │       ├── Language badge(s)
│   │       └── Explicit badge (if applicable)
│   └── EpisodeGrid (when tab=Episodes)
│       └── EpisodeCard[] (src/components/shared/EpisodeCard.tsx)
│           ├── Episode cover art
│           ├── Episode name (truncated 2 lines)
│           ├── Show name (link to podcast)
│           ├── Release date
│           ├── Duration formatted (mm:ss or h:mm:ss)
│           └── Explicit badge (if applicable)
├── Pagination (src/components/search/Pagination.tsx)
│   ├── PrevButton (disabled on page 1)
│   ├── PageInfo "Page X of Y"
│   └── NextButton (disabled on last page)
├── LoadingState (Suspense fallback)
│   └── SkeletonGrid (4-col grid of Skeleton cards)
└── EmptyState (when results.length === 0)
    ├── SearchX icon
    ├── "No results found for {q}"
    └── Suggestions: try different keywords, remove filters
```

---

## Data Requirements

### URL State (Query Parameters)

| Param      | Type    | Default     | Description                        |
|------------|---------|-------------|------------------------------------|
| `q`        | string  | `""`        | Search query                       |
| `type`     | string  | `"show"`    | `show` or `episode`                |
| `market`   | string  | `"VN"`      | Spotify market code                |
| `offset`   | number  | `0`         | Pagination offset                  |
| `limit`    | number  | `20`        | Results per page                   |
| `sort`     | string  | `"relevance"` | Sort field                       |
| `lang`     | string  | `""`        | Language filter (vi, en, or empty) |
| `explicit` | string  | `"any"`     | Explicit filter (any, yes, no)     |
| `epMin`    | number  | `0`         | Minimum episode count              |
| `epMax`    | number  | `""`        | Maximum episode count              |
| `publisher`| string  | `""`        | Publisher name filter              |

### API Call

```
GET /api/search?q={q}&type={type}&market={market}&offset={offset}&limit={limit}
```

### Response Schema

```typescript
interface SearchResponse {
  shows?: {
    items: SpotifyShow[];
    total: number;
    offset: number;
    limit: number;
    next: string | null;
    previous: string | null;
  };
  episodes?: {
    items: SpotifyEpisode[];
    total: number;
    offset: number;
    limit: number;
    next: string | null;
    previous: string | null;
  };
}
```

### Client-Side Filtering

Some filters are applied client-side after fetching results from the API (Spotify API does not support all filter params):

- **Language filter**: Filter `items` where `languages` includes selected value
- **Explicit filter**: Filter `items` by `explicit` boolean
- **Episode count range**: Filter shows where `total_episodes` is within range
- **Publisher filter**: Filter shows where `publisher` includes search string (case-insensitive)

### Sorting

- **Relevance**: Default Spotify ordering (no re-sort)
- **Episodes (most)**: Sort by `total_episodes` descending
- **Name (A-Z)**: Sort by `name` ascending, locale-aware
- **Publisher**: Sort by `publisher` ascending, locale-aware

---

## User Interactions

| Interaction                      | Behavior                                                      |
|----------------------------------|---------------------------------------------------------------|
| Type in search bar + Enter       | Updates `q` param, triggers new fetch, resets offset to 0     |
| Click "Search" button            | Same as Enter                                                 |
| Toggle Podcasts/Episodes tab     | Updates `type` param, resets offset to 0                      |
| Change sort dropdown             | Updates `sort` param, re-sorts results client-side            |
| Change language filter           | Updates `lang` param, filters results client-side             |
| Change market select             | Updates `market` param, triggers new API fetch                |
| Change explicit filter           | Updates `explicit` param, filters client-side                 |
| Set episode count range          | Updates `epMin`/`epMax` params, filters client-side           |
| Type publisher name              | Updates `publisher` param (debounced 300ms), filters client   |
| Click "Reset Filters"            | Clears all filter params, keeps `q`                           |
| Click "Next" / "Prev"            | Updates `offset`, triggers new API fetch                      |
| Click podcast card               | Navigate to `/podcast/{id}`                                   |
| Click episode card               | Navigate to `/episode/{id}`                                   |
| Click show name on episode card  | Navigate to `/podcast/{showId}`                               |
| Click "Filters" button (mobile)  | Opens Sheet with filter controls                              |
| Click "Apply" in filter Sheet    | Closes Sheet, applies filters                                 |

---

## Responsive Behavior

| Breakpoint        | Grid Columns | Filters          | Card Layout           |
|-------------------|-------------|------------------|-----------------------|
| `>= 1280px` (xl) | 4 columns   | Sidebar (sticky) | Vertical card         |
| `1024-1279px` (lg)| 3 columns   | Sidebar          | Vertical card         |
| `768-1023px` (md) | 2 columns   | Collapsible bar  | Vertical card         |
| `< 768px` (sm)    | 1 column    | Sheet overlay    | Horizontal card (row) |

### CSS Notes

```
FilterSidebar -> hidden md:block w-64 sticky top-20
PodcastGrid   -> grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
EpisodeGrid   -> grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
PodcastCard   -> sm: flex flex-row (horizontal), md+: flex flex-col (vertical)
```

---

## Loading States

| State                     | Display                                                    |
|---------------------------|------------------------------------------------------------|
| Initial load with `q`    | Skeleton grid (8 cards) with pulsing placeholders          |
| Pagination (next/prev)   | Skeleton grid replaces current results                     |
| Filter change (client)   | Instant, no loading state needed                           |
| Tab switch               | Skeleton grid if data not yet fetched for that type        |

---

## Empty States

| Condition                          | Display                                              |
|-------------------------------------|------------------------------------------------------|
| No `q` param (blank search)        | "Enter a search term to discover Vietnamese podcasts" |
| `q` present but 0 results          | "No results found for '{q}'" + suggestions           |
| 0 results after client-side filter | "No results match your filters. Try adjusting them." |

---

## Error States

| Error          | Display                                               |
|----------------|-------------------------------------------------------|
| API 429        | "Too many requests. Please wait a moment and retry."  |
| API 500        | "Something went wrong. Please try again."             |
| Network error  | "Unable to connect. Check your internet connection."  |

---

## SEO

```typescript
export function generateMetadata({ searchParams }: Props): Metadata {
  const q = searchParams.q || '';
  return {
    title: q ? `"${q}" - Search - PodcastW4GZ` : 'Search - PodcastW4GZ',
    description: `Search Vietnamese podcasts${q ? ` for "${q}"` : ''}. Filter by language, market, and more.`,
  };
}
```
