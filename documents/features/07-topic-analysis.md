---
id: topic-analysis
title: Topic & Trend Analysis
phase: 3
status: planned
priority: medium
depends_on:
  - directory
  - analytics
api_routes:
  - GET /api/topics
  - GET /api/recommendations/[id]
screens:
  - /topics
  - /podcast/[id]
created: 2026-02-27
updated: 2026-02-27
---

# Topic & Trend Analysis

## Overview

The topic analysis feature extracts keywords from podcast descriptions across the indexed directory, visualizes topic distribution as a heatmap, and powers a recommendation engine. Topics are derived by tokenizing Vietnamese and English text from podcast `name` and `description` fields, removing stop words, and counting frequency. The recommendation engine suggests similar podcasts based on shared publisher, keyword overlap, language match, and metric similarity. All data is sourced from the SQLite-indexed directory.

## User Stories

- **US-01**: As a researcher, I want to see a heatmap of podcast topics in Vietnam so I can understand what content areas are most and least covered.
- **US-02**: As a researcher, I want to extract keywords from a podcast's description so I can quickly understand its focus areas.
- **US-03**: As a researcher, I want podcast recommendations based on similarity so I can discover related shows.
- **US-04**: As a researcher, I want to identify underserved topics so I can spot content gaps in the ecosystem.

## Technical Spec

### Keyword Extraction

File: `src/lib/topics/keyword-extractor.ts`

**Algorithm:**

1. Concatenate `name` and `description` for each indexed podcast
2. Normalize text: lowercase, remove HTML tags, remove URLs, remove special characters
3. Tokenize into words (split by whitespace and punctuation)
4. Remove Vietnamese stop words and English stop words
5. Count word frequency across all podcasts
6. Group into bigrams (two-word phrases) for compound Vietnamese terms
7. Return top N keywords with their frequency counts

```typescript
// Vietnamese stop words (subset)
const VI_STOP_WORDS = new Set([
  "và", "của", "là", "cho", "với", "trong", "từ", "đến", "các", "một",
  "những", "được", "có", "không", "này", "đó", "để", "về", "theo",
  "người", "như", "tại", "trên", "khi", "mà", "nhưng", "hoặc", "hay",
  "rất", "cũng", "đã", "sẽ", "đang", "bạn", "chúng", "tôi", "mình",
  "podcast", "show", "episode", "ep",
]);

interface KeywordResult {
  keyword: string;
  count: number;          // Number of podcasts containing this keyword
  percentage: number;     // count / totalPodcasts * 100
  category: string | null; // Mapped category if applicable
}

export function extractKeywords(
  podcasts: IndexedPodcast[],
  topN: number = 100
): KeywordResult[] {
  const wordCounts = new Map<string, Set<string>>(); // word -> set of podcast IDs

  for (const podcast of podcasts) {
    const text = normalizeText(`${podcast.name} ${podcast.description}`);
    const tokens = tokenize(text);
    const uniqueTokens = new Set(tokens.filter(t => !VI_STOP_WORDS.has(t) && t.length >= 2));

    for (const token of uniqueTokens) {
      if (!wordCounts.has(token)) wordCounts.set(token, new Set());
      wordCounts.get(token)!.add(podcast.id);
    }
  }

  return Array.from(wordCounts.entries())
    .map(([keyword, podcastIds]) => ({
      keyword,
      count: podcastIds.size,
      percentage: (podcastIds.size / podcasts.length) * 100,
      category: null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}
```

### API Routes

#### GET /api/topics

File: `src/app/api/topics/route.ts`

| Parameter | Type    | Required | Default | Description                     |
|-----------|---------|----------|---------|---------------------------------|
| `limit`   | integer | no       | `100`   | Number of top keywords to return|
| `category`| string  | no       | -       | Filter podcasts by category     |

**Response shape:**

```typescript
interface TopicsResponse {
  keywords: KeywordResult[];
  totalPodcasts: number;
  generatedAt: string; // ISO timestamp
  topCategories: Array<{ category: string; podcastCount: number }>;
}
```

**Request flow:**

```
GET /api/topics?limit=100
  -> Check node-cache (key: topics:{limit}:{category}, TTL: 24 hours)
  -> If miss:
       -> Query all IndexedPodcasts from SQLite (filtered by category if provided)
       -> Run extractKeywords()
       -> Cache result
  -> Return TopicsResponse
```

