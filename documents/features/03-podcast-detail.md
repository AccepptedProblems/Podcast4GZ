---
id: podcast-detail
title: Podcast Detail & Episodes
phase: 1
status: planned
priority: critical
depends_on:
  - search
  - listing
api_routes:
  - GET /api/shows/[id]
  - GET /api/shows/[id]/episodes
screens:
  - /podcast/[id]
created: 2026-02-27
updated: 2026-02-27
---

# Podcast Detail & Episodes

## Overview

The podcast detail page displays the full metadata for a single podcast show and provides a paginated, sortable, filterable episode listing. Users can view cover art, publisher info, HTML description, language tags, episode count, and link out to Spotify. Episodes are listed 50 per page (Spotify maximum), sortable by release date, duration, and name, and filterable by date range, duration range, and keyword. A 30-second audio preview player is available for episodes that have a preview URL.

## User Stories

- **US-01**: As a researcher, I want to see full podcast metadata so I can understand the show's profile.
- **US-02**: As a researcher, I want to browse all episodes of a podcast with pagination so I can review its full catalog.
- **US-03**: As a researcher, I want to sort episodes by release date so I can see the publishing timeline.
- **US-04**: As a researcher, I want to filter episodes by date range so I can focus on a specific time period.
- **US-05**: As a researcher, I want to search within a podcast's episodes by keyword so I can find specific content.
- **US-06**: As a researcher, I want to listen to a 30-second audio preview so I can sample episode content without leaving the app.
- **US-07**: As a researcher, I want to link directly to Spotify so I can listen to the full episode.

## Technical Spec

### API Routes

#### GET /api/shows/[id]

File: `src/app/api/shows/[id]/route.ts`

| Parameter | Type   | Required | Description             |
|-----------|--------|----------|-------------------------|
| `id`      | string | yes      | Spotify show ID (path)  |
| `market`  | string | no       | Default: `VN`           |

**Request flow:**

```
GET /api/shows/abc123?market=VN
  -> Validate id format (22-char alphanumeric)
  -> Check node-cache (key: show:{id}:{market})
  -> If miss: GET https://api.spotify.com/v1/shows/{id}?market={market}
  -> Cache response (TTL: 24 hours)
  -> Return JSON
```

**Response shape:**

```typescript
interface ShowResponse {
  id: string;
  name: string;
  publisher: string;
  description: string;
  html_description: string;
  languages: string[];
  total_episodes: number;
  explicit: boolean;
  is_externally_hosted: boolean;
  media_type: string;
  images: Array<{ url: string; height: number; width: number }>;
  copyrights: Array<{ text: string; type: string }>;
  external_urls: { spotify: string };
  uri: string;
}
```

#### GET /api/shows/[id]/episodes

File: `src/app/api/shows/[id]/episodes/route.ts`

| Parameter | Type    | Required | Default         | Description                          |
|-----------|---------|----------|-----------------|--------------------------------------|
| `id`      | string  | yes      | -               | Spotify show ID (path)               |
| `market`  | string  | no       | `VN`            | Market code                          |
| `limit`   | integer | no       | `50`            | Episodes per page (max 50)           |
| `offset`  | integer | no       | `0`             | Pagination offset                    |
| `sort`    | string  | no       | `release_date`  | Sort field (client-side)             |
| `order`   | string  | no       | `desc`          | Sort direction: `asc` or `desc`      |

**Request flow:**

```
GET /api/shows/abc123/episodes?market=VN&limit=50&offset=0
  -> Validate id and pagination params
  -> Check node-cache (key: episodes:{id}:{market}:{offset}:{limit})
  -> If miss: GET https://api.spotify.com/v1/shows/{id}/episodes?market={market}&limit={limit}&offset={offset}
  -> Cache response (TTL: 1 hour)
  -> Return JSON (sorting is done client-side)
```

**Response shape:**

```typescript
interface EpisodesResponse {
  items: SpotifyEpisode[];
  total: number;
  limit: number;
  offset: number;
}

interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  html_description: string;
  duration_ms: number;
  release_date: string;
  release_date_precision: "year" | "month" | "day";
  languages: string[];
  explicit: boolean;
  audio_preview_url: string | null;
  images: Array<{ url: string; height: number; width: number }>;
  is_playable: boolean;
  is_externally_hosted: boolean;
  external_urls: { spotify: string };
  uri: string;
}
```

