---
openspec: 0.1.0
kind: screen
metadata:
  name: Podcast Detail Page
  description: Full podcast profile with metadata header, stats badges, tabbed content (Episodes, Analytics, Similar), and episode list with sort/filter controls.
  status: planned
  phase: 1
  route: /podcast/[id]
  file: src/app/podcast/[id]/page.tsx
  updated: 2026-02-27
dependencies:
  packages:
    - recharts
    - lucide-react
    - date-fns
  components:
    - "@/components/podcast/PodcastDetailHeader"
    - "@/components/podcast/StatsRow"
    - "@/components/podcast/EpisodeList"
    - "@/components/podcast/AnalyticsPanel"
    - "@/components/podcast/SimilarPodcasts"
    - "@/components/shared/EpisodeCard"
    - "@/components/shared/PodcastCard"
    - "@/components/ui/tabs"
    - "@/components/ui/badge"
    - "@/components/ui/button"
    - "@/components/ui/select"
    - "@/components/ui/skeleton"
    - "@/components/ui/card"
  api-routes:
    - GET /api/shows/[id]
    - GET /api/shows/[id]/episodes
    - GET /api/analytics/[id]
---

# Podcast Detail Page

## Overview

The Podcast Detail Page displays comprehensive information about a single podcast. It features a large header with cover art, metadata, and external links, followed by quick stats badges, and a tabbed interface for browsing episodes, viewing analytics charts, and discovering similar podcasts.

---

## Wireframe

### Desktop

```
+------------------------------------------------------------------+
|                          HEADER (layout)                          |
+------------------------------------------------------------------+
|                                                                    |
|  +--------+  Podcast Name Here                                    |
|  |        |  by Publisher Name                                    |
|  | COVER  |                                                       |
|  | ART    |  Lorem ipsum dolor sit amet, consectetur adipiscing   |
|  | 300x   |  elit. Sed do eiusmod tempor incididunt ut labore.    |
|  | 300    |  Ut enim ad minim veniam, quis nostrud...             |
|  |        |  [Read more]                                          |
|  +--------+                                                       |
|              [vi] [Explicit] [Spotify-hosted]                     |
|              [Open in Spotify ->]                                  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  +-------------+ +-------------+ +-------------+ +-------------+  |
|  | Total Eps   | | Avg Duration| | Content Hrs | | Status      |  |
|  |    142      | |   38 min    | |   89.7 hrs  | | Active      |  |
|  +-------------+ +-------------+ +-------------+ +-------------+  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  [Episodes (142)]  [Analytics]  [Similar]                          |
|                                                                    |
|  Sort: [Newest first v]  Filter: [All durations v]  Search: [...] |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [Cover] Ep 142: Episode Title Here                            | |
|  |         Feb 20, 2026  |  42:15  |  Lorem ipsum dolor sit...   | |
|  +--------------------------------------------------------------+ |
|  | [Cover] Ep 141: Another Episode Title                         | |
|  |         Feb 13, 2026  |  38:50  |  Sed ut perspiciatis unde...| |
|  +--------------------------------------------------------------+ |
|  | [Cover] Ep 140: Yet Another Episode                           | |
|  |         Feb 6, 2026   |  45:22  |  Ut enim ad minima veniam..| |
|  +--------------------------------------------------------------+ |
|  ...                                                               |
|                                                                    |
|  [Load More Episodes]                                              |
|                                                                    |
+------------------------------------------------------------------+
|                          FOOTER (layout)                          |
+------------------------------------------------------------------+
```

### Analytics Tab (Desktop)

