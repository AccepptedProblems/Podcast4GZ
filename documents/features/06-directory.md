---
id: directory
title: Vietnamese Podcast Directory
phase: 3
status: planned
priority: medium
depends_on:
  - search
  - listing
  - data-management
api_routes:
  - GET /api/directory
  - GET /api/directory/sync
screens:
  - /directory
created: 2026-02-27
updated: 2026-02-27
---

# Vietnamese Podcast Directory

## Overview

The Vietnamese Podcast Directory is a locally indexed, browsable catalog of Vietnamese podcasts. It is built by automated keyword crawling against the Spotify search API, storing discovered podcasts in a SQLite database via Prisma. The directory enables A-Z browsing, filtering by category/publisher/episode count/active status, full-text search with Fuse.js, and sections for trending and newly discovered podcasts. This is the foundation for landscape analytics and topic analysis features.

## User Stories

- **US-01**: As a researcher, I want a complete directory of Vietnamese podcasts so I can browse the ecosystem without repeated searches.
- **US-02**: As a researcher, I want to filter podcasts by category, publisher, and episode count so I can narrow the directory.
- **US-03**: As a researcher, I want full-text search across the directory so I can find podcasts by name or description instantly.
- **US-04**: As a researcher, I want to see newly discovered and trending podcasts so I can stay current.
- **US-05**: As a researcher, I want the directory to automatically refresh so the data stays up to date.

## Technical Spec

### Database Models

File: `prisma/schema.prisma`

```prisma
model IndexedPodcast {
  id                  String   @id // Spotify show ID
  name                String
  publisher           String
  description         String
  htmlDescription     String   @map("html_description")
  languages           String   // JSON array: '["vi"]'
  totalEpisodes       Int      @map("total_episodes")
  explicit            Boolean  @default(false)
  isExternallyHosted  Boolean  @default(false) @map("is_externally_hosted")
  mediaType           String?  @map("media_type")
  imageUrl            String?  @map("image_url")
  spotifyUrl          String   @map("spotify_url")
  uri                 String
  category            String?  // App-assigned category tag
  activeStatus        String   @default("unknown") @map("active_status") // "active" | "on-hiatus" | "ended" | "unknown"
  lastEpisodeDate     String?  @map("last_episode_date") // ISO date string
  firstIndexedAt      DateTime @default(now()) @map("first_indexed_at")
  lastSyncedAt        DateTime @default(now()) @map("last_synced_at")
  syncVersion         Int      @default(0) @map("sync_version")

  episodes            IndexedEpisode[]

  @@index([publisher])
  @@index([activeStatus])
  @@index([totalEpisodes])
  @@index([lastSyncedAt])
  @@map("indexed_podcasts")
}

model IndexedEpisode {
  id                   String   @id // Spotify episode ID
  showId               String   @map("show_id")
  name                 String
  description          String
  durationMs           Int      @map("duration_ms")
  releaseDate          String   @map("release_date")
  releaseDatePrecision String   @map("release_date_precision")
  languages            String   // JSON array
  explicit             Boolean  @default(false)
  audioPreviewUrl      String?  @map("audio_preview_url")
  imageUrl             String?  @map("image_url")
  spotifyUrl           String   @map("spotify_url")
  uri                  String
  lastSyncedAt         DateTime @default(now()) @map("last_synced_at")

  show                 IndexedPodcast @relation(fields: [showId], references: [id], onDelete: Cascade)

  @@index([showId])
  @@index([releaseDate])
  @@map("indexed_episodes")
}
```

### Automated Discovery (Keyword Crawling)

File: `src/lib/directory/crawler.ts`

**Crawl strategy:**

1. Maintain a list of Vietnamese seed keywords:

```typescript
const SEED_KEYWORDS = [
  "podcast", "việt nam", "tiếng việt", "kinh tế", "giáo dục",
  "sức khỏe", "công nghệ", "thể thao", "văn hóa", "lịch sử",
  "tâm lý", "khoa học", "âm nhạc", "hài", "tin tức",
  "truyện", "phim", "đời sống", "tài chính", "marketing",
  "khởi nghiệp", "bất động sản", "du lịch", "ẩm thực",
  "triết học", "tôn giáo", "pháp luật", "nghệ thuật",
];
```

2. For each keyword, paginate through Spotify search results:
   - `GET /search?q={keyword}&type=show&market=VN&limit=10&offset=0..1000`
   - Step offset by 10 until no more results or offset reaches 1000

3. For each discovered show:
   - Check if `languages` contains `"vi"` OR the show was returned with `market=VN`
   - Upsert into `IndexedPodcast` table
   - If new: set `firstIndexedAt` to now
   - Always update `lastSyncedAt` and increment `syncVersion`

4. After indexing shows, for each show fetch all episodes:
   - Paginate `/shows/{id}/episodes?limit=50&offset=0,50,...`
   - Upsert each episode into `IndexedEpisode`

5. Rate limit handling:
   - Queue requests with 100ms delay between each
   - On 429 response: read `Retry-After` header, wait, then resume
   - Exponential backoff: 1s, 2s, 4s, 8s, max 60s

