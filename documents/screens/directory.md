---
openspec: 0.1.0
kind: screen
metadata:
  name: Directory Page
  description: Browsable A-Z directory of Vietnamese podcasts with fuzzy search (Fuse.js), filter controls, podcast grid, and trending/active sections.
  status: planned
  phase: 3
  route: /directory
  file: src/app/directory/page.tsx
  updated: 2026-02-27
dependencies:
  packages:
    - fuse.js
    - lucide-react
  components:
    - "@/components/directory/AlphabetNav"
    - "@/components/directory/DirectorySearch"
    - "@/components/directory/DirectoryFilters"
    - "@/components/directory/PodcastGrid"
    - "@/components/directory/TrendingSections"
    - "@/components/shared/PodcastCard"
    - "@/components/ui/input"
    - "@/components/ui/button"
    - "@/components/ui/badge"
    - "@/components/ui/card"
    - "@/components/ui/select"
    - "@/components/ui/skeleton"
    - "@/components/ui/toggle-group"
  api-routes:
    - GET /api/directory (paginated, filterable)
    - GET /api/directory/trending
---

# Directory Page

## Overview

The Directory Page provides a comprehensive, browsable listing of all indexed Vietnamese podcasts. Users can navigate by letter (A-Z), search with fuzzy matching powered by Fuse.js, and filter by category, publisher, active status, and episode count. Featured sections highlight new discoveries and most active podcasts.

---

## Wireframe

### Desktop

```
+------------------------------------------------------------------+
|                          HEADER (layout)                          |
+------------------------------------------------------------------+
|                                                                    |
|  Vietnamese Podcast Directory                                      |
|  Browse 1,247 indexed podcasts                                    |
|                                                                    |
|  [A] [B] [C] [D] [E] [F] [G] [H] [I] [J] [K] [L] [M]          |
|  [N] [O] [P] [Q] [R] [S] [T] [U] [V] [W] [X] [Y] [Z] [#]      |
|                                                                    |
|  +------------------------------------------------------+         |
|  | [Search icon] Search directory...                     |         |
|  +------------------------------------------------------+         |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  Filters:                                                          |
|  Category: [All v]  Publisher: [All v]  Status: [All v]           |
|  Episodes: [Any v]                              [Reset filters]   |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  New This Week                                        [View all]  |
|  +----------+ +----------+ +----------+ +----------+             |
|  | [Cover]  | | [Cover]  | | [Cover]  | | [Cover]  |             |
|  | New Pod 1| | New Pod 2| | New Pod 3| | New Pod 4|             |
|  | Publisher | | Publisher | | Publisher | | Publisher |             |
|  | NEW badge| | NEW badge| | NEW badge| | NEW badge|             |
|  +----------+ +----------+ +----------+ +----------+             |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  Most Active                                          [View all]  |
|  +----------+ +----------+ +----------+ +----------+             |
|  | [Cover]  | | [Cover]  | | [Cover]  | | [Cover]  |             |
|  | Active 1 | | Active 2 | | Active 3 | | Active 4 |             |
|  | Publisher | | Publisher | | Publisher | | Publisher |             |
|  | 8 eps/wk | | 5 eps/wk | | 4 eps/wk | | 3 eps/wk |             |
|  +----------+ +----------+ +----------+ +----------+             |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  All Podcasts - A (47)                                             |
|  +----------+ +----------+ +----------+ +----------+             |
|  | [Cover]  | | [Cover]  | | [Cover]  | | [Cover]  |             |
|  | Podcast  | | Podcast  | | Podcast  | | Podcast  |             |
|  | Publisher| | Publisher| | Publisher| | Publisher|             |
|  | 42 eps   | | 18 eps   | | 95 eps   | | 33 eps   |             |
|  +----------+ +----------+ +----------+ +----------+             |
|  +----------+ +----------+ +----------+ +----------+             |
|  | [Cover]  | | [Cover]  | | [Cover]  | | [Cover]  |             |
|  | ...      | | ...      | | ...      | | ...      |             |
|  +----------+ +----------+ +----------+ +----------+             |
|                                                                    |
|  [Load More]                                                       |
|                                                                    |
+------------------------------------------------------------------+
|                          FOOTER (layout)                          |
+------------------------------------------------------------------+
```

### Mobile

