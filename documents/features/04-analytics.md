---
id: analytics
title: Analytics & Insights
phase: 2
status: planned
priority: high
depends_on:
  - podcast-detail
api_routes:
  - GET /api/analytics/[id]
screens:
  - /analytics
  - /podcast/[id]
created: 2026-02-27
updated: 2026-02-27
---

# Analytics & Insights

## Overview

The analytics feature computes insights from raw Spotify podcast data. For each podcast, the system calculates average episode duration, total content hours, release frequency, publishing schedule patterns, activity status, and duration trends. These metrics are derived entirely from episode `duration_ms` and `release_date` fields fetched from the Spotify API. Visualizations use Recharts (BarChart for release timeline, LineChart for duration trends). A Vietnamese landscape dashboard aggregates data across all indexed podcasts to provide ecosystem-level insights.

## User Stories

- **US-01**: As a researcher, I want to see average episode duration and total content hours for a podcast so I can understand its scale.
- **US-02**: As a researcher, I want to see release frequency and schedule patterns so I can understand a podcast's consistency.
- **US-03**: As a researcher, I want a visual timeline of episode releases so I can spot trends and gaps.
- **US-04**: As a researcher, I want to see if episodes are getting longer or shorter over time so I can identify content evolution.
- **US-05**: As a researcher, I want a landscape dashboard showing the overall Vietnamese podcast ecosystem metrics.
- **US-06**: As a researcher, I want publisher-level analytics so I can compare content output across publishers.

## Technical Spec

### API Route

#### GET /api/analytics/[id]

File: `src/app/api/analytics/[id]/route.ts`

| Parameter | Type   | Required | Description            |
|-----------|--------|----------|------------------------|
| `id`      | string | yes      | Spotify show ID (path) |
| `market`  | string | no       | Default: `VN`          |

**Request flow:**

```
GET /api/analytics/abc123
  -> Check node-cache (key: analytics:{id})
  -> If miss:
       -> Fetch show metadata: GET /api/shows/{id}
       -> Fetch ALL episodes by paginating: GET /api/shows/{id}/episodes?limit=50&offset=0,50,100...
       -> Compute analytics from full episode list
       -> Cache result (TTL: 24 hours)
  -> Return computed analytics JSON
```

**Computation logic:**

```typescript
interface AnalyticsResponse {
  showId: string;
  showName: string;
  publisher: string;
  computedAt: string; // ISO 8601 timestamp

  summary: {
    totalEpisodes: number;
    totalDurationMs: number;
    totalContentHours: number;       // totalDurationMs / 3_600_000
    avgDurationMs: number;           // totalDurationMs / totalEpisodes
    avgDurationFormatted: string;    // "HH:MM:SS"
    longestEpisode: { id: string; name: string; durationMs: number };
    shortestEpisode: { id: string; name: string; durationMs: number };
  };

  releasePattern: {
    avgDaysBetweenReleases: number;
    medianDaysBetweenReleases: number;
    schedule: "daily" | "weekly" | "biweekly" | "monthly" | "irregular";
    longestGapDays: number;
    longestGap: { from: string; to: string; days: number };
    shortestGapDays: number;
    activeStatus: "active" | "on-hiatus" | "ended";
    lastEpisodeDate: string;
    daysSinceLastEpisode: number;
  };

  timeline: Array<{
    month: string;        // "YYYY-MM"
    episodeCount: number;
    totalDurationMs: number;
  }>;

  durationTrend: Array<{
    releaseDate: string;
    durationMs: number;
    episodeName: string;
  }>;

  publisherStats: {
    publisher: string;
    totalShows: number; // requires directory data; 1 if not indexed
  };
}
```

**Schedule detection algorithm:**

```typescript
function detectSchedule(avgDays: number): string {
  if (avgDays <= 1.5) return "daily";
  if (avgDays >= 5 && avgDays <= 9) return "weekly";
  if (avgDays >= 12 && avgDays <= 18) return "biweekly";
  if (avgDays >= 25 && avgDays <= 35) return "monthly";
  return "irregular";
}
```

**Active status detection:**

```typescript
function detectActiveStatus(daysSinceLastEpisode: number): string {
  if (daysSinceLastEpisode <= 45) return "active";
  if (daysSinceLastEpisode <= 180) return "on-hiatus";
  return "ended";
}
```

### Components

#### StatsCards

File: `src/components/analytics/stats-cards.tsx`

```typescript
interface StatsCardsProps {
  summary: AnalyticsResponse["summary"];
  releasePattern: AnalyticsResponse["releasePattern"];
}
```

**Layout**: Responsive grid of stat cards, `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`

Each stat card uses shadcn/ui `Card`:

| Card               | Icon (lucide)  | Value                          | Label                     |
|--------------------|----------------|--------------------------------|---------------------------|
| Total Episodes     | `Mic2`         | `{totalEpisodes}`             | "Total Episodes"          |
| Content Hours      | `Clock`        | `{totalContentHours.toFixed(1)}h` | "Content Hours"       |
| Avg Duration       | `Timer`        | `{avgDurationFormatted}`       | "Avg Duration"            |
| Longest Episode    | `ArrowUpRight` | `{formatDuration(longestEpisode.durationMs)}` | "Longest"  |
| Shortest Episode   | `ArrowDownRight`| `{formatDuration(shortestEpisode.durationMs)}`| "Shortest" |
| Release Frequency  | `Calendar`     | `Every {avgDaysBetweenReleases.toFixed(0)} days` | "Avg Frequency" |
| Schedule           | `CalendarClock`| `{schedule}` (capitalized)     | "Schedule Pattern"        |
| Active Status      | `Activity`     | `{activeStatus}` with color    | "Status"                  |

