---
id: comparison
title: Comparison Tools
phase: 1
status: planned
priority: high
depends_on:
  - podcast-detail
  - analytics
api_routes:
  - POST /api/compare
screens:
  - /compare
created: 2026-02-27
updated: 2026-02-27
---

# Comparison Tools

## Overview

The comparison feature enables side-by-side comparison of 2 to 4 podcasts. Users select podcasts via a search-and-add interface, and the system fetches analytics for each show then renders a comparison table and charts. Metrics compared include total episodes, average episode duration, release frequency, total content hours, and languages. Visualizations use Recharts BarChart for metric comparison and RadarChart for multi-dimensional comparison. A publisher comparison mode groups metrics by publisher.

## User Stories

- **US-01**: As a researcher, I want to compare 2-4 podcasts side by side so I can evaluate their relative scale and activity.
- **US-02**: As a researcher, I want bar charts comparing specific metrics so I can visually spot differences.
- **US-03**: As a researcher, I want a radar chart showing multi-dimensional comparison so I can see overall profiles at a glance.
- **US-04**: As a researcher, I want to compare publishers so I can understand which publishers dominate the ecosystem.
- **US-05**: As a researcher, I want to add podcasts to comparison from the detail page so I can build my comparison set while browsing.

## Technical Spec

### API Route

#### POST /api/compare

File: `src/app/api/compare/route.ts`

**Request body:**

```typescript
interface CompareRequest {
  showIds: string[]; // 2-4 Spotify show IDs
}
```

**Validation:**

- `showIds` must be an array of 2 to 4 strings
- Each ID must be a valid Spotify show ID (22-char alphanumeric)
- Return 400 if validation fails

**Request flow:**

```
POST /api/compare
Body: { "showIds": ["id1", "id2", "id3"] }
  -> Validate request body
  -> For each showId in parallel:
       -> Fetch analytics: GET /api/analytics/{id} (uses cached data if available)
  -> Aggregate into comparison response
  -> Return JSON
```

**Response shape:**

```typescript
interface CompareResponse {
  shows: Array<{
    id: string;
    name: string;
    publisher: string;
    imageUrl: string;
    languages: string[];
    metrics: {
      totalEpisodes: number;
      avgDurationMs: number;
      avgDurationMinutes: number;
      totalContentHours: number;
      avgDaysBetweenReleases: number;
      schedule: string;
      activeStatus: string;
      lastEpisodeDate: string;
      longestGapDays: number;
    };
  }>;
  publisherGroups: Record<string, {
    publisher: string;
    showCount: number;
    totalEpisodes: number;
    totalContentHours: number;
  }>;
}
```

**Error responses:**

| Status | Condition                                 |
|--------|-------------------------------------------|
| 400    | Missing or invalid `showIds`              |
| 400    | Fewer than 2 or more than 4 IDs          |
| 404    | One or more show IDs not found on Spotify |
| 502    | Spotify API error                         |

### Components

#### CompareSelector

File: `src/components/compare/compare-selector.tsx`

```typescript
interface CompareSelectorProps {
  selectedIds: string[];
  onAdd: (show: SpotifyShow) => void;
  onRemove: (id: string) => void;
}
```

**Layout:**

```
+----------------------------------------------------------+
|  Search podcasts to compare                               |
|  [Search input________________________] [Search]         |
|                                                           |
|  Selected (2/4):                                         |
|  +--------+ +--------+ +--------+                        |
|  | Cover  | | Cover  | | Cover  | | + Add |              |
|  | Name   | | Name   | | Name   |                        |
|  | [x]    | | [x]    | | [x]    |                        |
|  +--------+ +--------+ +--------+                        |
|                                                           |
|  [Compare Now]                                           |
+----------------------------------------------------------+
```

