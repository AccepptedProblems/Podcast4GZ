---
openspec: 0.1.0
kind: screen
metadata:
  name: Analytics Dashboard
  description: Vietnamese podcast landscape overview with aggregate stats cards, language distribution pie chart, publisher ranking bar chart, episodes distribution histogram, and content ratio visualizations.
  status: planned
  phase: 2
  route: /analytics
  file: src/app/analytics/page.tsx
  updated: 2026-02-27
dependencies:
  packages:
    - recharts
    - lucide-react
  components:
    - "@/components/analytics/StatsCards"
    - "@/components/analytics/LanguageChart"
    - "@/components/analytics/PublisherChart"
    - "@/components/analytics/DistributionCharts"
    - "@/components/ui/card"
    - "@/components/ui/skeleton"
    - "@/components/ui/select"
    - "@/components/ui/tabs"
  api-routes:
    - GET /api/analytics/landscape (aggregate endpoint)
---

# Analytics Dashboard

## Overview

The Analytics Dashboard provides a bird's-eye view of the Vietnamese podcast landscape. It aggregates data from all indexed podcasts to show total counts, language distributions, top publishers, episode count distributions, and content type ratios. This page is part of Phase 2 and relies on pre-computed analytics stored in the database.

---

## Wireframe

### Desktop

```
+------------------------------------------------------------------+
|                          HEADER (layout)                          |
+------------------------------------------------------------------+
|                                                                    |
|  Vietnamese Podcast Landscape                                      |
|  Overview of the podcast ecosystem in Vietnam                      |
|  Last updated: Feb 27, 2026  [Refresh]                            |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  +-------------+ +-------------+ +-------------+ +-------------+  |
|  | Total       | | Total       | | Unique      | | Content     |  |
|  | Podcasts    | | Episodes    | | Publishers  | | Hours       |  |
|  |             | |             | |             | |             |  |
|  |   1,247     | |  38,920     | |    412      | |  19,560     |  |
|  | +3.2% MTD   | | +5.1% MTD  | | +2.8% MTD  | | +4.7% MTD  |  |
|  +-------------+ +-------------+ +-------------+ +-------------+  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  +-----------------------------+ +-----------------------------+  |
|  | Language Distribution (Pie) | | Top Publishers (Bar)         |  |
|  |                             | |                             |  |
|  |        .-'''-.              | | Publisher A  ████████  12   |  |
|  |      .'  vi   '.           | | Publisher B  ██████  9      |  |
|  |     / (68%)     \          | | Publisher C  █████  7       |  |
|  |    |    .----.   |         | | Publisher D  ████  6        |  |
|  |    |   | en   |  |         | | Publisher E  ███  5         |  |
|  |     \  (22%) /   |         | | Publisher F  ███  4         |  |
|  |      '.other.'   |         | | Publisher G  ██  3          |  |
|  |        '---'     |         | | Publisher H  ██  3          |  |
|  |                   |         | | Publisher I  ██  2          |  |
|  | vi: 848  en: 274  other: 125| | Publisher J  █  2          |  |
|  +-----------------------------+ +-----------------------------+  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Episodes per Podcast Distribution (Histogram)                 | |
|  |                                                               | |
|  |  400|  ████                                                   | |
|  |  300|  ████ ████                                              | |
|  |  200|  ████ ████ ████                                         | |
|  |  100|  ████ ████ ████ ████ ████                               | |
|  |   0 +--+----+----+----+----+----+----+----+---->              | |
|  |      1-10  11-25 26-50 51-100 101-200 201-500 500+            | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  +-----------------------------+ +-----------------------------+  |
|  | Explicit vs Non-Explicit    | | Hosted vs External          |  |
|  |                             | |                             |  |
|  |  Non-Explicit               | |  Spotify-Hosted             |  |
|  |  ████████████████████  92%  | |  ██████████████████  87%    |  |
|  |  Explicit                   | |  Externally Hosted          |  |
|  |  ██  8%                     | |  ████  13%                  |  |
|  |                             | |                             |  |
|  |  1,147 / 100               | |  1,085 / 162               |  |
|  +-----------------------------+ +-----------------------------+  |
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
| Vietnamese Podcast Landscape  |
| Last updated: Feb 27, 2026   |
|                               |
| +-------+ +-------+          |
| |Podcasts| |Episodes|         |
| | 1,247  | | 38,920 |        |
| |+3.2%MTD| |+5.1%MTD|        |
| +-------+ +-------+          |
| +-------+ +-------+          |
| |Publish.| |Hours   |         |
| |  412   | | 19,560 |        |
| |+2.8%MTD| |+4.7%MTD|        |
| +-------+ +-------+          |
|                               |
+-------------------------------+
| Language Distribution         |
|    .--'''--.                  |
|   / vi 68%  \                |
|  |  en 22%   |               |
|   \ other 10%/               |
|    '------'                  |
+-------------------------------+
| Top Publishers                |
| Pub A  ████████ 12           |
| Pub B  ██████ 9              |
| Pub C  █████ 7               |
| ...                           |
+-------------------------------+
| Episode Distribution          |
| (histogram, full width)       |
+-------------------------------+
| Explicit   | Hosted           |
| [92%/8%]   | [87%/13%]        |
+-------------------------------+
```