Active status colors: `active` = green (`text-green-600`), `on-hiatus` = yellow (`text-yellow-600`), `ended` = red (`text-red-600`).

#### DurationChart

File: `src/components/analytics/duration-chart.tsx`

```typescript
interface DurationChartProps {
  data: AnalyticsResponse["durationTrend"];
}
```

- Recharts `LineChart` with `ResponsiveContainer` (width: 100%, height: 300px)
- X-axis: `release_date` formatted as "MMM YYYY"
- Y-axis: duration in minutes (`durationMs / 60000`)
- Line: `stroke` = primary color from CSS variable `--primary`, `strokeWidth` = 2
- Tooltip: show episode name, date, formatted duration
- Dot: show on each data point, `r={3}`
- Reference line: horizontal dashed line at `avgDurationMs / 60000` with label "Average"

#### ReleaseTimeline

File: `src/components/analytics/release-timeline.tsx`

```typescript
interface ReleaseTimelineProps {
  data: AnalyticsResponse["timeline"];
}
```

- Recharts `BarChart` with `ResponsiveContainer` (width: 100%, height: 300px)
- X-axis: `month` (YYYY-MM) formatted as "MMM YY"
- Y-axis: `episodeCount`
- Bar: `fill` = primary color, `radius` = `[4, 4, 0, 0]` (rounded top)
- Tooltip: show month, episode count, total hours for that month
- If data spans > 24 months, group by quarter instead of month

#### LandscapeDashboard

File: `src/components/analytics/landscape-dashboard.tsx`

```typescript
interface LandscapeDashboardProps {
  stats: LandscapeStats;
}

interface LandscapeStats {
  totalPodcasts: number;
  totalEpisodes: number;
  totalContentHours: number;
  uniquePublishers: number;
  avgEpisodesPerShow: number;
  languageDistribution: Array<{ language: string; count: number; percentage: number }>;
  explicitRatio: { explicit: number; nonExplicit: number };
  hostingRatio: { spotify: number; external: number };
}
```

- Top row: 4 large stat cards (Total Podcasts, Total Episodes, Content Hours, Publishers)
- Middle row: Recharts `PieChart` for language distribution, `PieChart` for explicit ratio
- Bottom row: Recharts `BarChart` for top 10 publishers by show count
- Only available when directory (Phase 3) has indexed data; shows "Index podcasts first" message otherwise
- Data sourced from SQLite via Prisma aggregation queries

#### PublisherAnalytics

File: `src/components/analytics/publisher-analytics.tsx`

```typescript
interface PublisherAnalyticsProps {
  publishers: Array<{
    name: string;
    showCount: number;
    totalEpisodes: number;
    totalContentHours: number;
    languages: string[];
  }>;
}
```

- shadcn/ui `Table` with columns: Publisher, Shows, Episodes, Content Hours, Languages
- Sortable columns (click header to sort)
- Links publisher name to filtered search: `/search?publisher={name}`

### Page Integration

The analytics are displayed in two locations:

1. **Per-podcast analytics tab** on `/podcast/[id]`: Below the episode list, a collapsible "Analytics" section renders `StatsCards`, `DurationChart`, and `ReleaseTimeline`.

2. **Landscape dashboard** at `/analytics`: Renders `LandscapeDashboard` and `PublisherAnalytics` with data from the indexed directory.

### Data Flow

```
PodcastDetailPage (/podcast/[id])
  |
  +-- PodcastDetailHeader
  +-- EpisodeList
  +-- AnalyticsSection (client component)
        |
        +-- useEffect -> fetch /api/analytics/{id}
        +-- StatsCards
        +-- ReleaseTimeline
        +-- DurationChart

AnalyticsPage (/analytics)
  |
  +-- LandscapeDashboard (server component, queries SQLite)
  +-- PublisherAnalytics (server component, queries SQLite)
```

## Acceptance Criteria

- [ ] GET /api/analytics/{id} returns computed analytics for any valid Spotify show ID
- [ ] Average duration is correctly calculated as total duration divided by episode count
- [ ] Total content hours is the sum of all episode durations converted to hours
- [ ] Longest and shortest episodes are correctly identified with their names and durations
- [ ] Release frequency is the average number of days between consecutive episodes
- [ ] Schedule pattern detection returns correct values: daily (<1.5d), weekly (5-9d), biweekly (12-18d), monthly (25-35d), irregular (other)
- [ ] Active status: "active" if last episode within 45 days, "on-hiatus" within 180 days, "ended" beyond 180 days
- [ ] Content gap analysis correctly identifies the longest break between episodes
- [ ] Release timeline BarChart renders with monthly episode counts
- [ ] Duration trend LineChart renders with each episode plotted chronologically
- [ ] Average duration reference line appears on the duration chart
- [ ] Stats cards display all 8 metrics with correct formatting
- [ ] Analytics data is cached for 24 hours
- [ ] Landscape dashboard shows aggregate metrics from indexed directory data
- [ ] Publisher analytics table is sortable by each column
- [ ] Charts are responsive and resize correctly on all breakpoints