```
+------------------------------------------------------------------+
|  [Episodes (142)]  [Analytics]  [Similar]                          |
|                                                                    |
|  Publishing Overview                                               |
|  +--------------------------------------------------------------+ |
|  | First episode: Jan 3, 2022  |  Last: Feb 20, 2026            | |
|  | Avg frequency: 7 days (weekly)                                | |
|  | Longest break: 45 days (Aug-Sep 2024)                         | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Episode Duration Over Time                                        |
|  +--------------------------------------------------------------+ |
|  |  50|        *                                                 | |
|  |  40|  * *  * * *   * *  *  ** * * *  *  *                     | |
|  |  30| *   **     * *   **  *        **  ** *                   | |
|  |  20|                                                          | |
|  |    +--+--+--+--+--+--+--+--+--+--+--+--+--> time             | |
|  |    2022     2023     2024     2025    2026                    | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Episode Release Timeline                                          |
|  +--------------------------------------------------------------+ |
|  |  8|  |||  || ||| ||| ||| || ||| || ||| ||| ||                 | |
|  |  4|  |||  || ||| ||| ||| || ||| || ||| ||| ||                 | |
|  |  0+--+--+--+--+--+--+--+--+--+--+--+--+--> months            | |
|  |    J F M A M J J A S O N D J F                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Publishing Frequency                                              |
|  +--------------------------------------------------------------+ |
|  | Mon  ██████████████████████████ 45                            | |
|  | Tue  ████████████████ 28                                      | |
|  | Wed  ████████████████████ 35                                  | |
|  | Thu  ██████████████████████████████ 52                        | |
|  | Fri  ████████ 14                                              | |
|  | Sat  ████ 7                                                   | |
|  | Sun  ██ 3                                                     | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

### Mobile

```
+-------------------------------+
|        HEADER (layout)        |
+-------------------------------+
|                               |
|         +--------+            |
|         | COVER  |            |
|         | ART    |            |
|         +--------+            |
|                               |
|  Podcast Name Here            |
|  by Publisher Name             |
|                               |
|  Description text here...     |
|  [Read more]                  |
|                               |
|  [vi] [Explicit]              |
|  [Open in Spotify ->]         |
|                               |
+-------------------------------+
| +------+ +------+ +------+   |
| |142eps| |38 min| |89.7hr|   |
| +------+ +------+ +------+   |
|          +--------+           |
|          | Active |           |
|          +--------+           |
+-------------------------------+
| [Episodes] [Analytics] [Sim] |
|                               |
| Sort: [Newest v]  [Search]   |
|                               |
| +---------------------------+ |
| | Ep 142: Episode Title     | |
| | Feb 20 | 42:15            | |
| +---------------------------+ |
| +---------------------------+ |
| | Ep 141: Another Title     | |
| | Feb 13 | 38:50            | |
| +---------------------------+ |
| ...                           |
| [Load More]                   |
+-------------------------------+
```

---

## Component Tree

```
PodcastDetailPage (src/app/podcast/[id]/page.tsx)
├── PodcastDetailHeader (src/components/podcast/PodcastDetailHeader.tsx)
│   ├── CoverArt (next/image, 300x300 desktop, 200x200 mobile)
│   ├── <h1> Podcast name
│   ├── <p> "by {publisher}"
│   ├── Description (collapsible, "Read more" toggle)
│   ├── Badges row
│   │   ├── Badge language(s) (e.g., "vi", "en")
│   │   ├── Badge "Explicit" (conditional)
│   │   └── Badge hosting type ("Spotify-hosted" | "External")
│   └── SpotifyButton (external link, opens in new tab)
│       └── "Open in Spotify" with Spotify icon
├── StatsRow (src/components/podcast/StatsRow.tsx)
│   ├── StatCard "Total Episodes" -> total_episodes
│   ├── StatCard "Avg Duration" -> computed from episodes
│   ├── StatCard "Content Hours" -> computed from episodes
│   └── StatCard "Status" -> computed (Active / On Hiatus / Ended)
├── Tabs (shadcn/ui)
│   ├── TabsTrigger "Episodes ({total_episodes})"
│   ├── TabsTrigger "Analytics" (Phase 2)
│   └── TabsTrigger "Similar"
│   │
│   ├── TabsContent "Episodes"
│   │   └── EpisodeList (src/components/podcast/EpisodeList.tsx)
│   │       ├── EpisodeControls
│   │       │   ├── SortSelect (Newest, Oldest, Longest, Shortest, A-Z)
│   │       │   ├── DurationFilter (All, < 15min, 15-30min, 30-60min, > 60min)
│   │       │   └── SearchInput (search within episodes)
│   │       ├── EpisodeRow[] (virtualized if > 50)
│   │       │   ├── Cover thumbnail (64x64)
│   │       │   ├── Episode name (link to /episode/{id})
│   │       │   ├── Release date (formatted)
│   │       │   ├── Duration (formatted mm:ss or h:mm:ss)
│   │       │   ├── Description excerpt (1 line, truncated)
│   │       │   └── Explicit badge (conditional)
│   │       └── LoadMoreButton (fetches next page of episodes)
│   │
│   ├── TabsContent "Analytics"
│   │   └── AnalyticsPanel (src/components/podcast/AnalyticsPanel.tsx)
│   │       ├── PublishingOverview
│   │       │   ├── First / Last episode dates
│   │       │   ├── Avg release frequency
│   │       │   ├── Schedule pattern (weekly / biweekly / irregular)
│   │       │   └── Longest content gap
│   │       ├── DurationChart (Recharts LineChart)
│   │       │   └── Episode duration over time (x: date, y: minutes)
│   │       ├── TimelineChart (Recharts BarChart)
│   │       │   └── Episodes per month (x: month, y: count)
│   │       └── FrequencyChart (Recharts BarChart)
│   │           └── Episodes by day of week
│   │
│   └── TabsContent "Similar"
│       └── SimilarPodcasts (src/components/podcast/SimilarPodcasts.tsx)
│           ├── "Based on same publisher" section
│           │   └── PodcastCard[]
│           └── "Based on similar topics" section
│               └── PodcastCard[]
```

---

## Data Requirements

### Primary Data

| Data           | Source                           | Type              | Caching     |
|----------------|----------------------------------|-------------------|-------------|
| Podcast detail | `GET /api/shows/{id}`            | `SpotifyShow`     | 24 hour TTL |
| Episode list   | `GET /api/shows/{id}/episodes`   | `SpotifyEpisode[]`| 1 hour TTL  |
| Analytics      | `GET /api/analytics/{id}`        | `AnalyticsData`   | 1 hour TTL  |
| Similar shows  | `GET /api/search?q={publisher}`  | `SpotifyShow[]`   | 1 hour TTL  |

### TypeScript Interfaces

```typescript
interface PodcastDetailData {
  show: SpotifyShow;
  episodes: {
    items: SpotifyEpisode[];
    total: number;
    offset: number;
    limit: number;
    next: string | null;
  };
}

