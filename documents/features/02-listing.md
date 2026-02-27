---
id: listing
title: Podcast Listing & Sorting
phase: 1
status: planned
priority: critical
depends_on:
  - search
api_routes:
  - GET /api/search
screens:
  - /search
created: 2026-02-27
updated: 2026-02-27
---

# Podcast Listing & Sorting

## Overview

The listing feature provides the visual presentation layer for search results and directory data. It supports two view modes (grid and list), sorting by multiple fields, pagination with limit/offset, and a result count display. This feature builds on top of the search API and renders results using reusable card components. Sorting is performed client-side on the current page of results and server-side via offset pagination for navigating between pages.

## User Stories

- **US-01**: As a researcher, I want to sort podcasts by total episodes so I can find the most prolific shows.
- **US-02**: As a researcher, I want to sort podcasts alphabetically so I can browse by name.
- **US-03**: As a researcher, I want to toggle between grid and list views so I can choose the layout that suits my workflow.
- **US-04**: As a researcher, I want to see the total number of results so I know the scope of my search.
- **US-05**: As a researcher, I want paginated results so I can browse through large result sets without performance issues.

## Technical Spec

### Sorting

Sorting operates on the current page of fetched results (client-side). Spotify's search API does not support server-side sorting, so we sort the `items` array after fetching.

**Sort options:**

| Sort Key         | Label               | Direction     | Logic                                           |
|------------------|----------------------|---------------|------------------------------------------------|
| `total_episodes` | Episode Count        | desc (default)| `b.total_episodes - a.total_episodes`          |
| `total_episodes` | Episode Count (asc)  | asc           | `a.total_episodes - b.total_episodes`          |
| `name`           | Name (A-Z)           | asc           | `a.name.localeCompare(b.name, 'vi')`          |
| `name`           | Name (Z-A)           | desc          | `b.name.localeCompare(a.name, 'vi')`          |
| `publisher`      | Publisher (A-Z)      | asc           | `a.publisher.localeCompare(b.publisher, 'vi')` |

**Sort state** is stored in URL search params: `?sort=total_episodes&order=desc`

### Pagination

| Parameter | Type    | Default | Max  | Description          |
|-----------|---------|---------|------|----------------------|
| `limit`   | integer | `10`    | `10` | Items per page       |
| `offset`  | integer | `0`     | `1000` | Starting index     |

- Total pages calculated as `Math.ceil(total / limit)`
- Current page calculated as `Math.floor(offset / limit) + 1`
- Navigation: Previous (`offset - limit`), Next (`offset + limit`)
- Disable Previous when `offset === 0`
- Disable Next when `offset + limit >= total` or `offset + limit > 1000`

### View Modes

Two view modes stored in URL search params: `?view=grid` or `?view=list`

| Mode | Layout                                                    |
|------|-----------------------------------------------------------|
| grid | Responsive CSS Grid: 1 col (mobile), 2 col (md), 3 col (lg) |
| list | Single column, full-width rows with horizontal layout     |

### Components

#### PodcastGrid

File: `src/components/listing/podcast-grid.tsx`

```typescript
interface PodcastGridProps {
  podcasts: SpotifyShow[];
  view: "grid" | "list";
  isLoading: boolean;
}
```

- Renders `PodcastCard` components in the selected view layout
- Grid mode: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- List mode: `flex flex-col gap-3`
- Loading state: renders 6 (grid) or 4 (list) skeleton cards matching the layout
- Empty state: centered message "No podcasts found"

#### PodcastCard

File: `src/components/listing/podcast-card.tsx`

```typescript
interface PodcastCardProps {
  podcast: SpotifyShow;
  view: "grid" | "list";
}
```

**Grid mode layout:**

```
+---------------------------+
|  [Cover Art 160x160]      |
|                           |
|  Podcast Name (truncate)  |
|  Publisher Name            |
|  Episodes: 42  |  [vi]   |
+---------------------------+
```