```
+-------------------------------+
|        HEADER (layout)        |
+-------------------------------+
|                               |
| Vietnamese Podcast Directory  |
| 1,247 podcasts                |
|                               |
| [A][B][C][D][E][F][G][H][I]  |
| [J][K][L][M][N][O][P][Q][R]  |
| [S][T][U][V][W][X][Y][Z][#]  |
|                               |
| +---------------------------+ |
| | Search directory...       | |
| +---------------------------+ |
|                               |
| [Filters v]                  |
|                               |
+-------------------------------+
| New This Week                 |
| +----------+ +----------+    |
| | New Pod 1| | New Pod 2|    |
| +----------+ +----------+    |
| (horizontal scroll)          |
+-------------------------------+
| Most Active                   |
| +----------+ +----------+    |
| | Active 1 | | Active 2 |    |
| +----------+ +----------+    |
| (horizontal scroll)          |
+-------------------------------+
| All Podcasts - A (47)        |
| +-----------+ +-----------+  |
| | [Cover]   | | [Cover]   |  |
| | Name      | | Name      |  |
| | Publisher  | | Publisher  |  |
| +-----------+ +-----------+  |
| ...                           |
| [Load More]                   |
+-------------------------------+
```

---

## Component Tree

```
DirectoryPage (src/app/directory/page.tsx)
├── PageHeader
│   ├── <h1> "Vietnamese Podcast Directory"
│   └── <p> "Browse {total} indexed podcasts"
├── AlphabetNav (src/components/directory/AlphabetNav.tsx)
│   ├── LetterButton "A" (with count badge if available)
│   ├── LetterButton "B"
│   ├── ... (A through Z)
│   ├── LetterButton "#" (non-alpha starting chars)
│   └── Active state: highlighted letter, scrolls to section
├── DirectorySearch (src/components/directory/DirectorySearch.tsx)
│   ├── Input with search icon
│   ├── Fuse.js instance (searches name + description + publisher)
│   ├── Debounced input (200ms)
│   └── ResultCount "{n} results for '{query}'"
├── DirectoryFilters (src/components/directory/DirectoryFilters.tsx)
│   ├── CategorySelect
│   │   └── Options: All, Technology, Business, Comedy, Education,
│   │       Health, News, Culture, Music, Society, True Crime
│   ├── PublisherSelect (populated from indexed data)
│   │   └── Options: All + top publishers
│   ├── StatusSelect
│   │   └── Options: All, Active, On Hiatus, Ended
│   ├── EpisodeCountSelect
│   │   └── Options: Any, 1-10, 11-50, 51-100, 100+
│   └── ResetFiltersButton
├── TrendingSections (src/components/directory/TrendingSections.tsx)
│   ├── NewThisWeekSection
│   │   ├── SectionHeader "New This Week" + ViewAllLink
│   │   └── HorizontalScroll
│   │       └── PodcastCard[] (with "NEW" badge)
│   └── MostActiveSection
│       ├── SectionHeader "Most Active" + ViewAllLink
│       └── HorizontalScroll
│           └── PodcastCard[] (with frequency badge, e.g., "8 eps/wk")
└── DirectoryGrid
    ├── SectionHeader "All Podcasts - {letter} ({count})"
    ├── PodcastGrid (src/components/directory/PodcastGrid.tsx)
    │   └── PodcastCard[] (src/components/shared/PodcastCard.tsx)
    │       ├── Cover art (next/image)
    │       ├── Podcast name
    │       ├── Publisher name
    │       ├── Episode count badge
    │       ├── Language badge(s)
    │       └── Status indicator (colored dot)
    └── LoadMoreButton
```

---

## Data Requirements

### API Calls

| Endpoint                       | Purpose                        | Caching     |
|--------------------------------|--------------------------------|-------------|
| `GET /api/directory?letter={L}&category={C}&status={S}&publisher={P}&epRange={R}&offset={O}&limit=24` | Paginated directory listing | 1 hour TTL |
| `GET /api/directory/trending`  | New this week + most active    | 1 hour TTL  |

### Response Schemas

```typescript
interface DirectoryResponse {
  items: DirectoryPodcast[];
  total: number;
  offset: number;
  limit: number;
  letter: string;
  filters: {
    category: string | null;
    status: string | null;
    publisher: string | null;
    epRange: string | null;
  };
}

interface DirectoryPodcast {
  id: string;
  name: string;
  publisher: string;
  description: string;
  images: Array<{ url: string; height: number; width: number }>;
  totalEpisodes: number;
  languages: string[];
  explicit: boolean;
  status: 'active' | 'on_hiatus' | 'ended';
  category: string; // app-assigned category
  lastEpisodeDate: string;
  addedDate: string; // when indexed by PodcastW4GZ
  recentEpisodesPerWeek: number; // for "most active" ranking
}

interface TrendingResponse {
  newThisWeek: DirectoryPodcast[];
  mostActive: DirectoryPodcast[];
}
```

### Fuse.js Configuration