### Components

#### PodcastDetailHeader

File: `src/components/podcast/podcast-detail-header.tsx`

```typescript
interface PodcastDetailHeaderProps {
  show: ShowResponse;
}
```

**Layout:**

```
+--------+--------------------------------------------------+
|        |  Podcast Name                                     |
| Cover  |  by Publisher Name                                |
| Art    |  [vi] [en]  [E]  [External]                      |
| 240x   |  123 episodes  |  "Last episode: 2026-01-15"    |
| 240    |                                                   |
|        |  [Open in Spotify ->]   [Compare]                |
+--------+--------------------------------------------------+
|                                                            |
|  Description (rendered HTML)                               |
|  ...                                                       |
+------------------------------------------------------------+
```

- Cover art: `next/image`, 240x240px, `rounded-lg`, `shadow-md`
- Podcast name: `text-2xl font-bold`
- Publisher: `text-lg text-muted-foreground`, prefixed with "by"
- Language badges: shadcn/ui `Badge` variant `outline` for each item in `languages`
- Explicit badge: shadcn/ui `Badge` variant `destructive` text "Explicit", shown only if `explicit === true`
- External badge: shadcn/ui `Badge` variant `secondary` text "Externally Hosted", shown only if `is_externally_hosted === true`
- Episode count: `text-sm text-muted-foreground`
- Spotify link: shadcn/ui `Button` variant `outline` with Spotify icon, opens `external_urls.spotify` in new tab
- Compare button: shadcn/ui `Button` variant `secondary`, adds show to comparison selection (stored in localStorage key `compareIds`)
- Description: rendered using `dangerouslySetInnerHTML` with `html_description`, wrapped in `prose prose-sm` (Tailwind Typography), sanitized with DOMPurify

#### EpisodeList

File: `src/components/podcast/episode-list.tsx`

```typescript
interface EpisodeListProps {
  showId: string;
  totalEpisodes: number;
}
```

- Fetches episodes from `/api/shows/{showId}/episodes` using `useEffect` with offset/limit state
- Manages local state for: `episodes`, `isLoading`, `offset`, `sort`, `order`, `filters`
- Toolbar row contains: EpisodeSort, EpisodeFilters, result count
- Renders `EpisodeCard` components in a vertical stack
- Pagination controls at bottom

**Episode sort options:**

| Sort Key       | Label              | Default Direction |
|----------------|--------------------|-------------------|
| `release_date` | Release Date       | desc (newest)     |
| `duration_ms`  | Duration           | desc (longest)    |
| `name`         | Name               | asc (A-Z)        |

**Episode filters (client-side on current page):**

| Filter         | Type       | UI Element                                     |
|----------------|------------|------------------------------------------------|
| Date range     | date pair  | Two shadcn/ui `DatePicker` (from, to)          |
| Duration range | number pair| Two `Input` fields: min minutes, max minutes   |
| Keyword search | string     | `Input` with search icon, filters `name` + `description` |

**Client-side filter logic:**

```typescript
function filterEpisodes(episodes: SpotifyEpisode[], filters: EpisodeFilters): SpotifyEpisode[] {
  return episodes.filter(ep => {
    if (filters.dateFrom && ep.release_date < filters.dateFrom) return false;
    if (filters.dateTo && ep.release_date > filters.dateTo) return false;
    if (filters.minDuration && ep.duration_ms < filters.minDuration * 60000) return false;
    if (filters.maxDuration && ep.duration_ms > filters.maxDuration * 60000) return false;
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      return ep.name.toLowerCase().includes(kw) || ep.description.toLowerCase().includes(kw);
    }
    return true;
  });
}
```

#### EpisodeCard

File: `src/components/podcast/episode-card.tsx`

```typescript
interface EpisodeCardProps {
  episode: SpotifyEpisode;
}
```

**Layout:**