- Search input: reuses `SearchBar` component with `onSearch` that fetches `/api/search?q={query}&type=show&market=VN&limit=5`
- Search results dropdown: absolute positioned below input, shows up to 5 results as clickable rows (image + name + publisher)
- Selected shows: horizontal flex with `gap-3`, each as a mini card (80x80 image, name, remove X button)
- Remove button: shadcn/ui `Button` variant `ghost` size `icon` with `X` icon (lucide-react)
- "Add" placeholder: dashed border card with `Plus` icon, shown when `selectedIds.length < 4`
- "Compare Now" button: shadcn/ui `Button` variant `default`, disabled when `selectedIds.length < 2`
- Maximum 4 selections enforced; search dropdown hides when 4 are selected
- Selected IDs stored in localStorage key `compareIds` as JSON array
- On mount, restore selections from localStorage

**State persistence via URL:**

Compare page URL: `/compare?ids=id1,id2,id3`

When "Compare Now" is clicked, navigate to `/compare?ids={selectedIds.join(',')}` and trigger the POST request.

#### CompareTable

File: `src/components/compare/compare-table.tsx`

```typescript
interface CompareTableProps {
  data: CompareResponse;
}
```

**Layout:**

```
+------------------+------------+------------+------------+
| Metric           | Podcast A  | Podcast B  | Podcast C  |
+------------------+------------+------------+------------+
| Cover Art        | [image]    | [image]    | [image]    |
| Publisher        | ABC        | XYZ        | DEF        |
| Total Episodes   | 120        | 85         | 42         |
| Avg Duration     | 45:23      | 32:10      | 58:45      |
| Content Hours    | 90.5h      | 45.3h      | 41.1h      |
| Release Freq     | Every 7d   | Every 14d  | Every 30d  |
| Schedule         | Weekly     | Biweekly   | Monthly    |
| Status           | Active     | Active     | On Hiatus  |
| Last Episode     | 2026-02-20 | 2026-02-15 | 2025-11-01 |
| Languages        | [vi]       | [vi][en]   | [vi]       |
+------------------+------------+------------+------------+
```

- shadcn/ui `Table` with sticky first column
- Header row: podcast name + small cover art (48x48)
- Metric rows: left-aligned labels, center-aligned values
- Highlight best values: the cell with the highest `totalEpisodes`, lowest `avgDaysBetweenReleases`, highest `totalContentHours` gets `font-bold text-primary`
- Active status uses color coding: green/yellow/red
- Responsive: on mobile (<768px), switch to stacked card layout instead of table

#### CompareCharts

File: `src/components/compare/compare-charts.tsx`

```typescript
interface CompareChartsProps {
  data: CompareResponse;
}
```

**Bar Chart (metric comparison):**

- Recharts `BarChart` with `ResponsiveContainer` (width: 100%, height: 400px)
- Grouped bars: one group per metric, one bar per podcast
- Metrics shown: Total Episodes, Content Hours, Avg Duration (minutes), Release Frequency (days)
- Each podcast gets a distinct color from a predefined palette: `["#2563eb", "#dc2626", "#16a34a", "#ca8a04"]`
- Legend: podcast names with color indicators
- Tooltip: show podcast name, metric name, value with unit

**Radar Chart (multi-dimensional):**

- Recharts `RadarChart` with `PolarGrid`, `PolarAngleAxis`, `PolarRadiusAxis`
- Dimensions (5 axes): Episodes (normalized 0-100), Avg Duration, Content Hours, Frequency (inverted: lower is better), Consistency (based on gap analysis)
- Normalization: each metric normalized to 0-100 scale relative to the max value in the comparison set
- One `Radar` polygon per podcast, semi-transparent fill with distinct colors
- Size: 400x400px centered

