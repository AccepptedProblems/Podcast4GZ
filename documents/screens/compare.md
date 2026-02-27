---
openspec: 0.1.0
kind: screen
metadata:
  name: Compare Page
  description: Side-by-side comparison of up to 4 podcasts with metrics table, bar charts, radar chart, and CSV/JSON export.
  status: planned
  phase: 1
  route: /compare
  file: src/app/compare/page.tsx
  updated: 2026-02-27
dependencies:
  packages:
    - recharts
    - lucide-react
    - file-saver (or native Blob download)
  components:
    - "@/components/compare/CompareSelector"
    - "@/components/compare/SelectedPodcasts"
    - "@/components/compare/CompareTable"
    - "@/components/compare/CompareCharts"
    - "@/components/compare/ExportButton"
    - "@/components/shared/PodcastCard"
    - "@/components/ui/input"
    - "@/components/ui/button"
    - "@/components/ui/badge"
    - "@/components/ui/card"
    - "@/components/ui/table"
    - "@/components/ui/skeleton"
    - "@/components/ui/command"
    - "@/components/ui/popover"
    - "@/components/ui/dropdown-menu"
  api-routes:
    - GET /api/search
    - GET /api/shows/[id]
    - GET /api/compare
---

# Compare Page

## Overview

The Compare Page lets users search for and select up to 4 podcasts, then view a side-by-side comparison of their metrics. The comparison includes a data table, bar charts, and a radar chart. Users can export comparison data as CSV or JSON.

---

## Wireframe

### Desktop

```
+------------------------------------------------------------------+
|                          HEADER (layout)                          |
+------------------------------------------------------------------+
|                                                                    |
|  Compare Podcasts                                                  |
|  Select up to 4 podcasts to compare side-by-side                  |
|                                                                    |
|  +------------------------------------------------------+         |
|  | [Search icon] Search and add podcasts...              |         |
|  +------------------------------------------------------+         |
|  | Podcast Result 1 - Publisher A                 [Add]  |         |
|  | Podcast Result 2 - Publisher B                 [Add]  |         |
|  | Podcast Result 3 - Publisher C                 [Add]  |         |
|  +------------------------------------------------------+         |
|                                                                    |
|  Selected (2 of 4):                                                |
|  [Podcast Name A  x] [Podcast Name B  x]  [+ Add more]           |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  Comparison Table                                    [Export v]    |
|  +--------------------------------------------------------------+ |
|  | Metric            | Podcast A     | Podcast B     |          | |
|  |-------------------+---------------+---------------|          | |
|  | Publisher          | Publisher X   | Publisher Y   |          | |
|  | Total Episodes     | 142           | 87            |          | |
|  | Avg Duration       | 38 min        | 52 min        |          | |
|  | Total Content Hrs  | 89.7 hrs      | 75.4 hrs      |          | |
|  | Release Frequency  | Weekly        | Biweekly      |          | |
|  | Languages          | vi            | vi, en        |          | |
|  | Status             | Active        | Active        |          | |
|  | Explicit           | No            | Yes           |          | |
|  | First Episode      | Jan 2022      | Mar 2023      |          | |
|  | Last Episode       | Feb 2026      | Feb 2026      |          | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  +-----------------------------+ +-----------------------------+  |
|  | Episodes Comparison (Bar)   | | Duration Comparison (Bar)   |  |
|  |                             | |                             |  |
|  |  A  ████████████████  142   | |  A  ██████████████  38 min  |  |
|  |  B  ██████████  87          | |  B  ████████████████  52 min|  |
|  |                             | |                             |  |
|  +-----------------------------+ +-----------------------------+  |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |              Multi-Metric Radar Chart                         | |
|  |                                                               | |
|  |                    Episodes                                   | |
|  |                   /        \                                  | |
|  |            Frequency ------- Duration                         | |
|  |                   \        /                                  | |
|  |                   Content Hrs                                 | |
|  |                                                               | |
|  |  ---- Podcast A     .... Podcast B                            | |
|  +--------------------------------------------------------------+ |
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
| Compare Podcasts              |
| Select up to 4 to compare    |
|                               |
| +---------------------------+ |
| | Search podcasts...        | |
| +---------------------------+ |
| | Result 1          [Add]   | |
| | Result 2          [Add]   | |
| +---------------------------+ |
|                               |
| Selected (2/4):               |
| [Podcast A  x]               |
| [Podcast B  x]               |
|                               |
+-------------------------------+
| Table (horizontal scroll)    |
| +---------------------------+ |
| | Metric   | A    | B      | |
| |----------+------+--------|  |
| | Episodes | 142  | 87     | |
| | Avg Dur. | 38m  | 52m    | |
| | ...      | ...  | ...    | |
| +---------------------------+ |
|                     [Export]  |
+-------------------------------+
| Episodes Comparison           |
| A ████████████ 142            |
| B ████████ 87                 |
+-------------------------------+
| Duration Comparison           |
| A ██████████ 38m              |
| B ████████████ 52m            |
+-------------------------------+
| Radar Chart                   |
| (full width)                  |
+-------------------------------+
```