```
+-------+----------------------------------------------+--------+
| Cover | Episode Name                                 | Play   |
| 64x64 | Released: 2026-01-15  |  Duration: 45:23    | Button |
|       | Description preview (2 lines)...             |        |
|       | [Spotify ->]                                 |        |
+-------+----------------------------------------------+--------+
```

- shadcn/ui `Card` with horizontal flex layout
- Cover art: `next/image`, 64x64px, `rounded-md`
- Episode name: `font-medium text-sm`, `line-clamp-1`
- Release date: formatted with `Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' })`
- Duration: formatted as `HH:MM:SS` from `duration_ms` using helper `formatDuration(ms: number): string`
- Description: `text-xs text-muted-foreground line-clamp-2`
- Spotify link: shadcn/ui `Button` variant `ghost` size `sm` with external link icon
- Explicit badge: small "E" badge if `explicit === true`

#### AudioPreviewPlayer

File: `src/components/podcast/audio-preview-player.tsx`

```typescript
interface AudioPreviewPlayerProps {
  previewUrl: string | null;
  episodeName: string;
}
```

- If `previewUrl` is `null`: render disabled button with tooltip "No preview available"
- If `previewUrl` exists: render play/pause toggle button with `Play` / `Pause` icons (lucide-react)
- Uses `HTMLAudioElement` via `useRef<HTMLAudioElement>`
- State: `isPlaying: boolean`
- On play: create `new Audio(previewUrl)`, call `.play()`, set `isPlaying = true`
- On pause: call `.pause()`, set `isPlaying = false`
- On audio `ended` event: set `isPlaying = false`
- Only one preview plays at a time globally: dispatch custom event `preview-play` with episode ID; other players listen and pause themselves
- Progress bar: thin `div` with `bg-primary` showing elapsed time as percentage of 30 seconds
- Button size: `sm`, variant: `outline`

### Page Component

File: `src/app/podcast/[id]/page.tsx`

```typescript
// Server component
export default async function PodcastDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Fetch show data server-side for SEO
  const show = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shows/${params.id}`).then(r => r.json());

  return (
    <>
      <PodcastDetailHeader show={show} />
      <EpisodeList showId={params.id} totalEpisodes={show.total_episodes} />
    </>
  );
}

// Metadata
export async function generateMetadata({ params }: { params: { id: string } }) {
  const show = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shows/${params.id}`).then(r => r.json());
  return {
    title: `${show.name} - PodcastW4GZ`,
    description: show.description?.substring(0, 160),
  };
}
```

### Data Flow

```
PodcastDetailPage (server component, fetches show)
  |
  +-- PodcastDetailHeader (show metadata, static render)
  |
  +-- EpisodeList (client component, manages episodes state)
        |
        +-- Toolbar: EpisodeSort + EpisodeFilters + ResultCount
        |
        +-- EpisodeCard[] (sorted + filtered episodes)
        |     +-- AudioPreviewPlayer (per episode)
        |
        +-- PaginationControls
```

## Acceptance Criteria

- [ ] Navigating to `/podcast/{id}` displays the full show metadata
- [ ] Cover art renders at 240x240 with rounded corners and shadow
- [ ] HTML description is rendered correctly and sanitized against XSS
- [ ] Language tags display for each language in the `languages` array
- [ ] Explicit badge shows only when `explicit === true`
- [ ] "Open in Spotify" button opens the correct Spotify URL in a new tab
- [ ] Episode list loads first 50 episodes by default, sorted by release date (newest first)
- [ ] Changing sort field re-orders episodes on the current page
- [ ] Date range filter only shows episodes within the selected date range
- [ ] Duration range filter only shows episodes within the specified minutes range
- [ ] Keyword filter matches against episode name and description (case-insensitive)
- [ ] Pagination correctly navigates between episode pages (50 per page)
- [ ] Episode card displays: cover art, name, release date, duration, description preview
- [ ] Audio preview play button works for episodes with `audio_preview_url`
- [ ] Playing one preview automatically pauses any other currently playing preview
- [ ] Episodes without `audio_preview_url` show a disabled play button with tooltip
- [ ] Show data is cached for 24 hours; episode data is cached for 1 hour
- [ ] Page metadata (title, description) is set server-side for SEO
- [ ] Release dates are formatted using Vietnamese locale (`vi-VN`)