---

## Component Tree

```
AnalyticsDashboard (src/app/analytics/page.tsx)
├── PageHeader
│   ├── <h1> "Vietnamese Podcast Landscape"
│   ├── <p> "Overview of the podcast ecosystem in Vietnam"
│   ├── LastUpdated "Last updated: {date}"
│   └── RefreshButton (re-fetches analytics)
├── StatsCards (src/components/analytics/StatsCards.tsx)
│   ├── StatCard "Total Podcasts"
│   │   ├── Value: 1,247
│   │   ├── Icon: Mic2
│   │   └── Trend: "+3.2% this month" (green arrow)
│   ├── StatCard "Total Episodes"
│   │   ├── Value: 38,920
│   │   ├── Icon: ListMusic
│   │   └── Trend: "+5.1% this month"
│   ├── StatCard "Unique Publishers"
│   │   ├── Value: 412
│   │   ├── Icon: Building2
│   │   └── Trend: "+2.8% this month"
│   └── StatCard "Content Hours"
│       ├── Value: 19,560
│       ├── Icon: Clock
│       └── Trend: "+4.7% this month"
├── ChartsRow1 (grid: 2 columns)
│   ├── LanguageChart (src/components/analytics/LanguageChart.tsx)
│   │   ├── Card wrapper with title "Language Distribution"
│   │   ├── PieChart (Recharts)
│   │   │   ├── Pie segment "Vietnamese" (vi) - color: primary
│   │   │   ├── Pie segment "English" (en) - color: secondary
│   │   │   └── Pie segment "Other" - color: muted
│   │   └── Legend with counts
│   └── PublisherChart (src/components/analytics/PublisherChart.tsx)
│       ├── Card wrapper with title "Top Publishers"
│       ├── TopN selector (Top 10 / Top 20 / Top 50)
│       └── BarChart (Recharts, horizontal)
│           └── Bars labeled with publisher name + podcast count
├── DistributionCharts (src/components/analytics/DistributionCharts.tsx)
│   ├── EpisodeHistogram
│   │   ├── Card wrapper with title "Episodes per Podcast Distribution"
│   │   └── BarChart (Recharts, vertical)
│   │       └── Bars for buckets: 1-10, 11-25, 26-50, 51-100, 101-200, 201-500, 500+
│   ├── RatioCardsRow (grid: 2 columns)
│   │   ├── ExplicitRatioCard
│   │   │   ├── Title "Explicit vs Non-Explicit"
│   │   │   ├── Progress bar (non-explicit %)
│   │   │   └── Counts: "{nonExplicit} / {explicit}"
│   │   └── HostingRatioCard
│   │       ├── Title "Spotify-Hosted vs External"
│   │       ├── Progress bar (spotify-hosted %)
│   │       └── Counts: "{spotifyHosted} / {external}"
```

---

## Data Requirements

### API Call

```
GET /api/analytics/landscape
```

This is a dedicated endpoint that returns pre-computed aggregate analytics for the entire indexed Vietnamese podcast ecosystem.

### Response Schema

