export const dynamic = "force-dynamic";

// =============================================================================
// GET /api/export
// =============================================================================
// Exports data as CSV. Supports exporting search results, episodes for a show,
// and comparison data.
//
// Query params:
//   type    - Export format: "csv" or "pdf" (required)
//   data    - Data source: "search", "episodes", or "compare" (required)
//
// Additional params depending on data source:
//   For "search":
//     q        - Search keyword (required)
//     searchType - "show" or "episode" (default: "show")
//     market   - Market code (default: "VN")
//
//   For "episodes":
//     showId   - Spotify show ID (required)
//     market   - Market code (default: "VN")
//
//   For "compare":
//     showIds  - Comma-separated Spotify show IDs (required, 2-4 IDs)
//     market   - Market code (default: "VN")
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  searchShows,
  searchEpisodes,
  getShow,
  getShowEpisodes,
} from "@/lib/spotify/client";
import type { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";

// ---------------------------------------------------------------------------
// CSV Helpers
// ---------------------------------------------------------------------------

/**
 * Escape a value for CSV: wrap in quotes if it contains commas, quotes, or newlines.
 */
function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of objects to a CSV string.
 */
function toCsv(headers: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCsvValue).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvValue).join(","));
  return [headerLine, ...dataLines].join("\n");
}

/**
 * Create a CSV response with appropriate headers for file download.
 */
function csvResponse(csv: string, filename: string): NextResponse {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// ---------------------------------------------------------------------------
// Data source: Search
// ---------------------------------------------------------------------------

async function exportSearch(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 }
    );
  }

  const searchType = searchParams.get("searchType") || "show";
  const market = searchParams.get("market") || "VN";

  if (searchType === "show") {
    const result = await searchShows(q, { market, limit: 50, offset: 0 });
    const headers = [
      "ID",
      "Name",
      "Publisher",
      "Description",
      "Total Episodes",
      "Languages",
      "Explicit",
      "Spotify URL",
    ];
    const rows = result.items.map((show: SpotifyShow) => [
      show.id,
      show.name,
      show.publisher,
      show.description,
      show.total_episodes,
      show.languages.join("; "),
      show.explicit,
      show.external_urls.spotify,
    ]);

    return csvResponse(toCsv(headers, rows), `search-shows-${q}.csv`);
  }

  // searchType === "episode"
  const result = await searchEpisodes(q, { market, limit: 50, offset: 0 });
  const headers = [
    "ID",
    "Name",
    "Description",
    "Duration (ms)",
    "Duration (min)",
    "Release Date",
    "Languages",
    "Explicit",
    "Spotify URL",
  ];
  const rows = result.items.map((ep: SpotifyEpisode) => [
    ep.id,
    ep.name,
    ep.description,
    ep.duration_ms,
    Math.round(ep.duration_ms / 60000),
    ep.release_date,
    ep.languages.join("; "),
    ep.explicit,
    ep.external_urls.spotify,
  ]);

  return csvResponse(toCsv(headers, rows), `search-episodes-${q}.csv`);
}

// ---------------------------------------------------------------------------
// Data source: Episodes
// ---------------------------------------------------------------------------

async function exportEpisodes(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const showId = searchParams.get("showId");

  if (!showId || showId.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required query parameter: showId" },
      { status: 400 }
    );
  }

  const market = searchParams.get("market") || "VN";

  // Fetch show name for the filename
  const show = await getShow(showId, market);

  // Fetch all episodes by paginating
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

  const headers = [
    "ID",
    "Name",
    "Description",
    "Duration (ms)",
    "Duration (min)",
    "Release Date",
    "Languages",
    "Explicit",
    "Playable",
    "Spotify URL",
  ];
  const rows = allEpisodes.map((ep) => [
    ep.id,
    ep.name,
    ep.description,
    ep.duration_ms,
    Math.round(ep.duration_ms / 60000),
    ep.release_date,
    ep.languages.join("; "),
    ep.explicit,
    ep.is_playable,
    ep.external_urls.spotify,
  ]);

  // Sanitize show name for filename
  const safeName = show.name.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50);
  return csvResponse(toCsv(headers, rows), `episodes-${safeName}.csv`);
}

// ---------------------------------------------------------------------------
// Data source: Compare
// ---------------------------------------------------------------------------