```typescript
const fuseOptions: Fuse.IFuseOptions<DirectoryPodcast> = {
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'publisher', weight: 0.3 },
    { name: 'description', weight: 0.2 },
  ],
  threshold: 0.3,        // fuzzy tolerance
  includeScore: true,
  minMatchCharLength: 2,
};
```

### Data Fetching Strategy

1. **Initial load**: Server Component fetches first page of directory (letter "A", no filters) and trending data in parallel.
2. **Letter navigation**: Client-side fetch for the selected letter.
3. **Fuzzy search**: Runs client-side against the currently loaded data set. If the full directory is not loaded, falls back to API search.
4. **Filters**: Update URL params and trigger new API fetch.
5. **Load more**: Client-side fetch appends next page.
6. **Trending sections**: Fetched once, cached for 1 hour.

---

## User Interactions

| Interaction                     | Behavior                                                    |
|---------------------------------|-------------------------------------------------------------|
| Click letter (A-Z, #)          | Scrolls to letter section, filters grid to that letter      |
| Type in search bar              | Fuse.js fuzzy search across name, publisher, description    |
| Clear search                    | Resets to current letter view                               |
| Change category filter          | Updates URL param, re-fetches filtered results              |
| Change publisher filter         | Updates URL param, re-fetches filtered results              |
| Change status filter            | Updates URL param, re-fetches filtered results              |
| Change episode count filter     | Updates URL param, re-fetches filtered results              |
| Click "Reset filters"           | Clears all filter params                                    |
| Click podcast card              | Navigate to `/podcast/{id}`                                 |
| Click "New This Week" View all  | Scrolls to full new podcasts listing                        |
| Click "Most Active" View all    | Scrolls to full active podcasts listing                     |
| Click "Load More"               | Fetches next page, appends to grid                          |

---

## Responsive Behavior

| Breakpoint        | Layout                                                            |
|-------------------|-------------------------------------------------------------------|
| `>= 1024px` (lg) | Alphabet single row. Filters horizontal row. Grid 4 columns.     |
| `768-1023px` (md) | Alphabet wraps 2 rows. Filters horizontal. Grid 3 columns.       |
| `< 768px` (sm)    | Alphabet wraps 3 rows, smaller buttons. Filters in collapsible dropdown. Grid 2 columns. Trending sections horizontal scroll. |

### CSS Notes

```
AlphabetNav      -> flex flex-wrap gap-1 justify-center
DirectoryFilters -> flex flex-wrap gap-3 items-center
                    (mobile: collapsible, button "Filters" opens)
PodcastGrid      -> grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4
TrendingScroll   -> flex gap-4 overflow-x-auto snap-x snap-mandatory
                    (desktop: grid grid-cols-4)
LetterButton     -> w-9 h-9 text-sm font-medium rounded
                    (active: bg-primary text-primary-foreground)
```

---

## Loading States

| Section             | Loading Display                                          |
|---------------------|----------------------------------------------------------|
| Trending sections   | 4 skeleton cards per section                             |
| Directory grid      | 8 skeleton cards in grid layout                          |
| Letter switch       | Grid shows skeleton while fetching new letter            |
| Search results      | Instant (Fuse.js is client-side), no loading needed      |
| Load more           | Button shows spinner, "Loading..."                       |

---

## Empty States

| Condition                        | Display                                              |
|----------------------------------|------------------------------------------------------|
| No podcasts for letter           | "No podcasts found starting with '{letter}'"         |
| No search results                | "No podcasts match '{query}'. Try a different search."|
| No podcasts match filters        | "No podcasts match your filters. Try adjusting."     |
| Directory not yet populated      | "The directory is being built. Check back soon."     |
| No new podcasts this week        | "No new podcasts discovered this week."              |

---

## URL State

| Param      | Type   | Default | Description                    |
|------------|--------|---------|--------------------------------|
| `letter`   | string | `"A"`   | Selected alphabet letter       |
| `q`        | string | `""`    | Search query                   |
| `category` | string | `""`    | Category filter                |
| `publisher`| string | `""`    | Publisher filter                |
| `status`   | string | `""`    | Status filter (active/hiatus/ended) |
| `epRange`  | string | `""`    | Episode count range            |
| `offset`   | number | `0`     | Pagination offset              |

URL example: `/directory?letter=T&category=technology&status=active`

---

## SEO

```typescript
export function generateMetadata({ searchParams }: Props): Metadata {
  const letter = searchParams.letter || 'A';
  return {
    title: `Directory (${letter}) - PodcastW4GZ`,
    description: 'Browse the complete Vietnamese podcast directory. Filter by category, publisher, and status.',
  };
}
```