```typescript
interface LandscapeAnalytics {
  lastUpdated: string; // ISO 8601

  totals: {
    podcasts: number;
    episodes: number;
    publishers: number;
    contentHours: number;
  };

  trends: {
    podcastsChange: number;     // percentage change this month
    episodesChange: number;
    publishersChange: number;
    contentHoursChange: number;
  };

  languageDistribution: Array<{
    language: string;     // ISO 639-1 code
    languageName: string; // "Vietnamese", "English", etc.
    count: number;
    percentage: number;
  }>;

  topPublishers: Array<{
    publisher: string;
    showCount: number;
    totalEpisodes: number;
    totalContentHours: number;
  }>;

  episodeDistribution: Array<{
    bucket: string;     // "1-10", "11-25", etc.
    min: number;
    max: number;
    count: number;
  }>;

  explicitRatio: {
    explicit: number;
    nonExplicit: number;
    explicitPercentage: number;
  };

  hostingRatio: {
    spotifyHosted: number;
    externallyHosted: number;
    spotifyPercentage: number;
  };
}
```

### Data Fetching Strategy

- **Server Component** fetches `GET /api/analytics/landscape` with `next: { revalidate: 3600 }` (1-hour ISR).
- The endpoint reads from pre-computed data in the database (computed by a background job).
- The "Refresh" button triggers a client-side re-fetch with cache bypass.

---

## User Interactions

| Interaction                     | Behavior                                                   |
|---------------------------------|------------------------------------------------------------|
| Click "Refresh"                 | Re-fetches analytics data, shows loading state             |
| Hover pie chart segment         | Tooltip: language name, count, percentage                  |
| Click pie chart segment         | Highlights segment, could filter publisher chart by lang   |
| Change "Top N" selector         | Adjusts publisher bar chart to show top 10/20/50           |
| Hover bar chart bar             | Tooltip: publisher name, show count, episode count         |
| Click publisher bar             | Navigate to `/search?q={publisher}&type=show`              |
| Hover histogram bar             | Tooltip: bucket range, podcast count                       |
| Click stat card                 | Scroll to relevant chart section                           |

---

## Responsive Behavior

| Breakpoint        | Layout                                                            |
|-------------------|-------------------------------------------------------------------|
| `>= 1024px` (lg) | Stats 4-col. Charts 2-col grid. Histogram full-width. Ratios 2-col. |
| `768-1023px` (md) | Stats 4-col. Charts stack to 1-col. Histogram full-width. Ratios 2-col. |
| `< 768px` (sm)    | Stats 2x2 grid. All charts full-width stacked. Ratios stacked.    |

### CSS Notes

```
StatsCards          -> grid grid-cols-2 lg:grid-cols-4 gap-4
ChartsRow1          -> grid grid-cols-1 lg:grid-cols-2 gap-6
EpisodeHistogram    -> w-full h-64 md:h-80
RatioCardsRow       -> grid grid-cols-1 md:grid-cols-2 gap-4
PieChart            -> h-64 w-full
PublisherBarChart   -> h-80 w-full
```

---

## Loading States

| Section              | Loading Display                                         |
|----------------------|---------------------------------------------------------|
| Stats cards          | 4 skeleton cards with pulsing number placeholders       |
| Language pie chart   | Circular skeleton placeholder                           |
| Publisher bar chart  | Rectangular skeleton with horizontal lines              |
| Episode histogram    | Rectangular skeleton with vertical bars                 |
| Ratio cards          | Skeleton progress bars                                  |

---

## Empty / Error States

| Condition                  | Display                                                |
|----------------------------|--------------------------------------------------------|
| No analytics data          | "No analytics data available yet. The system is indexing Vietnamese podcasts. Check back later." |
| Partial data               | Show available sections, hide others with "Coming soon" |
| API error                  | Error card with retry button                           |
| Stale data (> 24 hours)   | Warning banner: "Data may be outdated. Click Refresh." |

---

## Chart Configuration

### Recharts Color Palette

```typescript
const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
  // For multi-series:
  series: [
    '#2563eb', // blue-600
    '#16a34a', // green-600
    '#ea580c', // orange-600
    '#9333ea', // purple-600
    '#e11d48', // rose-600
  ],
};
```

### Tooltip Formatting

- Numbers formatted with locale-aware thousand separators (e.g., "1,247")
- Percentages shown to 1 decimal place (e.g., "68.0%")
- Duration in hours shown to 1 decimal place (e.g., "19,560.3 hrs")

---

## SEO

```typescript
export const metadata: Metadata = {
  title: 'Analytics Dashboard - PodcastW4GZ',
  description: 'Explore the Vietnamese podcast landscape. View stats, language distribution, top publishers, and content trends.',
};
```