- shadcn/ui `Card` with `CardContent`
- Cover art: `next/image`, 160x160px, `rounded-md`, fallback placeholder gradient
- Title: `font-semibold text-sm`, truncated to 2 lines with `line-clamp-2`
- Publisher: `text-muted-foreground text-xs`, truncated to 1 line
- Episode count: shadcn/ui `Badge` variant `secondary`, text: `{total_episodes} episodes`
- Language tags: map `languages` array to shadcn/ui `Badge` variant `outline`, e.g., `vi`, `en`
- Explicit badge: conditional shadcn/ui `Badge` variant `destructive` with text "E" when `explicit === true`
- Entire card is wrapped in `next/link` to `/podcast/{id}`
- Hover: `hover:shadow-md transition-shadow`

**List mode layout:**

```
+-----+--------------------------------------------+
| IMG | Podcast Name                    [vi] [42ep] |
| 80x | Publisher Name                              |
|     | Description preview (1 line)...             |
+-----+--------------------------------------------+
```

- Horizontal flex layout: image (80x80) on left, metadata on right
- Description: first 120 characters of `description`, `text-muted-foreground text-xs`

#### SortSelect

File: `src/components/listing/sort-select.tsx`

```typescript
interface SortSelectProps {
  value: string; // e.g., "total_episodes:desc"
  onChange: (value: string) => void;
}
```

- shadcn/ui `Select` component
- Options: "Most Episodes", "Fewest Episodes", "Name (A-Z)", "Name (Z-A)", "Publisher (A-Z)"
- Value format: `{field}:{direction}`, e.g., `total_episodes:desc`

#### ViewToggle

File: `src/components/listing/view-toggle.tsx`

```typescript
interface ViewToggleProps {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}
```

- Two shadcn/ui `Button` with variant `ghost` or `outline` depending on active state
- Icons: `LayoutGrid` (grid), `List` (list) from lucide-react
- Active button uses `variant="default"`, inactive uses `variant="ghost"`

#### ResultCount

File: `src/components/listing/result-count.tsx`

```typescript
interface ResultCountProps {
  total: number;
  offset: number;
  limit: number;
}
```

- Text: `Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} results`
- Rendered as `<p className="text-sm text-muted-foreground">`

#### PaginationControls

File: `src/components/listing/pagination-controls.tsx`

```typescript
interface PaginationControlsProps {
  total: number;
  offset: number;
  limit: number;
  onPageChange: (newOffset: number) => void;
}
```

- Uses shadcn/ui `Button` for Previous and Next
- Page indicator text: `Page {currentPage} of {totalPages}`
- Previous disabled when `offset === 0`
- Next disabled when `offset + limit >= total`

### Data Flow

```
SearchPage
  |
  +-- Toolbar row:
  |     +-- ResultCount
  |     +-- SortSelect (updates ?sort=&order= in URL)
  |     +-- ViewToggle (updates ?view= in URL)
  |
  +-- PodcastGrid
  |     +-- PodcastCard[] (sorted client-side)
  |
  +-- PaginationControls (updates ?offset= in URL)
```

**Sort application flow:**

1. Fetch results from `/api/search` (unsorted from Spotify)
2. Read `sort` and `order` from URL params
3. Apply `Array.sort()` on the `items` array using the selected comparator
4. Pass sorted array to `PodcastGrid`

## Acceptance Criteria

- [ ] Results display in a responsive grid by default (1/2/3 columns based on breakpoint)
- [ ] Clicking list view toggle switches to single-column horizontal layout
- [ ] View preference persists in URL params
- [ ] Sort dropdown defaults to "Most Episodes" (total_episodes:desc)
- [ ] Changing sort re-orders the current page of results immediately (no API call)
- [ ] Sort preference persists in URL params
- [ ] Result count accurately shows "Showing X-Y of Z results"
- [ ] Previous button is disabled on the first page
- [ ] Next button is disabled on the last page or when offset would exceed 1000
- [ ] Each PodcastCard displays: cover art, name, publisher, episode count, language tags
- [ ] Explicit podcasts show an "E" badge
- [ ] Clicking a PodcastCard navigates to `/podcast/{id}`
- [ ] Loading state shows skeleton cards matching the current view mode
- [ ] Vietnamese locale collation is used for name and publisher sorting (`localeCompare` with `'vi'`)
