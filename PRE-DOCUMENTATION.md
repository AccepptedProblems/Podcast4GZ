# PodcastW4GZ - Pre-Documentation

## Project Overview

**PodcastW4GZ** is an open-source podcast research & analysis tool focused on the Vietnamese podcast ecosystem, powered by the [Spotify Web API](https://developer.spotify.com/documentation/web-api).

The app fetches public podcast data from Spotify and provides tools to search, sort, analyze, and compare podcasts available in Vietnam. **No user accounts, no login, no user-specific features** - purely a data research tool.

---

## Data Source: Spotify Web API

### Authentication

| Flow | Description |
|------|-------------|
| **Client Credentials** | Server-side token using `client_id` + `client_secret`. Access to all public podcast data. No user login. |

The `client_id` and `client_secret` are stored as environment variables on the server. The frontend calls Next.js API routes which proxy requests to Spotify.

### API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search?type=show` | GET | Search podcasts by keyword |
| `/search?type=episode` | GET | Search episodes by keyword |
| `/shows/{id}` | GET | Get full podcast details |
| `/shows` | GET | Get multiple podcasts (max 50 IDs) |
| `/shows/{id}/episodes` | GET | List all episodes of a podcast |
| `/episodes/{id}` | GET | Get full episode details |
| `/episodes` | GET | Get multiple episodes |
| `/markets` | GET | List all available Spotify markets |

### Key Data Fields Available

**Show (Podcast) Object:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Spotify unique identifier |
| `name` | string | Podcast name |
| `description` | string | Plain text description |
| `html_description` | string | HTML-formatted description |
| `publisher` | string | Publisher name |
| `languages` | array | ISO 639-1 language codes (e.g., `["vi"]`) |
| `total_episodes` | integer | Total episode count |
| `media_type` | string | Media type of the show |
| `explicit` | boolean | Contains explicit content |
| `images` | array | Cover art (url, height, width) |
| `available_markets` | array | ISO 3166-1 alpha-2 country codes |
| `is_externally_hosted` | boolean | Hosted outside Spotify CDN |
| `copyrights` | array | Copyright information |
| `external_urls` | object | Spotify URL |
| `uri` | string | Spotify URI |

**Episode Object:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Spotify unique identifier |
| `name` | string | Episode title |
| `description` | string | Plain text description |
| `html_description` | string | HTML-formatted description |
| `duration_ms` | integer | Duration in milliseconds |
| `release_date` | string | Release date (YYYY / YYYY-MM / YYYY-MM-DD) |
| `release_date_precision` | string | `year`, `month`, or `day` |
| `languages` | array | ISO 639-1 language codes |
| `explicit` | boolean | Contains explicit content |
| `audio_preview_url` | string | 30-second MP3 preview (nullable, deprecated) |
| `images` | array | Cover art |
| `is_playable` | boolean | Playable in given market |
| `is_externally_hosted` | boolean | Hosted outside Spotify CDN |
| `show` | object | Parent show reference |
| `external_urls` | object | Spotify URL |
| `uri` | string | Spotify URI |

### API Constraints

- **Search limit**: 0-10 results per request per type
- **Search offset**: 0-1000 maximum
- **Episodes list limit**: 0-50 per request
- **Batch shows**: max 50 IDs per request
- **Market filter**: ISO 3166-1 alpha-2 (Vietnam = `VN`)
- **Rate limiting**: Spotify enforces rate limits (429 responses)

---

## Feature List

### 1. Podcast Search & Discovery

#### 1.1 Keyword Search
- Search podcasts by name, topic, or keyword via `/search?type=show&market=VN`
- Search episodes by keyword via `/search?type=episode&market=VN`
- Support Vietnamese language queries
- Debounced search input

#### 1.2 Filter by Language
- Filter results where `languages` contains `"vi"` (Vietnamese)
- Option to include bilingual podcasts (e.g., Vietnamese + English)
- Display language tags on each result

#### 1.3 Filter by Market
- Default market set to `VN` (Vietnam)
- Option to toggle market filter off for global discovery

#### 1.4 Category / Topic Browsing
- App-maintained category tags (Technology, Business, Comedy, Education, Health, News, Culture, Music, Society, True Crime, etc.)
- Curated category pages with pre-defined search queries

#### 1.5 Advanced Search Filters
- Filter by explicit content (yes/no)
- Filter by total episode count range (e.g., 10-100 episodes)
- Filter by externally hosted vs Spotify-native
- Filter by publisher name
- Combine multiple filters in one query

---

### 2. Podcast Listing & Sorting

#### 2.1 Sortable Podcast List
- Sort by `total_episodes` (most prolific)
- Sort by name (A-Z / Z-A)
- Sort by publisher name

#### 2.2 Popularity Ranking (App-Computed)
- **Note**: Spotify API does NOT expose `popularity` or listen counts for shows/episodes
- App computes its own ranking score from available data:
  - `total_episodes` — proxy for established/active shows
  - Episode release frequency — computed from `release_date` across episodes
  - Frequency of appearance in search results
  - App-internal view count (how often a podcast is viewed/searched in the app)

#### 2.3 Top Podcasts (Vietnam)
- Curated "Top Vietnamese Podcasts" list
- Trending podcasts based on app-internal analytics (most searched, most viewed)

#### 2.4 Pagination
- Paginate results using `limit` and `offset` parameters
- Infinite scroll or page-based navigation
- Display `total` result count

---

### 3. Podcast Detail & Episode Browsing

#### 3.1 Podcast Profile Page
- Full show metadata: name, publisher, description, cover art, languages
- Total episode count
- Link to Spotify via `external_urls`
- Explicit content badge
- Hosting type indicator (Spotify-native vs external)

#### 3.2 Episode Listing
- Full episode list via `/shows/{id}/episodes` (paginated, up to 50 per page)
- Sort episodes by: release date (newest/oldest), duration (shortest/longest), name
- Filter episodes by date range
- Filter episodes by duration range
- Search within a podcast's episodes by keyword

#### 3.3 Episode Detail
- Episode metadata: name, description, duration, release date, language
- Audio preview player (30-second preview via `audio_preview_url` if available)
- Deep link to Spotify for full playback

---

### 4. Analytics & Insights (App-Computed)

> All analytics are computed from raw Spotify data (episode `duration_ms`, `release_date`, etc.)

#### 4.1 Per-Podcast Analytics
- **Average episode duration** — mean of `duration_ms` across all episodes
- **Total content hours** — sum of all `duration_ms` converted to hours
- **Longest / shortest episode** — min/max `duration_ms`
- **Episode release frequency** — average days between releases
- **Publishing schedule pattern** — detect weekly, biweekly, monthly, irregular
- **Activity timeline** — chart of episode releases over time (bar/line chart)
- **Content gap analysis** — longest break between episodes
- **Active status** — active / on hiatus / ended (based on last `release_date`)
- **Duration trend** — are episodes getting longer or shorter over time?

#### 4.2 Vietnamese Podcast Landscape Dashboard
- Total number of podcasts available in VN market (via search indexing)
- Language distribution — Vietnamese only vs bilingual vs other
- Publisher count — how many unique publishers
- Average episodes per show
- Total content hours available across all indexed podcasts
- Explicit vs non-explicit content ratio
- Spotify-hosted vs externally-hosted ratio

#### 4.3 Publisher Analytics
- Group all podcasts by `publisher`
- Per-publisher stats: total shows, total episodes, total content hours, languages
- Publisher ranking by content output

---

### 5. Comparison Tools

#### 5.1 Podcast Comparator
- Side-by-side comparison of 2-4 podcasts
- Compare metrics: total episodes, avg duration, release frequency, total content hours, languages
- Visual charts (bar charts, radar charts)

#### 5.2 Publisher Comparison
- Compare two publishers: total shows, total episodes, content output

---

### 6. Vietnamese Podcast Directory

#### 6.1 Automated Discovery
- Periodic search crawling using diverse Vietnamese keywords to discover all VN podcasts
- Index podcasts with `languages: ["vi"]` and/or `market: "VN"`

#### 6.2 Directory Listing
- Browsable A-Z directory of all indexed Vietnamese podcasts
- Filter by category, publisher, episode count, active status
- Full-text search across podcast names and descriptions

#### 6.3 Trending / New
- "New This Week" — recently discovered podcasts
- "Most Active" — podcasts releasing the most episodes recently
- "Fastest Growing" — podcasts gaining episodes fastest

---

### 7. Topic & Trend Analysis

#### 7.1 Topic Heatmap
- Visual heatmap of podcast topics in Vietnam
- Keywords extracted from podcast `description` fields
- Identify most covered and underserved topics

#### 7.2 Recommendation Engine
- "Similar to X" suggestions based on:
  - Same publisher
  - Similar description keywords (text similarity)
  - Same language
  - Similar episode count / release frequency

---

### 8. Data Export

#### 8.1 CSV Export
- Export podcast search results to CSV
- Export episode list of a podcast to CSV
- Export comparison data to CSV

#### 8.2 PDF Reports
- Generate PDF report for a single podcast (profile + analytics)
- Generate PDF for podcast comparison

---

### 9. Data Management & Caching

#### 9.1 Server-Side Cache
- Cache Spotify API responses to reduce API calls and improve speed
- TTL-based invalidation (e.g., 1 hour for search results, 24 hours for show details)

#### 9.2 Database (Indexed Data)
- Store indexed podcast metadata for the Vietnamese directory
- Store computed analytics and popularity scores
- Enable fast local search without hitting Spotify API

#### 9.3 Background Sync
- Periodic jobs to refresh metadata for indexed podcasts
- Detect new episodes
- Recompute analytics
- Handle rate limits with exponential backoff

#### 9.4 Data Freshness
- Display "last synced" timestamp per podcast
- Manual refresh button on detail pages

---

## API Limitations & Workarounds

| Limitation | Impact | Workaround |
|-----------|--------|------------|
| No `popularity` field on shows | Cannot rank by Spotify popularity | Compute score from total_episodes, release frequency, app views |
| No listen/play count exposed | Cannot sort by actual listens | Use proxy metrics from available data |
| Search limit: max 10 per request | Slow large-scale discovery | Paginate with offset, diverse search terms, cache results |
| Search offset max: 1000 | Cannot access beyond 1000 results | Use varied queries to reach different result sets |
| `audio_preview_url` deprecated | Preview may not work for all episodes | Deep link to Spotify for full playback |
| `publisher` field deprecated | May be removed in future | Cache publisher data, monitor API changelog |
| `available_markets` deprecated | Market filtering may change | Use `market` query parameter instead |
| Rate limits (429) | Requests throttled | Exponential backoff, request queuing, aggressive caching |
| No podcast categories from API | Cannot filter by Spotify categories | App-internal category system with keyword tagging |

---

## Suggested Tech Stack

| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| Framework | **Next.js** (React) | Frontend + API routes in one project |
| UI | **Tailwind CSS + shadcn/ui** | Clean, fast UI development |
| Charts | **Recharts** | Analytics visualizations |
| API Proxy | **Next.js API Routes** | Hides `client_secret`, handles caching |
| Cache | **node-cache** (in-memory) | Simple API response caching |
| Database | **SQLite** (via Prisma) | Store indexed podcasts, computed metrics |
| Text Search | **Fuse.js** | Client-side fuzzy search on cached data |
| Deployment | **Vercel** | Zero-config Next.js hosting |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│           Next.js (React + SSR)             │
│   Search | List | Detail | Compare | Charts │
└──────────────────┬──────────────────────────┘
                   │ fetch(/api/...)
┌──────────────────▼──────────────────────────┐
│           Next.js API Routes                │
│  /api/search    /api/shows     /api/episodes│
│  /api/compare   /api/analytics /api/export  │
│                                              │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Cache   │  │ Spotify  │  │  SQLite   │  │
│  │(node-cache) │  Client  │  │ (indexed  │  │
│  └─────────┘  └────┬─────┘  │  data)    │  │
│                     │        └───────────┘  │
└─────────────────────┼───────────────────────┘
                      │ Client Credentials
┌─────────────────────▼───────────────────────┐
│            Spotify Web API                   │
│   /search  /shows  /episodes  /markets      │
└─────────────────────────────────────────────┘
```

---

## Phased Rollout

### Phase 1 — MVP
1. Client Credentials auth via API routes
2. Search Vietnamese podcasts (keyword + market=VN + language filter)
3. Podcast listing with sorting (total episodes, name, publisher)
4. Podcast detail page with full metadata
5. Episode listing with sorting (date, duration, name)
6. Episode detail page
7. Server-side API response caching
8. Responsive web design

### Phase 2 — Analytics & Research
9. Per-podcast analytics (avg duration, release frequency, content hours, timeline chart)
10. App-computed popularity ranking
11. Podcast comparison tool (2-4 side-by-side)
12. Publisher analysis & grouping
13. Export to CSV

### Phase 3 — Directory & Insights
14. Vietnamese Podcast Directory (automated search indexing + SQLite storage)
15. Landscape dashboard (totals, distributions, averages)
16. Topic heatmap (keyword extraction from descriptions)
17. Recommendation engine (text similarity)
18. PDF reports

---

*Document generated: 2026-02-27*
*Data source: [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)*
*License: Open Source*