```typescript
function normalizeForRadar(shows: CompareResponse["shows"]): RadarData[] {
  const maxEpisodes = Math.max(...shows.map(s => s.metrics.totalEpisodes));
  const maxDuration = Math.max(...shows.map(s => s.metrics.avgDurationMinutes));
  const maxHours = Math.max(...shows.map(s => s.metrics.totalContentHours));
  const maxFreq = Math.max(...shows.map(s => s.metrics.avgDaysBetweenReleases));
  const maxGap = Math.max(...shows.map(s => s.metrics.longestGapDays));

  return [
    { axis: "Episodes", ...Object.fromEntries(shows.map(s => [s.name, (s.metrics.totalEpisodes / maxEpisodes) * 100])) },
    { axis: "Avg Duration", ...Object.fromEntries(shows.map(s => [s.name, (s.metrics.avgDurationMinutes / maxDuration) * 100])) },
    { axis: "Content Hours", ...Object.fromEntries(shows.map(s => [s.name, (s.metrics.totalContentHours / maxHours) * 100])) },
    { axis: "Frequency", ...Object.fromEntries(shows.map(s => [s.name, (1 - s.metrics.avgDaysBetweenReleases / maxFreq) * 100])) },
    { axis: "Consistency", ...Object.fromEntries(shows.map(s => [s.name, (1 - s.metrics.longestGapDays / maxGap) * 100])) },
  ];
}
```

#### PublisherCompare

File: `src/components/compare/publisher-compare.tsx`

```typescript
interface PublisherCompareProps {
  publisherGroups: CompareResponse["publisherGroups"];
}
```

- Rendered only when selected podcasts have 2+ distinct publishers
- shadcn/ui `Card` with table showing: Publisher, Shows in Comparison, Total Episodes, Total Content Hours
- Recharts horizontal `BarChart` comparing publishers

### Page Component

File: `src/app/compare/page.tsx`

```typescript
"use client";

export default function ComparePage() {
  // Read ?ids= from URL search params
  // If ids present: fetch POST /api/compare with those IDs
  // If no ids: show CompareSelector only

  return (
    <div>
      <CompareSelector selectedIds={ids} onAdd={handleAdd} onRemove={handleRemove} />
      {compareData && (
        <>
          <CompareTable data={compareData} />
          <CompareCharts data={compareData} />
          {hasMultiplePublishers && <PublisherCompare publisherGroups={compareData.publisherGroups} />}
        </>
      )}
    </div>
  );
}
```

### Data Flow

```
ComparePage
  |
  +-- CompareSelector
  |     +-- SearchBar (search podcasts to add)
  |     +-- Selected show cards with remove buttons
  |     +-- "Compare Now" button -> updates URL ?ids=
  |
  +-- (on compare trigger) POST /api/compare { showIds }
  |
  +-- CompareTable (side-by-side metrics table)
  |
  +-- CompareCharts
  |     +-- BarChart (grouped metric bars)
  |     +-- RadarChart (multi-dimensional polygon)
  |
  +-- PublisherCompare (if multiple publishers)
```

### Cross-Feature Integration

- **PodcastDetailHeader** has a "Compare" button that adds the show ID to localStorage `compareIds` array and shows a toast notification: "Added to comparison ({count}/4)"
- Navigating to `/compare` pre-populates `CompareSelector` from localStorage
- URL `?ids=` takes priority over localStorage when both exist

## Acceptance Criteria

- [ ] POST /api/compare returns comparison data for 2-4 valid show IDs
- [ ] POST /api/compare returns 400 for fewer than 2 or more than 4 IDs
- [ ] CompareSelector allows searching and adding up to 4 podcasts
- [ ] CompareSelector prevents adding more than 4 podcasts
- [ ] Removing a podcast from selection updates the UI immediately
- [ ] "Compare Now" navigates to `/compare?ids=id1,id2,...` and triggers comparison
- [ ] CompareTable displays all metrics side by side with correct values
- [ ] Best values in each metric row are highlighted with bold primary text
- [ ] On mobile, the comparison table switches to a stacked card layout
- [ ] Bar chart renders grouped bars for each metric with distinct colors per podcast
- [ ] Radar chart renders normalized polygons for each podcast
- [ ] Publisher comparison section appears only when 2+ distinct publishers exist
- [ ] Adding a podcast to comparison from the detail page stores the ID in localStorage
- [ ] Toast notification shows "Added to comparison (X/4)" when adding from detail page
- [ ] Compare page loads pre-selected shows from URL params or localStorage
- [ ] Loading state shows while comparison data is being fetched
