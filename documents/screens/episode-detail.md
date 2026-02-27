---
openspec: 0.1.0
kind: screen
metadata:
  name: Episode Detail Page
  description: Individual episode view with metadata, audio preview player, Spotify deep link, and breadcrumb navigation back to parent podcast.
  status: planned
  phase: 1
  route: /episode/[id]
  file: src/app/episode/[id]/page.tsx
  updated: 2026-02-27
dependencies:
  packages:
    - lucide-react
    - date-fns
  components:
    - "@/components/episode/EpisodeBreadcrumb"
    - "@/components/episode/EpisodeInfo"
    - "@/components/episode/AudioPreview"
    - "@/components/episode/SpotifyLink"
    - "@/components/ui/badge"
    - "@/components/ui/button"
    - "@/components/ui/card"
    - "@/components/ui/skeleton"
    - "@/components/ui/separator"
  api-routes:
    - GET /api/episodes/[id]
---

# Episode Detail Page

## Overview

The Episode Detail Page shows full metadata for a single podcast episode, including its title, parent show reference, release date, duration, and description. If an audio preview URL is available, an inline player lets users listen to a 30-second clip. A prominent Spotify button links to the full episode for playback.

---

## Wireframe

### Desktop

```
+------------------------------------------------------------------+
|                          HEADER (layout)                          |
+------------------------------------------------------------------+
|                                                                    |
|  Home > Podcast Name > Episode Title                               |
|                                                                    |
|  +--------+                                                        |
|  |        |  Episode Title Here                                    |
|  | COVER  |                                                        |
|  | ART    |  from: Podcast Name (link)                             |
|  | 200x   |  by: Publisher Name                                    |
|  | 200    |                                                        |
|  |        |  Released: February 20, 2026                           |
|  +--------+  Duration: 42 minutes 15 seconds                      |
|              Language: Vietnamese                                   |
|              [Explicit]                                             |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  Audio Preview                                                     |
|  +--------------------------------------------------------------+ |
|  |  [Play/Pause]  ====[========]====  0:12 / 0:30  [Volume]     | |
|  +--------------------------------------------------------------+ |
|  Note: 30-second preview. Listen to the full episode on Spotify.  |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |  [Spotify Icon]  Listen on Spotify  ->                        | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  Description                                                       |
|  ----------------------------------------------------------------  |
|  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do   |
|  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut    |
|  enim ad minim veniam, quis nostrud exercitation ullamco laboris   |
|  nisi ut aliquip ex ea commodo consequat.                          |
|                                                                    |
|  Duis aute irure dolor in reprehenderit in voluptate velit esse    |
|  cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat   |
|  cupidatat non proident, sunt in culpa qui officia deserunt        |
|  mollit anim id est laborum.                                       |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  [<- Back to Podcast Name]                                         |
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
| < Back to Podcast Name        |
|                               |
|        +--------+             |
|        | COVER  |             |
|        | ART    |             |
|        +--------+             |
|                               |
| Episode Title Here            |
|                               |
| from: Podcast Name            |
| Released: Feb 20, 2026        |
| Duration: 42:15               |
| [vi] [Explicit]               |
|                               |
+-------------------------------+
| Audio Preview                 |
| [>] ====[====]====  0:12/0:30|
| 30s preview only              |
+-------------------------------+
| [Listen on Spotify ->]        |
+-------------------------------+
|                               |
| Description                   |
| Lorem ipsum dolor sit amet... |
| [Read more]                   |
|                               |
+-------------------------------+
|       FOOTER (layout)        |
+-------------------------------+
```

---

## Component Tree

```
EpisodeDetailPage (src/app/episode/[id]/page.tsx)
├── EpisodeBreadcrumb (src/components/episode/EpisodeBreadcrumb.tsx)
│   ├── Link "Home" -> /
│   ├── Separator ">"
│   ├── Link "{show.name}" -> /podcast/{show.id}
│   ├── Separator ">"
│   └── Current "{episode.name}" (text, not link)
├── EpisodeInfo (src/components/episode/EpisodeInfo.tsx)
│   ├── CoverArt (next/image, 200x200 desktop, 160x160 mobile)
│   ├── <h1> Episode name
│   ├── ShowReference
│   │   ├── "from: " + Link "{show.name}" -> /podcast/{show.id}
│   │   └── "by: {show.publisher}" (if available)
│   ├── MetadataList
│   │   ├── ReleaseDate (formatted with date-fns: "MMMM d, yyyy")
│   │   ├── Duration (formatted: "X minutes Y seconds" or "Xh Ym Zs")
│   │   └── Language (ISO code -> full name: "vi" -> "Vietnamese")
│   └── Badges
│       ├── Badge "Explicit" (conditional, if episode.explicit)
│       └── Badge "External" (conditional, if episode.is_externally_hosted)
├── AudioPreview (src/components/episode/AudioPreview.tsx)
│   ├── Card container
│   │   ├── <h3> "Audio Preview"
│   │   ├── <audio> element (native HTML5 player, styled)
│   │   │   ├── PlayPauseButton
│   │   │   ├── ProgressBar (seek-able)
│   │   │   ├── TimeDisplay "{current} / 0:30"
│   │   │   └── VolumeControl
│   │   └── <p> "30-second preview. Listen to the full episode on Spotify."
│   └── (or) UnavailableState
│       └── <p> "Audio preview not available for this episode."
├── SpotifyLink (src/components/episode/SpotifyLink.tsx)
│   └── Button (variant="default", size="lg")
│       ├── Spotify icon
│       └── "Listen on Spotify"
│       └── (opens external_urls.spotify in new tab)
├── Separator
├── DescriptionSection
│   ├── <h2> "Description"
│   └── Description content
│       ├── HTML description (sanitized html_description) if available
│       └── Plain text description fallback
│       └── Collapsible with "Read more" / "Show less" if > 500 chars
└── BackLink
    └── Link "<- Back to {show.name}" -> /podcast/{show.id}
```