async function exportCompare(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const showIdsParam = searchParams.get("showIds");

  if (!showIdsParam || showIdsParam.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required query parameter: showIds (comma-separated)" },
      { status: 400 }
    );
  }

  const showIds = showIdsParam.split(",").map((id) => id.trim());

  if (showIds.length < 2 || showIds.length > 4) {
    return NextResponse.json(
      { error: "showIds must contain 2 to 4 IDs" },
      { status: 400 }
    );
  }

  const market = searchParams.get("market") || "VN";

  // Fetch all shows and their episodes in parallel
  const results = await Promise.all(
    showIds.map(async (showId) => {
      const [show, episodesPage] = await Promise.all([
        getShow(showId, market),
        fetchAllEpisodesForExport(showId, market),
      ]);

      return { show, episodes: episodesPage };
    })
  );

  const headers = [
    "Show Name",
    "Publisher",
    "Total Episodes",
    "Avg Duration (min)",
    "Total Content (hours)",
    "Longest Episode",
    "Longest Duration (min)",
    "Shortest Episode",
    "Shortest Duration (min)",
    "Avg Days Between Episodes",
    "Latest Episode Date",
    "Languages",
    "Spotify URL",
  ];

  const rows = results.map(({ show, episodes }) => {
    const totalDurationMs = episodes.reduce(
      (sum, ep) => sum + ep.duration_ms,
      0
    );
    const avgDurationMin =
      episodes.length > 0
        ? Math.round(totalDurationMs / episodes.length / 60000)
        : 0;
    const totalHours =
      episodes.length > 0
        ? parseFloat((totalDurationMs / 3600000).toFixed(1))
        : 0;

    const sorted = [...episodes].sort(
      (a, b) =>
        new Date(b.release_date).getTime() -
        new Date(a.release_date).getTime()
    );

    const longest = episodes.reduce(
      (max, ep) => (ep.duration_ms > max.duration_ms ? ep : max),
      episodes[0]
    );
    const shortest = episodes.reduce(
      (min, ep) => (ep.duration_ms < min.duration_ms ? ep : min),
      episodes[0]
    );

    let avgDaysBetween = "N/A";
    if (sorted.length >= 2) {
      let totalDays = 0;
      for (let i = 0; i < sorted.length - 1; i++) {
        const curr = new Date(sorted[i].release_date).getTime();
        const next = new Date(sorted[i + 1].release_date).getTime();
        totalDays += (curr - next) / (1000 * 60 * 60 * 24);
      }
      avgDaysBetween = (totalDays / (sorted.length - 1)).toFixed(1);
    }

    return [
      show.name,
      show.publisher,
      episodes.length,
      avgDurationMin,
      totalHours,
      longest?.name ?? "N/A",
      longest ? Math.round(longest.duration_ms / 60000) : "N/A",
      shortest?.name ?? "N/A",
      shortest ? Math.round(shortest.duration_ms / 60000) : "N/A",
      avgDaysBetween,
      sorted.length > 0 ? sorted[0].release_date : "N/A",
      show.languages.join("; "),
      show.external_urls.spotify,
    ];
  });

  return csvResponse(toCsv(headers, rows), "compare-podcasts.csv");
}

/**
 * Fetch all episodes for a show by paginating through the API.
 */
async function fetchAllEpisodesForExport(
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const type = searchParams.get("type");
    const data = searchParams.get("data");

    // Validate export format
    if (!type) {
      return NextResponse.json(
        { error: "Missing required query parameter: type" },
        { status: 400 }
      );
    }

    if (type === "pdf") {
      return NextResponse.json(
        { error: "PDF export is not yet implemented (Phase 3)" },
        { status: 501 }
      );
    }

    if (type !== "csv") {
      return NextResponse.json(
        { error: 'Invalid type parameter. Supported types: "csv"' },
        { status: 400 }
      );
    }

    // Validate data source
    if (!data) {
      return NextResponse.json(
        { error: "Missing required query parameter: data" },
        { status: 400 }
      );
    }

    if (!["search", "episodes", "compare"].includes(data)) {
      return NextResponse.json(
        {
          error:
            'Invalid data parameter. Must be "search", "episodes", or "compare".',
        },
        { status: 400 }
      );
    }

    // Route to the appropriate handler
    switch (data) {
      case "search":
        return await exportSearch(request);
      case "episodes":
        return await exportEpisodes(request);
      case "compare":
        return await exportCompare(request);
      default:
        return NextResponse.json(
          { error: "Invalid data source" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[/api/export] Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
