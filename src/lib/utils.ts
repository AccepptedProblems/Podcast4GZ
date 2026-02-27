// =============================================================================
// Utility Functions
// =============================================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SpotifyEpisode } from "./spotify/types";

// ---------------------------------------------------------------------------
// Class name merging (shadcn/ui standard pattern)
// ---------------------------------------------------------------------------

/**
 * Merge Tailwind CSS class names with proper conflict resolution.
 * Combines clsx (conditional classes) with tailwind-merge (deduplication).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Convert a duration in milliseconds to a human-readable string.
 *
 * Examples:
 *   - 3_661_000 -> "1h 1m"
 *   - 125_000   -> "2m 5s"
 *   - 45_000    -> "0m 45s"
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${seconds}s`;
}

/**
 * Format a date string (YYYY-MM-DD, YYYY-MM, or YYYY) into a locale-friendly
 * representation. Falls back gracefully for partial dates.
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";

  // Handle year-only or year-month formats
  const parts = dateStr.split("-");
  if (parts.length === 1) {
    return parts[0]; // Just the year
  }
  if (parts.length === 2) {
    const date = new Date(`${dateStr}-01`);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
    });
  }

  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format a number with locale-appropriate separators.
 * Example: 1234567 -> "1,234,567"
 */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

/**
 * Truncate text to a maximum length, appending an ellipsis if truncated.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

// ---------------------------------------------------------------------------
// Podcast analytics helpers
// ---------------------------------------------------------------------------

/**
 * Calculate the average duration (in ms) of a list of episodes.
 * Returns 0 if the list is empty.
 */
export function calculateAverageDuration(episodes: SpotifyEpisode[]): number {
  if (episodes.length === 0) return 0;

  const totalMs = episodes.reduce((sum, ep) => sum + ep.duration_ms, 0);
  return Math.round(totalMs / episodes.length);
}

/**
 * Calculate the total content hours across all episodes.
 */
export function calculateTotalContentHours(
  episodes: SpotifyEpisode[]
): number {
  if (episodes.length === 0) return 0;

  const totalMs = episodes.reduce((sum, ep) => sum + ep.duration_ms, 0);
  return parseFloat((totalMs / (1000 * 60 * 60)).toFixed(1));
}

/**
 * Attempt to detect the publishing cadence based on release dates.
 *
 * Returns a human-readable string such as "Weekly", "Bi-weekly", "Monthly",
 * "Daily", or "Irregular".
 */
export function detectPublishingPattern(episodes: SpotifyEpisode[]): string {
  if (episodes.length < 2) return "Not enough data";

  // Sort episodes by release date descending and compute gaps in days
  const sorted = [...episodes]
    .filter((ep) => ep.release_date)
    .sort(
      (a, b) =>
        new Date(b.release_date).getTime() -
        new Date(a.release_date).getTime()
    );

  if (sorted.length < 2) return "Not enough data";

  const gapsDays: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = new Date(sorted[i].release_date).getTime();
    const previous = new Date(sorted[i + 1].release_date).getTime();
    const diffDays = (current - previous) / (1000 * 60 * 60 * 24);
    gapsDays.push(diffDays);
  }

  const averageGap =
    gapsDays.reduce((sum, g) => sum + g, 0) / gapsDays.length;

  if (averageGap <= 1.5) return "Daily";
  if (averageGap <= 5) return "Several times a week";
  if (averageGap <= 10) return "Weekly";
  if (averageGap <= 18) return "Bi-weekly";
  if (averageGap <= 45) return "Monthly";
  return "Irregular";
}

/**
 * Determine whether a podcast is actively publishing based on the date of
 * its most recent episode.
 *
 * - "active"  : last episode within 30 days
 * - "hiatus"  : last episode within 90 days
 * - "ended"   : last episode more than 90 days ago
 */
export function getActiveStatus(
  lastReleaseDate: string
): "active" | "hiatus" | "ended" {
  if (!lastReleaseDate) return "ended";

  const lastDate = new Date(lastReleaseDate);
  const now = new Date();
  const diffDays =
    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays <= 30) return "active";
  if (diffDays <= 90) return "hiatus";
  return "ended";
}
