---
openspec: 0.1.0
kind: screen
metadata:
  name: Home Page
  description: Landing page with hero search, category quick-links, trending podcasts, and ecosystem stats overview.
  status: planned
  phase: 1
  route: /
  file: src/app/page.tsx
  updated: 2026-02-27
dependencies:
  packages:
    - lucide-react
  components:
    - "@/components/home/HeroSection"
    - "@/components/home/CategoryButtons"
    - "@/components/home/TrendingSection"
    - "@/components/home/StatsOverview"
    - "@/components/shared/PodcastCard"
    - "@/components/ui/input"
    - "@/components/ui/button"
    - "@/components/ui/card"
    - "@/components/ui/skeleton"
---

# Home Page

## Overview

The home page serves as the entry point for PodcastW4GZ. It provides a prominent search bar for immediate podcast discovery, quick-access category buttons for browsing by topic, a featured/trending section showcasing popular Vietnamese podcasts, and stats cards summarizing the indexed ecosystem.

---

## Wireframe

### Desktop

```
+------------------------------------------------------------------+
|                          HEADER (layout)                          |
+------------------------------------------------------------------+
|                                                                    |
|                        PodcastW4GZ                                 |
|              Vietnamese Podcast Research Tool                      |
|                                                                    |
|         +------------------------------------------+               |
|         | [Search icon] Search podcasts...    [Go] |               |
|         +------------------------------------------+               |
|                                                                    |
|   [Technology] [Business] [Comedy] [Education] [Health] [News]     |
|   [Culture] [Music] [Society] [True Crime] [More...]               |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  Trending Vietnamese Podcasts                         [View all >] |
|  +------------+ +------------+ +------------+ +------------+      |
|  | [Cover]    | | [Cover]    | | [Cover]    | | [Cover]    |      |
|  | Name       | | Name       | | Name       | | Name       |      |
|  | Publisher  | | Publisher  | | Publisher  | | Publisher  |      |
|  | 42 eps     | | 18 eps     | | 95 eps     | | 33 eps     |      |
|  +------------+ +------------+ +------------+ +------------+      |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  +-------------+ +-------------+ +-------------+ +-------------+  |
|  | Total       | | Total       | | Active      | | Content     |  |
|  | Podcasts    | | Episodes    | | Publishers  | | Hours       |  |
|  |   1,247     | |  38,920     | |    412      | |  19,560     |  |
|  +-------------+ +-------------+ +-------------+ +-------------+  |
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
|       PodcastW4GZ             |
|  Vietnamese Podcast           |
|    Research Tool              |
|                               |
| +---------------------------+ |
| | Search podcasts...   [Go] | |
| +---------------------------+ |
|                               |
| [Tech] [Biz] [Comedy] [Edu]  |
| [Health] [News] [More...]     |
|                               |
+-------------------------------+
| Trending                      |
| +-----------+ +-----------+   |
| | [Cover]   | | [Cover]   |   |
| | Name      | | Name      |   |
| | Publisher  | | Publisher  |   |
| +-----------+ +-----------+   |
| (horizontal scroll)           |
+-------------------------------+
| +-------+ +-------+          |
| |Podcasts| |Episodes|         |
| | 1,247  | | 38,920 |        |
| +-------+ +-------+          |
| +-------+ +-------+          |
| |Publish.| |Hours   |         |
| |  412   | | 19,560 |        |
| +-------+ +-------+          |
+-------------------------------+
|       FOOTER (layout)        |
+-------------------------------+
```

---

## Component Tree

```
HomePage (src/app/page.tsx)
├── HeroSection (src/components/home/HeroSection.tsx)
│   ├── <h1> "PodcastW4GZ"
│   ├── <p> "Vietnamese Podcast Research Tool"
│   └── SearchBar
│       ├── Input (shadcn/ui) with search icon
│       └── Button "Search" (submits form -> /search?q=...)
├── CategoryButtons (src/components/home/CategoryButtons.tsx)
│   ├── Button "Technology" -> /search?q=technology&market=VN
│   ├── Button "Business" -> /search?q=business&market=VN
│   ├── Button "Comedy" -> /search?q=comedy&market=VN
│   ├── Button "Education" -> /search?q=education&market=VN
│   ├── Button "Health" -> /search?q=health&market=VN
│   ├── Button "News" -> /search?q=news&market=VN
│   ├── Button "Culture" -> /search?q=culture&market=VN
│   ├── Button "Music" -> /search?q=music&market=VN
│   ├── Button "Society" -> /search?q=society&market=VN
│   ├── Button "True Crime" -> /search?q=true+crime&market=VN
│   └── Button "More..." -> /directory
├── TrendingSection (src/components/home/TrendingSection.tsx)
│   ├── Section header "Trending Vietnamese Podcasts"
│   ├── Link "View all" -> /directory
│   └── HorizontalScrollContainer
│       └── PodcastCard[] (src/components/shared/PodcastCard.tsx)
│           ├── Cover art image (next/image)
│           ├── Podcast name
│           ├── Publisher name
│           └── Episode count badge
└── StatsOverview (src/components/home/StatsOverview.tsx)
    ├── StatCard "Total Podcasts" (icon: Mic2)
    ├── StatCard "Total Episodes" (icon: ListMusic)
    ├── StatCard "Active Publishers" (icon: Building2)
    └── StatCard "Content Hours" (icon: Clock)
```