---

## Component Tree

```
ComparePage (src/app/compare/page.tsx)
├── PageHeader
│   ├── <h1> "Compare Podcasts"
│   └── <p> "Select up to 4 podcasts to compare side-by-side"
├── CompareSelector (src/components/compare/CompareSelector.tsx)
│   ├── SearchInput (Combobox: Command + Popover from shadcn/ui)
│   │   ├── Input with search icon
│   │   └── CommandList (dropdown results)
│   │       └── CommandItem[] (podcast name + publisher + [Add] button)
│   └── Debounced search (300ms) -> GET /api/search?q={query}&type=show&limit=5
├── SelectedPodcasts (src/components/compare/SelectedPodcasts.tsx)
│   ├── Label "Selected ({count} of 4):"
│   ├── PodcastChip[] (for each selected podcast)
│   │   ├── Small cover art (24x24)
│   │   ├── Podcast name (truncated)
│   │   └── RemoveButton (X icon)
│   └── AddMoreHint (shown when count < 4)
│       └── "+ Add more podcasts to compare"
├── CompareTable (src/components/compare/CompareTable.tsx)
│   ├── Table (shadcn/ui)
│   │   ├── TableHeader
│   │   │   ├── "Metric"
│   │   │   └── {selectedPodcasts.map(p => p.name)} (column headers)
│   │   └── TableBody
│   │       ├── TableRow "Publisher"
│   │       ├── TableRow "Total Episodes"
│   │       ├── TableRow "Avg Duration"
│   │       ├── TableRow "Total Content Hours"
│   │       ├── TableRow "Release Frequency"
│   │       ├── TableRow "Languages"
│   │       ├── TableRow "Status"
│   │       ├── TableRow "Explicit"
│   │       ├── TableRow "First Episode"
│   │       └── TableRow "Last Episode"
│   └── HighlightBest (green highlight on best value per metric row)
├── CompareCharts (src/components/compare/CompareCharts.tsx)
│   ├── ChartGrid (2 columns desktop, 1 column mobile)
│   │   ├── EpisodesBarChart (Recharts BarChart)
│   │   │   └── Bars colored per podcast, labeled with count
│   │   └── DurationBarChart (Recharts BarChart)
│   │       └── Bars showing average duration in minutes
│   └── RadarChart (Recharts RadarChart)
│       ├── Axes: Episodes, Avg Duration, Content Hours, Frequency, Longevity
│       └── Polygon per podcast (normalized 0-100 scale)
└── ExportButton (src/components/compare/ExportButton.tsx)
    └── DropdownMenu
        ├── MenuItem "Export as CSV"
        └── MenuItem "Export as JSON"
```

---

## Data Requirements

### URL State

| Param | Type   | Default | Description                             |
|-------|--------|---------|-----------------------------------------|
| `ids` | string | `""`    | Comma-separated Spotify show IDs        |

The URL updates as podcasts are added/removed: `/compare?ids=abc123,def456`

### API Calls

1. **Search (selector)**: `GET /api/search?q={query}&type=show&market=VN&limit=5`
2. **Compare data**: `GET /api/compare?ids={id1},{id2},{id3},{id4}`

### Response Schema

