// =============================================================================
// GET /api/analytics/[id]
// =============================================================================
// Computes comprehensive analytics for a podcast by fetching its details and
// ALL episodes (paginating through the full catalogue).
//
// Path params:
//   id     - Spotify show ID (required)
//
// Query params:
//   market - Market code (default: "VN")
//
// Response: { show, analytics }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getShow, getShowEpisodes } from "@/lib/spotify/client";
import type { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DurationTrendPoint {
  episodeName: string;
  date: string;
  durationMinutes: number;
}

interface ReleaseTrendPoint {
  month: string; // YYYY-MM
  count: number;
}

interface ContentGap {
  start: string;
  end: string;
  days: number;
}

interface PodcastAnalytics {
  totalEpisodes: number;
  avgDurationMs: number;
  avgDurationMinutes: number;
  totalContentHours: number;
  longestEpisode: { name: string; durationMs: number; durationMinutes: number } | null;
  shortestEpisode: { name: string; durationMs: number; durationMinutes: number } | null;
  releaseFrequencyDays: number | null;
  publishingPattern: "weekly" | "biweekly" | "monthly" | "irregular";
  activeStatus: "active" | "hiatus" | "ended";
  durationTrend: DurationTrendPoint[];
  releaseTrend: ReleaseTrendPoint[];
  contentGap: ContentGap | null;
}

// ---------------------------------------------------------------------------
// Analytics computation
// ---------------------------------------------------------------------------

function computeFullAnalytics(episodes: SpotifyEpisode[]): PodcastAnalytics {
  if (episodes.length === 0) {
    return {
      totalEpisodes: 0,
      avgDurationMs: 0,
      avgDurationMinutes: 0,
      totalContentHours: 0,
      longestEpisode: null,
      shortestEpisode: null,
      releaseFrequencyDays: null,
      publishingPattern: "irregular",
      activeStatus: "ended",
      durationTrend: [],
      releaseTrend: [],
      contentGap: null,
    };
  }

  // Sort episodes by release date ascending (oldest first) for trend charts
  const sortedAsc = [...episodes].sort(
    (a, b) =>
      new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
  );

  // Sorted descending (newest first) for recency calculations
  const sortedDesc = [...sortedAsc].reverse();

  // ---- Duration calculations ----
  const totalDurationMs = episodes.reduce(
    (sum, ep) => sum + ep.duration_ms,
    0
  );
  const avgDurationMs = Math.round(totalDurationMs / episodes.length);
  const avgDurationMinutes = Math.round(avgDurationMs / 60000);
  const totalContentHours = parseFloat(
    (totalDurationMs / 3600000).toFixed(1)
  );

  // ---- Longest & shortest episodes ----
  const longestEp = episodes.reduce((max, ep) =>
    ep.duration_ms > max.duration_ms ? ep : max
  );
  const shortestEp = episodes.reduce((min, ep) =>
    ep.duration_ms < min.duration_ms ? ep : min
  );

  // ---- Release frequency (avg days between consecutive episodes) ----
  let releaseFrequencyDays: number | null = null;
  if (sortedAsc.length >= 2) {
    let totalDaysBetween = 0;
    for (let i = 1; i < sortedAsc.length; i++) {
      const prev = new Date(sortedAsc[i - 1].release_date).getTime();
      const curr = new Date(sortedAsc[i].release_date).getTime();
      totalDaysBetween += (curr - prev) / (1000 * 60 * 60 * 24);
    }
    releaseFrequencyDays = parseFloat(
      (totalDaysBetween / (sortedAsc.length - 1)).toFixed(1)
    );
  }

  // ---- Publishing pattern ----
  let publishingPattern: PodcastAnalytics["publishingPattern"] = "irregular";
  if (releaseFrequencyDays !== null) {
    if (releaseFrequencyDays >= 5 && releaseFrequencyDays <= 9) {
      publishingPattern = "weekly";
    } else if (releaseFrequencyDays >= 12 && releaseFrequencyDays <= 18) {
      publishingPattern = "biweekly";
    } else if (releaseFrequencyDays >= 25 && releaseFrequencyDays <= 35) {
      publishingPattern = "monthly";
    }
  }

  // ---- Active status ----
  const latestDate = new Date(sortedDesc[0].release_date);
  const daysSinceLastEpisode =
    (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24);

  let activeStatus: PodcastAnalytics["activeStatus"] = "ended";
  if (daysSinceLastEpisode < 30) {
    activeStatus = "active";
  } else if (daysSinceLastEpisode < 180) {
    activeStatus = "hiatus";
  }

  // ---- Duration trend (sorted by date ascending for charting) ----
  const durationTrend: DurationTrendPoint[] = sortedAsc.map((ep) => ({
    episodeName: ep.name,
    date: ep.release_date,
    durationMinutes: Math.round(ep.duration_ms / 60000),
  }));

  // ---- Release trend (group by YYYY-MM) ----
  const monthCounts = new Map<string, number>();
  for (const ep of sortedAsc) {
    // Handle different release_date_precision formats
    const date = new Date(ep.release_date);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthCounts.set(month, (monthCounts.get(month) || 0) + 1);
  }
  const releaseTrend: ReleaseTrendPoint[] = Array.from(
    monthCounts.entries()
  ).map(([month, count]) => ({ month, count }));

  // ---- Content gap (longest break between consecutive episodes) ----
  let contentGap: ContentGap | null = null;
  if (sortedAsc.length >= 2) {
    let maxGapDays = 0;
    let gapStart = "";
    let gapEnd = "";

    for (let i = 1; i < sortedAsc.length; i++) {
      const prev = new Date(sortedAsc[i - 1].release_date);
      const curr = new Date(sortedAsc[i].release_date);
      const gapDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

      if (gapDays > maxGapDays) {
        maxGapDays = gapDays;
        gapStart = sortedAsc[i - 1].release_date;
        gapEnd = sortedAsc[i].release_date;
      }
    }

    contentGap = {
      start: gapStart,
      end: gapEnd,
      days: Math.round(maxGapDays),
    };
  }

  return {
    totalEpisodes: episodes.length,
    avgDurationMs,
    avgDurationMinutes,
    totalContentHours,
    longestEpisode: {
      name: longestEp.name,
      durationMs: longestEp.duration_ms,
      durationMinutes: Math.round(longestEp.duration_ms / 60000),
    },
    shortestEpisode: {
      name: shortestEp.name,
      durationMs: shortestEp.duration_ms,
      durationMinutes: Math.round(shortestEp.duration_ms / 60000),
    },
    releaseFrequencyDays,
    publishingPattern,
    activeStatus,
    durationTrend,
    releaseTrend,
    contentGap,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch ALL episodes for a show by paginating through the Spotify API.
 */
async function fetchAllEpisodes(
  showId: string,
  market: string
): Promise<SpotifyEpisode[]> {
  const allEpisodes: SpotifyEpisode[] = [];
  let offset = 0;
  const limit = 50;

  while (true) {
    const page = await getShowEpisodes(showId, { limit, offset, market });
    allEpisodes.push(...page.items);

    if (!page.next || allEpisodes.length >= page.total) {
      break;
    }

    offset += limit;
  }

  return allEpisodes;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || id.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing required path parameter: id" },
        { status: 400 }
      );
    }

    const market = request.nextUrl.searchParams.get("market") || "VN";

    // Fetch show details and all episodes in parallel
    const [show, episodes] = await Promise.all([
      getShow(id, market),
      fetchAllEpisodes(id, market),
    ]);

    const analytics = computeFullAnalytics(episodes);

    return NextResponse.json({ show, analytics });
  } catch (error) {
    console.error("[/api/analytics/[id]] Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : 500;

    if (status === 404) {
      return NextResponse.json(
        { error: "Show not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status });
  }
}