**Crawl trigger:**

- Manual: `GET /api/directory/sync` (requires secret header `x-sync-key` matching env `SYNC_SECRET`)
- Scheduled: can be triggered via Vercel Cron or external scheduler

```typescript
// src/lib/directory/crawler.ts
export async function runCrawl(): Promise<CrawlResult> {
  const result: CrawlResult = { newShows: 0, updatedShows: 0, totalEpisodes: 0, errors: [] };

  for (const keyword of SEED_KEYWORDS) {
    let offset = 0;
    while (offset <= 1000) {
      const data = await searchSpotify(keyword, "show", "VN", 10, offset);
      if (!data.shows?.items?.length) break;

      for (const show of data.shows.items) {
        const isVi = show.languages?.includes("vi");
        if (!isVi) continue; // Only index Vietnamese podcasts

        const existing = await prisma.indexedPodcast.findUnique({ where: { id: show.id } });
        await prisma.indexedPodcast.upsert({
          where: { id: show.id },
          create: mapShowToModel(show),
          update: mapShowToUpdateModel(show),
        });

        if (!existing) result.newShows++;
        else result.updatedShows++;
      }

      offset += 10;
      await delay(100);
    }
  }

  return result;
}
```

### API Routes

#### GET /api/directory

File: `src/app/api/directory/route.ts`

| Parameter    | Type    | Required | Default   | Description                              |
|--------------|---------|----------|-----------|------------------------------------------|
| `page`       | integer | no       | `1`       | Page number (1-indexed)                  |
| `limit`      | integer | no       | `24`      | Items per page (max 100)                 |
| `sort`       | string  | no       | `name`    | Sort field: `name`, `total_episodes`, `publisher`, `last_episode_date` |
| `order`      | string  | no       | `asc`     | `asc` or `desc`                          |
| `letter`     | string  | no       | -         | A-Z filter: first letter of name         |
| `category`   | string  | no       | -         | Category tag filter                      |
| `publisher`  | string  | no       | -         | Publisher name exact match               |
| `minEpisodes`| integer | no       | -         | Minimum total_episodes                   |
| `maxEpisodes`| integer | no       | -         | Maximum total_episodes                   |
| `status`     | string  | no       | -         | `active`, `on-hiatus`, `ended`           |
| `q`          | string  | no       | -         | Full-text search query (Fuse.js)         |

**Request flow:**

```
GET /api/directory?page=1&limit=24&letter=A&status=active
  -> Build Prisma query with filters
  -> If q param: load all matching records, apply Fuse.js search, paginate result
  -> If no q param: use Prisma where clause with pagination
  -> Return paginated results with total count
```

**Response shape:**

```typescript
interface DirectoryResponse {
  items: IndexedPodcast[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  lastCrawledAt: string; // ISO timestamp of most recent sync
}
```

#### GET /api/directory/sync

File: `src/app/api/directory/sync/route.ts`

- Requires header `x-sync-key` matching `process.env.SYNC_SECRET`
- Returns 401 if key is missing or incorrect
- Triggers `runCrawl()` and returns `CrawlResult`
- Long-running: set `maxDuration` in route config for Vercel

### Full-Text Search with Fuse.js

File: `src/lib/directory/search.ts`

```typescript
import Fuse from "fuse.js";

const fuseOptions: Fuse.IFuseOptions<IndexedPodcast> = {
  keys: [
    { name: "name", weight: 2.0 },
    { name: "publisher", weight: 1.5 },
    { name: "description", weight: 1.0 },
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 2,
};

export function searchDirectory(podcasts: IndexedPodcast[], query: string): IndexedPodcast[] {
  const fuse = new Fuse(podcasts, fuseOptions);
  return fuse.search(query).map(result => result.item);
}
```

- Fuse index is rebuilt on each search request from the filtered Prisma results
- For performance: if the directory exceeds 1000 items, pre-filter with Prisma `contains` before applying Fuse.js

### Components

#### DirectoryPage

File: `src/app/directory/page.tsx`

**Layout:**

```
+----------------------------------------------------------+
|  Vietnamese Podcast Directory                             |
|  {totalPodcasts} podcasts indexed | Last sync: {date}    |
|                                                           |
|  [Search_________________________]  [Sync] (admin)       |
|                                                           |
|  [Trending]  [New This Week]  [All]                      |
|                                                           |
|  A B C D E F G H I J K L M N O P Q R S T U V W X Y Z    |
|                                                           |
|  Filters: [Category v] [Publisher v] [Episodes v] [Status]|
|                                                           |
|  +--------+ +--------+ +--------+ +--------+             |
|  | Card   | | Card   | | Card   | | Card   |             |
|  +--------+ +--------+ +--------+ +--------+             |
|  +--------+ +--------+ +--------+ +--------+             |
|  | Card   | | Card   | | Card   | | Card   |             |
|  +--------+ +--------+ +--------+ +--------+             |
|                                                           |
|  [< Prev]  Page 1 of 12  [Next >]                       |
+----------------------------------------------------------+
```

#### AlphabetNav

File: `src/components/directory/alphabet-nav.tsx`