```typescript
interface CompareResponse {
  shows: CompareShowData[];
}

interface CompareShowData {
  id: string;
  name: string;
  publisher: string;
  images: Array<{ url: string; height: number; width: number }>;
  totalEpisodes: number;
  avgDurationMs: number;
  totalContentHours: number;
  avgFrequencyDays: number;
  schedulePattern: string;
  languages: string[];
  explicit: boolean;
  status: 'active' | 'on_hiatus' | 'ended';
  firstEpisodeDate: string;
  lastEpisodeDate: string;
  external_urls: { spotify: string };
}

// Radar chart normalization
interface RadarDataPoint {
  metric: string;
  [podcastId: string]: number; // 0-100 normalized
}
```

### Data Flow

1. User searches for a podcast in the selector.
2. User clicks "Add" -- podcast ID is appended to `ids` URL param.
3. When `ids` has 2+ entries, `GET /api/compare?ids=...` is called.
4. Response data populates the table and charts.
5. Adding/removing a podcast re-triggers the comparison fetch.

---

## User Interactions

| Interaction                    | Behavior                                                     |
|--------------------------------|--------------------------------------------------------------|
| Type in search input           | Debounced 300ms, fetches matching podcasts                   |
| Click "Add" on search result   | Adds podcast to selection, updates URL, clears search        |
| Click "X" on selected chip     | Removes podcast from selection, updates URL                  |
| Add 5th podcast (at limit)     | Search input disabled, tooltip "Maximum 4 podcasts"          |
| Hover table row                | Highlight row across all columns                             |
| Hover chart bar                | Tooltip with exact value                                     |
| Hover radar polygon vertex     | Tooltip with metric name and value                           |
| Click "Export as CSV"          | Downloads comparison-{date}.csv                              |
| Click "Export as JSON"         | Downloads comparison-{date}.json                             |
| Click podcast name in header   | Navigate to `/podcast/{id}`                                  |

---

## Responsive Behavior

| Breakpoint        | Layout                                                           |
|-------------------|------------------------------------------------------------------|
| `>= 1024px` (lg) | Search full-width. Chips row. Table full. Charts 2-col grid.     |
| `768-1023px` (md) | Same but table may need horizontal scroll for 4 podcasts.        |
| `< 768px` (sm)    | Chips stack vertically. Table horizontal scroll. Charts stacked. |

### CSS Notes

```
CompareSelector    -> max-w-xl mx-auto
SelectedPodcasts   -> flex flex-wrap gap-2
CompareTable       -> overflow-x-auto
ChartGrid          -> grid grid-cols-1 md:grid-cols-2 gap-6
RadarChart         -> max-w-lg mx-auto h-80
ExportButton       -> absolute top-0 right-0 (relative to table section)
```

---

## Loading States

| State                      | Display                                            |
|----------------------------|----------------------------------------------------|
| Searching for podcasts     | Spinner in search input + "Searching..."           |
| Loading comparison data    | Table and chart skeletons with pulsing placeholders|
| No results for search      | "No podcasts found for '{query}'"                  |

---

## Empty / Minimum States

| Condition                  | Display                                              |
|----------------------------|------------------------------------------------------|
| 0 podcasts selected        | Illustration + "Search and add podcasts to compare"  |
| 1 podcast selected         | Partial table (single column) + "Add at least one more podcast to see a comparison" |
| 2-4 podcasts selected      | Full comparison table and charts                     |

---

## Export Formats

### CSV Format

```csv
Metric,Podcast A,Podcast B,Podcast C
Publisher,Publisher X,Publisher Y,Publisher Z
Total Episodes,142,87,63
Avg Duration (min),38,52,29
Total Content Hours,89.7,75.4,30.5
...
```

### JSON Format

```json
{
  "exported": "2026-02-27T10:30:00Z",
  "podcasts": [
    {
      "name": "Podcast A",
      "publisher": "Publisher X",
      "totalEpisodes": 142,
      "avgDurationMin": 38,
      "totalContentHours": 89.7
    }
  ]
}
```

---

## SEO

```typescript
export const metadata: Metadata = {
  title: 'Compare Podcasts - PodcastW4GZ',
  description: 'Compare Vietnamese podcasts side-by-side. Analyze episodes, duration, frequency, and more.',
};
```