#### GET /api/recommendations/[id]

File: `src/app/api/recommendations/[id]/route.ts`

| Parameter | Type    | Required | Default | Description                     |
|-----------|---------|----------|---------|---------------------------------|
| `id`      | string  | yes      | -       | Spotify show ID (path)          |
| `limit`   | integer | no       | `8`     | Number of recommendations       |

**Response shape:**

```typescript
interface RecommendationsResponse {
  sourceShow: { id: string; name: string };
  recommendations: Array<{
    show: IndexedPodcast;
    score: number;         // 0-100 similarity score
    reasons: string[];     // e.g., ["Same publisher", "Similar topics: kinh tế, tài chính"]
  }>;
}
```

### Recommendation Engine

File: `src/lib/topics/recommender.ts`

**Scoring algorithm:**

Each candidate podcast is scored against the source podcast on 4 dimensions:

```typescript
interface ScoringWeights {
  publisher: 30;      // Same publisher = 30 points
  keywords: 35;       // Keyword overlap score (0-35)
  language: 15;       // Same language = 15 points
  metrics: 20;        // Similar episode count and duration = 0-20 points
}

function computeSimilarity(source: IndexedPodcast, candidate: IndexedPodcast): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Publisher match (30 points)
  if (source.publisher === candidate.publisher) {
    score += 30;
    reasons.push("Same publisher");
  }

  // Keyword overlap (up to 35 points)
  const sourceKeywords = extractPodcastKeywords(source);
  const candidateKeywords = extractPodcastKeywords(candidate);
  const overlap = intersection(sourceKeywords, candidateKeywords);
  const keywordScore = Math.min(35, (overlap.size / Math.max(sourceKeywords.size, 1)) * 35);
  if (keywordScore > 5) {
    score += keywordScore;
    reasons.push(`Similar topics: ${Array.from(overlap).slice(0, 3).join(", ")}`);
  }

  // Language match (15 points)
  const sourceLangs = JSON.parse(source.languages) as string[];
  const candidateLangs = JSON.parse(candidate.languages) as string[];
  if (sourceLangs.some(l => candidateLangs.includes(l))) {
    score += 15;
    reasons.push("Same language");
  }

  // Metric similarity (up to 20 points)
  const episodeRatio = Math.min(source.totalEpisodes, candidate.totalEpisodes) /
                       Math.max(source.totalEpisodes, candidate.totalEpisodes, 1);
  const metricScore = episodeRatio * 20;
  if (metricScore > 10) {
    score += metricScore;
    reasons.push("Similar episode count");
  }

  return { score: Math.round(score), reasons };
}

export function getRecommendations(
  sourceId: string,
  allPodcasts: IndexedPodcast[],
  limit: number = 8
): RecommendationsResponse {
  const source = allPodcasts.find(p => p.id === sourceId);
  if (!source) throw new Error("Source podcast not found in directory");

  const candidates = allPodcasts
    .filter(p => p.id !== sourceId)
    .map(candidate => ({
      show: candidate,
      ...computeSimilarity(source, candidate),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    sourceShow: { id: source.id, name: source.name },
    recommendations: candidates,
  };
}
```

### Components

#### TopicHeatmap

File: `src/components/topics/topic-heatmap.tsx`

```typescript
interface TopicHeatmapProps {
  keywords: KeywordResult[];
  onKeywordClick: (keyword: string) => void;
}
```

**Layout:**

A grid of keyword cells where size and color intensity represent frequency:

```
+--------------------------------------------------------------+
|  kinh tế   |  công nghệ  | giáo dục |  sức khỏe  | văn hóa |
|  (42, 18%) | (38, 16%)   | (31, 13%)| (28, 12%)  | (25,11%)|
+--------------------------------------------------------------+
|  lịch sử  | marketing  | tâm lý   | âm nhạc | du lịch      |
|  (22, 9%) | (19, 8%)   | (18, 8%) | (15, 6%)| (14, 6%)     |
+--------------------------------------------------------------+
```

- CSS Grid with variable cell sizes based on `count`
- Color scale: `bg-primary/10` (low) to `bg-primary/90` (high) using opacity
- Cell content: keyword text + count + percentage
- Font size scales with frequency: `text-xs` (low) to `text-xl` (high)
- Minimum cell size: 80x60px
- On click: navigates to `/search?q={keyword}` to show matching podcasts
- Tooltip on hover: shows full keyword, exact count, and percentage