```typescript
interface AlphabetNavProps {
  activeLetter: string | null;
  onSelect: (letter: string | null) => void;
  availableLetters: string[]; // Letters that have at least 1 podcast
}
```

- Horizontal row of letter buttons A-Z plus "All" button
- Active letter: `variant="default"`, inactive: `variant="ghost"`
- Disabled (dimmed) for letters not in `availableLetters`
- Clicking a letter updates URL `?letter=A`
- Clicking "All" removes the `letter` param

#### DirectoryFilters

File: `src/components/directory/directory-filters.tsx`

```typescript
interface DirectoryFiltersProps {
  filters: DirectoryFilterValues;
  onChange: (filters: DirectoryFilterValues) => void;
  categories: string[];
  publishers: string[];
}

interface DirectoryFilterValues {
  category: string | null;
  publisher: string | null;
  minEpisodes: number | null;
  maxEpisodes: number | null;
  status: string | null;
}
```

- Category: shadcn/ui `Select` populated from distinct categories in database
- Publisher: shadcn/ui `Combobox` (searchable select) populated from distinct publishers
- Episode count: shadcn/ui `Select` with preset ranges: "Any", "1-10", "11-50", "51-100", "100+"
- Status: shadcn/ui `Select` with options: "All", "Active", "On Hiatus", "Ended"

#### TrendingSection

File: `src/components/directory/trending-section.tsx`

```typescript
interface TrendingSectionProps {
  trending: IndexedPodcast[];   // Top 8 by recent episode activity
  newThisWeek: IndexedPodcast[]; // Indexed in last 7 days
}
```

- Two horizontal scrollable rows using `overflow-x-auto`
- "Trending" row: podcasts with the most episodes released in the last 30 days (query: order by episodes with `release_date` in last 30 days)
- "New This Week" row: podcasts where `firstIndexedAt` is within the last 7 days
- Each item renders as a compact card (image + name + publisher)

### Data Flow

```
DirectoryPage
  |
  +-- Header (total count, last sync timestamp)
  |
  +-- SearchBar (Fuse.js search, updates ?q=)
  |
  +-- Tab navigation: Trending | New This Week | All
  |     +-- TrendingSection (shown on Trending tab)
  |
  +-- AlphabetNav (updates ?letter=)
  |
  +-- DirectoryFilters (updates ?category=, ?publisher=, etc.)
  |
  +-- PodcastGrid (reuses listing component)
  |     +-- PodcastCard[]
  |
  +-- PaginationControls (updates ?page=)
```

### Category Assignment

Since Spotify API does not expose podcast categories, the app assigns categories using keyword matching on the podcast `description` and `name`:

```typescript
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Technology": ["công nghệ", "tech", "AI", "lập trình", "phần mềm", "digital"],
  "Business": ["kinh doanh", "tài chính", "đầu tư", "khởi nghiệp", "marketing", "startup"],
  "Education": ["giáo dục", "học", "kiến thức", "kỹ năng", "education"],
  "Health": ["sức khỏe", "y tế", "tâm lý", "thiền", "yoga", "health"],
  "News": ["tin tức", "thời sự", "news", "báo chí"],
  "Culture": ["văn hóa", "nghệ thuật", "lịch sử", "triết học", "sách"],
  "Comedy": ["hài", "comedy", "vui", "giải trí"],
  "Music": ["âm nhạc", "music", "nhạc"],
  "Society": ["xã hội", "đời sống", "cuộc sống", "society"],
  "True Crime": ["tội phạm", "true crime", "bí ẩn", "mystery"],
  "Sports": ["thể thao", "bóng đá", "sports"],
  "Travel": ["du lịch", "travel", "khám phá"],
  "Food": ["ẩm thực", "nấu ăn", "food"],
};

function assignCategory(name: string, description: string): string | null {
  const text = `${name} ${description}`.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) return category;
  }
  return null;
}
```

## Acceptance Criteria

- [ ] Prisma schema creates `indexed_podcasts` and `indexed_episodes` tables in SQLite
- [ ] Crawl process discovers Vietnamese podcasts using seed keywords and stores them in the database
- [ ] Crawl only indexes podcasts where `languages` includes `"vi"`
- [ ] Crawl handles Spotify 429 rate limits with exponential backoff
- [ ] GET /api/directory returns paginated results with correct total count
- [ ] A-Z navigation filters podcasts by first letter of name
- [ ] Category filter narrows results to the selected category
- [ ] Publisher filter narrows results to the selected publisher
- [ ] Episode count filter works with preset ranges
- [ ] Active status filter correctly shows active/on-hiatus/ended podcasts
- [ ] Full-text search via Fuse.js matches podcast name, publisher, and description
- [ ] Fuse.js threshold of 0.3 provides relevant fuzzy matches
- [ ] Trending section shows podcasts with most recent episode activity
- [ ] "New This Week" shows podcasts first indexed within 7 days
- [ ] Directory page displays total indexed count and last sync timestamp
- [ ] Sync endpoint requires valid `x-sync-key` header
- [ ] Category assignment correctly tags podcasts based on Vietnamese keyword matching
- [ ] Pagination works correctly with all filter combinations
