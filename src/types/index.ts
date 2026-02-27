// =============================================================================
// Application-Level Type Definitions
// =============================================================================

import { SpotifyEpisode } from "@/lib/spotify/types";

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

/** Parameters accepted by the search API route and hook */
export interface SearchParams {
  query: string;
  type?: "show" | "episode";
  market?: string;
  language?: string;
  limit?: number;
  offset?: number;
}

// ---------------------------------------------------------------------------
// Sorting & Filtering
// ---------------------------------------------------------------------------

/** Sort direction and field encoded as a single string value */
export type SortOption =
  | "relevance"
  | "total_episodes_desc"
  | "total_episodes_asc"
  | "name_asc"
  | "name_desc"
  | "date_desc"
  | "date_asc"
  | "duration_desc"
  | "duration_asc";

/** Filters that can be applied to search results or episode lists */
export interface FilterOptions {
  language?: string;
  explicit?: boolean;
  minEpisodes?: number;
  maxEpisodes?: number;
  minDurationMs?: number;
  maxDurationMs?: number;
  releasedAfter?: string;
  releasedBefore?: string;
}

// ---------------------------------------------------------------------------
// Podcast Analytics
// ---------------------------------------------------------------------------

/** Computed analytics for a podcast based on its episodes */
export interface PodcastAnalytics {
  /** Average episode duration in milliseconds */
  avgDuration: number;

  /** Total hours of content across all analyzed episodes */
  totalContentHours: number;

  /** The longest episode by duration */
  longestEpisode: SpotifyEpisode | null;

  /** The shortest episode by duration */
  shortestEpisode: SpotifyEpisode | null;

  /**
   * Average number of days between episodes.
   * `null` if there are fewer than 2 episodes.
   */
  releaseFrequency: number | null;

  /**
   * Human-readable publishing cadence:
   * "Daily", "Weekly", "Bi-weekly", "Monthly", "Irregular", etc.
   */
  publishingPattern: string;

  /** Whether the podcast is currently active, on hiatus, or ended */
  activeStatus: "active" | "hiatus" | "ended";

  /**
   * Trend of episode durations over time.
   * Positive = episodes are getting longer, negative = shorter.
   * Values are between -1 and 1.
   */
  durationTrend: number;
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

/** Data structure used when comparing two or more podcasts side by side */
export interface ComparisonData {
  showId: string;
  showName: string;
  publisher: string;
  totalEpisodes: number;
  analytics: PodcastAnalytics;
  latestEpisodeDate: string | null;
  imageUrl: string | null;
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/** Supported export formats for analytics data */
export type ExportFormat = "json" | "csv" | "pdf";