**Color computation:**

```typescript
function getHeatmapColor(count: number, maxCount: number): string {
  const intensity = Math.round((count / maxCount) * 90);
  return `hsl(var(--primary) / ${Math.max(10, intensity)}%)`;
}

function getHeatmapFontSize(count: number, maxCount: number): string {
  const ratio = count / maxCount;
  if (ratio > 0.7) return "text-xl font-bold";
  if (ratio > 0.4) return "text-base font-semibold";
  if (ratio > 0.2) return "text-sm font-medium";
  return "text-xs";
}
```

#### RecommendationList

File: `src/components/topics/recommendation-list.tsx`

```typescript
interface RecommendationListProps {
  recommendations: RecommendationsResponse["recommendations"];
  isLoading: boolean;
}
```

**Layout:**

```
+----------------------------------------------------------+
|  Similar Podcasts                                         |
|                                                           |
|  +--------+-------------------------------------------+  |
|  | Cover  | Podcast Name                    Score: 85 |  |
|  | 64x64  | by Publisher                              |  |
|  |        | Same publisher, Similar topics: kinh tế   |  |
|  +--------+-------------------------------------------+  |
|                                                           |
|  +--------+-------------------------------------------+  |
|  | Cover  | Another Podcast                 Score: 72 |  |
|  | 64x64  | by Publisher B                            |  |
|  |        | Similar topics: công nghệ, AI             |  |
|  +--------+-------------------------------------------+  |
+----------------------------------------------------------+
```

- Vertical list of recommendation cards
- Each card: shadcn/ui `Card` with horizontal flex (image + content)
- Cover art: 64x64 `rounded-md`
- Podcast name: `font-medium text-sm`, linked to `/podcast/{id}`
- Publisher: `text-xs text-muted-foreground`
- Score: shadcn/ui `Badge` with color based on score (>80 green, >50 yellow, else gray)
- Reasons: `text-xs text-muted-foreground` comma-separated list
- Loading state: 4 skeleton cards
- Empty state: "No similar podcasts found in the directory"

### Page Integration

**Topics page** (`/topics`):

```
TopicsPage
  |
  +-- Page header: "Vietnamese Podcast Topics"
  +-- Category filter tabs
  +-- TopicHeatmap (main content)
  +-- Top categories sidebar/section
```

**Podcast detail page** (`/podcast/[id]`):

```
PodcastDetailPage
  |
  +-- PodcastDetailHeader
  +-- EpisodeList
  +-- AnalyticsSection
  +-- RecommendationList (fetches /api/recommendations/{id})
```

### Data Flow

```
TopicsPage (/topics)
  |
  +-- useEffect -> fetch /api/topics?limit=100
  +-- TopicHeatmap (renders keyword grid)
  |     +-- onClick -> navigate to /search?q={keyword}
  +-- Category summary cards

PodcastDetailPage (/podcast/[id])
  |
  +-- RecommendationList
        +-- useEffect -> fetch /api/recommendations/{id}?limit=8
        +-- Render recommendation cards
```

## Acceptance Criteria

- [ ] GET /api/topics returns top keywords extracted from indexed podcasts
- [ ] Vietnamese stop words are correctly excluded from keyword extraction
- [ ] Keywords are ranked by number of podcasts containing them
- [ ] Topic heatmap renders with cell sizes and colors proportional to keyword frequency
- [ ] Clicking a keyword in the heatmap navigates to search with that keyword
- [ ] GET /api/recommendations/{id} returns up to 8 similar podcasts with scores
- [ ] Same-publisher podcasts receive a 30-point score bonus
- [ ] Keyword overlap is correctly calculated between podcast descriptions
- [ ] Language match contributes 15 points to the similarity score
- [ ] Metric similarity (episode count ratio) contributes up to 20 points
- [ ] Each recommendation includes human-readable reasons (e.g., "Same publisher", "Similar topics: X, Y")
- [ ] RecommendationList displays on the podcast detail page
- [ ] Recommendations are sorted by score descending
- [ ] Topic data is cached for 24 hours
- [ ] The feature gracefully shows "Index podcasts first" when directory has no data