---

## Data Requirements

| Data               | Source                      | Type                  | Caching     |
|--------------------|-----------------------------|-----------------------|-------------|
| Trending podcasts  | `GET /api/search?q=podcast&market=VN&limit=8` | `SpotifyShow[]` | 1 hour TTL  |
| Ecosystem stats    | `GET /api/analytics/landscape` (Phase 2+) or static fallback | `StatsData` | 24 hour TTL |

### TypeScript Interfaces

```typescript
interface StatsData {
  totalPodcasts: number;
  totalEpisodes: number;
  activePublishers: number;
  contentHours: number;
}

interface CategoryItem {
  label: string;
  query: string;
  icon?: LucideIcon;
}
```

### Data Fetching Strategy

- **Trending podcasts**: Fetched server-side via `fetch()` in the Server Component with `next: { revalidate: 3600 }` (ISR, 1 hour).
- **Stats**: In Phase 1, hardcoded or computed from a lightweight API call. In Phase 2+, fetched from `/api/analytics/landscape`.
- **Categories**: Static data, no fetch required.

---

## User Interactions

| Interaction               | Behavior                                                      |
|---------------------------|---------------------------------------------------------------|
| Type in search bar        | Local state update, no debounce needed (submit on Enter/click)|
| Press Enter in search bar | Navigate to `/search?q={query}`                               |
| Click "Search" button     | Navigate to `/search?q={query}`                               |
| Click category button     | Navigate to `/search?q={category}&market=VN`                  |
| Click "More..."           | Navigate to `/directory`                                      |
| Click trending podcast    | Navigate to `/podcast/{id}`                                   |
| Click "View all"          | Navigate to `/directory`                                      |
| Click stat card           | Navigate to `/analytics` (Phase 2+)                           |

---

## Responsive Behavior

| Breakpoint        | Behavior                                                          |
|-------------------|-------------------------------------------------------------------|
| `>= 1024px` (lg) | Hero centered. Categories in single row. Trending 4-col grid. Stats 4-col row. |
| `768-1023px` (md) | Hero centered. Categories wrap 2 rows. Trending 3-col grid. Stats 4-col row. |
| `< 768px` (sm)    | Hero full-width. Categories wrap, smaller pills. Trending horizontal scroll. Stats 2x2 grid. |

### CSS Notes

```
HeroSection   -> py-16 lg:py-24 text-center
CategoryButtons -> flex flex-wrap gap-2 justify-center
TrendingSection -> grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4
                   (mobile: overflow-x-auto flex flex-nowrap)
StatsOverview -> grid grid-cols-2 lg:grid-cols-4 gap-4
```

---

## Loading States

- **Trending section**: Renders 4 `Skeleton` cards (cover art placeholder + text lines) while loading.
- **Stats overview**: Renders 4 `Skeleton` cards with pulsing number placeholder.
- Search bar is interactive immediately (no data dependency).

---

## Empty States

- **No trending data**: Show message "Discover Vietnamese podcasts using the search bar above" with a subtle illustration.
- **Stats unavailable**: Show dashes (--) in stat cards or hide section entirely in Phase 1.

---

## SEO

```typescript
export const metadata: Metadata = {
  title: 'PodcastW4GZ - Vietnamese Podcast Research Tool',
  description: 'Search, analyze, and compare Vietnamese podcasts. Powered by Spotify Web API.',
  openGraph: {
    title: 'PodcastW4GZ',
    description: 'Vietnamese Podcast Research & Analysis Tool',
    type: 'website',
  },
}
```
