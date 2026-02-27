// =============================================================================
// POST /api/compare
// =============================================================================
// Compares 2-4 podcasts by fetching their details and episodes in parallel,
// then computing analytics for each.
//
// Request body:
//   { showIds: string[], market?: string }
//
// Response:
//   Array of { show, analytics } objects
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getShow, getShowEpisodes } from "@/lib/spotify/client";
import type { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";

interface ShowAnalytics {
  totalEpisodes: number;
  avgDurationMs: number;
  avgDurationMinutes: number;
  totalContentHours: number;
  longestEpisode: { name: string; durationMs: number; durationMinutes: number } | null;
  shortestEpisode: { name: string; durationMs: number; durationMinutes: number } | null;
  releaseFrequencyDays: number | null;
  publishingPattern: "weekly" | "biweekly" | "monthly" | "irregular";
  activeStatus: "active" | "hiatus" | "ended";
  latestEpisodeDate: string | null;
  oldestEpisodeDate: string | null;
}

function computeAnalytics(episodes: SpotifyEpisode[]): ShowAnalytics {
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
      latestEpisodeDate: null,
      oldestEpisodeDate: null,
    };
  }

  // Sort episodes by release date descending (newest first)
  const sorted = [...episodes].sort(
    (a, b) =>
      new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
  );

  // Duration calculations
  const totalDurationMs = episodes.reduce((sum, ep) => sum + ep.duration_ms, 0);
  const avgDurationMs = Math.round(totalDurationMs / episodes.length);
  const avgDurationMinutes = Math.round(avgDurationMs / 60000);
  const totalContentHours = parseFloat((totalDurationMs / 3600000).toFixed(1));

  // Longest and shortest episodes
  const longestEp = episodes.reduce((max, ep) =>
    ep.duration_ms > max.duration_ms ? ep : max
  );
  const shortestEp = episodes.reduce((min, ep) =>
    ep.duration_ms < min.duration_ms ? ep : min
  );

  // Release frequency (average days between consecutive episodes)
  let releaseFrequencyDays: number | null = null;
  if (sorted.length >= 2) {
    let totalDaysBetween = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = new Date(sorted[i].release_date).getTime();
      const next = new Date(sorted[i + 1].release_date).getTime();
      totalDaysBetween += (current - next) / (1000 * 60 * 60 * 24);
    }
    releaseFrequencyDays = parseFloat(
      (totalDaysBetween / (sorted.length - 1)).toFixed(1)
    );
  }

  // Publishing pattern
  let publishingPattern: ShowAnalytics["publishingPattern"] = "irregular";
  if (releaseFrequencyDays !== null) {
    if (releaseFrequencyDays >= 5 && releaseFrequencyDays <= 9) {
      publishingPattern = "weekly";
    } else if (releaseFrequencyDays >= 12 && releaseFrequencyDays <= 18) {
      publishingPattern = "biweekly";
    } else if (releaseFrequencyDays >= 25 && releaseFrequencyDays <= 35) {
      publishingPattern = "monthly";
    }
  }

  // Active status based on most recent episode
  const latestDate = new Date(sorted[0].release_date);
  const daysSinceLastEpisode =
    (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24);

  let activeStatus: ShowAnalytics["activeStatus"] = "ended";
  if (daysSinceLastEpisode < 30) {
    activeStatus = "active";
  } else if (daysSinceLastEpisode < 180) {
    activeStatus = "hiatus";
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
    latestEpisodeDate: sorted[0].release_date,
    oldestEpisodeDate: sorted[sorted.length - 1].release_date,
  };
}

/**
 * Fetch all episodes for a show by paginating through the API.
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

export async function POST(request: NextRequest) {
  try {
    let body: { showIds?: string[]; market?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { showIds, market = "VN" } = body;

    // Validate showIds
    if (!showIds || !Array.isArray(showIds)) {
      return NextResponse.json(
        { error: "showIds must be an array of Spotify show IDs" },
        { status: 400 }
      );
    }

    if (showIds.length < 2 || showIds.length > 4) {
      return NextResponse.json(
        { error: "showIds must contain 2 to 4 IDs" },
        { status: 400 }
      );
    }

    // Validate each ID is a non-empty string
    if (showIds.some((id) => typeof id !== "string" || id.trim().length === 0)) {
      return NextResponse.json(
        { error: "Each showId must be a non-empty string" },
        { status: 400 }
      );
    }

    // Fetch all shows and their episodes in parallel
    const results = await Promise.all(
      showIds.map(async (showId) => {
        const [show, episodes] = await Promise.all([
          getShow(showId, market),
          fetchAllEpisodes(showId, market),
        ]);

        const analytics = computeAnalytics(episodes);

        return { show, analytics };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("[/api/compare] Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