---

## Data Requirements

### API Call

```
GET /api/episodes/{id}
```

### Response Schema

```typescript
interface SpotifyEpisode {
  id: string;
  name: string;
  description: string;
  html_description: string;
  duration_ms: number;
  release_date: string;
  release_date_precision: 'year' | 'month' | 'day';
  languages: string[];
  explicit: boolean;
  audio_preview_url: string | null;
  images: Array<{ url: string; height: number; width: number }>;
  is_playable: boolean;
  is_externally_hosted: boolean;
  show: {
    id: string;
    name: string;
    publisher: string;
    images: Array<{ url: string; height: number; width: number }>;
    external_urls: { spotify: string };
  };
  external_urls: { spotify: string };
  uri: string;
}
```

### Data Fetching Strategy

- **Server Component** fetches `GET /api/episodes/{id}` with `next: { revalidate: 86400 }` (24-hour ISR).
- The episode response includes a nested `show` object with the parent podcast reference, so no separate API call is needed for the breadcrumb/back link.
- Audio preview is handled entirely client-side via the `<audio>` element.

---

## User Interactions

| Interaction                   | Behavior                                                    |
|-------------------------------|-------------------------------------------------------------|
| Click breadcrumb "Home"       | Navigate to `/`                                             |
| Click breadcrumb podcast name | Navigate to `/podcast/{show.id}`                            |
| Click podcast name in info    | Navigate to `/podcast/{show.id}`                            |
| Click Play on audio preview   | Plays 30-second MP3 from `audio_preview_url`                |
| Click Pause                   | Pauses audio playback                                       |
| Drag progress bar             | Seeks to position in preview                                |
| Adjust volume                 | Changes playback volume                                     |
| Click "Listen on Spotify"     | Opens `external_urls.spotify` in new tab                    |
| Click "Read more"             | Expands full description                                    |
| Click "Show less"             | Collapses description                                       |
| Click "Back to {podcast}"     | Navigate to `/podcast/{show.id}`                            |

---

## Responsive Behavior

| Breakpoint        | Layout                                                         |
|-------------------|----------------------------------------------------------------|
| `>= 1024px` (lg) | Side-by-side: cover art left, metadata right. Full breadcrumb. |
| `768-1023px` (md) | Side-by-side but compact. Breadcrumb may truncate.             |
| `< 768px` (sm)    | Stacked: cover centered, metadata below. Back link replaces breadcrumb. |

### CSS Notes

```
EpisodeInfo       -> flex flex-col md:flex-row gap-6
CoverArt          -> w-40 h-40 md:w-48 md:h-48 rounded-lg shadow-md mx-auto md:mx-0
AudioPreview      -> max-w-2xl mx-auto
SpotifyLink       -> w-full md:w-auto
DescriptionSection -> prose prose-sm max-w-none dark:prose-invert
BackLink          -> mt-8 mb-4
```

---

## Loading States

| Section          | Loading Display                                          |
|------------------|----------------------------------------------------------|
| Breadcrumb       | Skeleton: 3 text blocks with separators                  |
| Episode info     | Skeleton: image placeholder + 5 text lines               |
| Audio preview    | Skeleton: bar placeholder                                |
| Description      | Skeleton: 6 text lines of varying width                  |

---

## Error States

| Error              | Display                                                  |
|--------------------|----------------------------------------------------------|
| Episode not found  | 404 page: "Episode not found" with link back to search   |
| API error          | Error card: "Unable to load episode" with retry button   |

---

## Audio Preview Notes

- `audio_preview_url` is **nullable** and officially **deprecated** by Spotify. Many episodes will not have a preview available.
- When `audio_preview_url` is `null`, show: "Audio preview not available for this episode. Listen on Spotify instead."
- The preview is a 30-second MP3 file. The player should handle standard HTML5 audio events.
- Autoplay is disabled. User must explicitly click Play.
- Volume defaults to 80%.

---

## SEO

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const episode = await fetchEpisode(params.id);
  return {
    title: `${episode.name} - ${episode.show.name} - PodcastW4GZ`,
    description: episode.description?.slice(0, 160),
    openGraph: {
      title: episode.name,
      description: episode.description?.slice(0, 160),
      images: [episode.images?.[0]?.url],
    },
  };
}
```