interface AnalyticsData {
  avgDurationMs: number;
  totalContentHours: number;
  longestEpisode: { id: string; name: string; durationMs: number };
  shortestEpisode: { id: string; name: string; durationMs: number };
  avgFrequencyDays: number;
  schedulePattern: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'irregular';
  longestGapDays: number;
  status: 'active' | 'on_hiatus' | 'ended';
  durationTrend: 'increasing' | 'decreasing' | 'stable';
  firstEpisodeDate: string;
  lastEpisodeDate: string;
  episodesPerMonth: { month: string; count: number }[];
  durationOverTime: { date: string; durationMin: number }[];
  episodesByDayOfWeek: { day: string; count: number }[];
}

type PodcastStatus = 'active' | 'on_hiatus' | 'ended';
// active: last episode < 30 days ago
// on_hiatus: last episode 30-180 days ago
// ended: last episode > 180 days ago
```

### Data Fetching Strategy

1. **Podcast detail**: Server Component fetches `GET /api/shows/{id}` with `next: { revalidate: 86400 }`.
2. **Initial episodes**: Server Component fetches first 20 episodes alongside show data.
3. **More episodes**: Client-side "Load More" fetches additional pages via `GET /api/shows/{id}/episodes?offset={n}`.
4. **Analytics**: Client-side fetch triggered when Analytics tab is selected (lazy load).
5. **Similar**: Client-side fetch triggered when Similar tab is selected (lazy load).

---

## User Interactions

| Interaction                    | Behavior                                                       |
|--------------------------------|----------------------------------------------------------------|
| Click "Read more"              | Expands full description text                                  |
| Click "Open in Spotify"        | Opens `external_urls.spotify` in new tab                       |
| Click language/explicit badge  | No action (informational)                                      |
| Click stat card                | Scrolls to relevant tab content                                |
| Switch tab                     | Shows corresponding content, lazy-loads data if needed         |
| Change episode sort            | Re-sorts episode list client-side                              |
| Change duration filter         | Filters episode list client-side                               |
| Type in episode search         | Filters episodes by name match (debounced 300ms)               |
| Click episode row              | Navigate to `/episode/{id}`                                    |
| Click "Load More Episodes"     | Fetches next page, appends to list                             |
| Hover chart data point         | Shows tooltip with exact values                                |
| Click similar podcast card     | Navigate to `/podcast/{id}`                                    |

---

## Responsive Behavior

| Breakpoint        | Layout                                                          |
|-------------------|-----------------------------------------------------------------|
| `>= 1024px` (lg) | Side-by-side: cover art left, metadata right. Full charts.      |
| `768-1023px` (md) | Side-by-side but compact. Charts scale down.                    |
| `< 768px` (sm)    | Stacked: cover art centered above metadata. Charts full-width.  |

### CSS Notes

```
PodcastDetailHeader -> flex flex-col md:flex-row gap-6
CoverArt            -> w-48 h-48 md:w-72 md:h-72 rounded-lg shadow-lg
StatsRow            -> grid grid-cols-2 md:grid-cols-4 gap-4
EpisodeRow          -> flex items-center gap-4 py-3 border-b hover:bg-muted/50
Charts              -> w-full h-64 md:h-80
```

---

## Loading States

| Section          | Loading Display                                            |
|------------------|------------------------------------------------------------|
| Header           | Skeleton: image placeholder + text lines                   |
| Stats row        | Skeleton: 4 cards with pulsing numbers                     |
| Episode list     | Skeleton: 5 rows with image + text placeholders            |
| Analytics        | Skeleton: placeholder charts with loading spinner overlay  |
| Similar          | Skeleton: 4 podcast cards                                  |
| Load more        | Button shows spinner, text changes to "Loading..."         |

---

## Error States

| Error               | Display                                                   |
|---------------------|-----------------------------------------------------------|
| Podcast not found   | 404 page: "Podcast not found" with link back to search    |
| API error           | Error card with retry button                              |
| Episodes load fail  | "Unable to load episodes" with retry button               |
| Analytics fail      | "Analytics unavailable" with explanation                   |

---

## SEO

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const show = await fetchShow(params.id);
  return {
    title: `${show.name} - PodcastW4GZ`,
    description: show.description?.slice(0, 160),
    openGraph: {
      title: show.name,
      description: show.description?.slice(0, 160),
      images: [show.images?.[0]?.url],
    },
  };
}
```
