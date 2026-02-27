export const dynamic = "force-dynamic";

// =============================================================================
// GET /api/search
// =============================================================================
// Proxies search requests to the Spotify Web API for shows and episodes.
// Supports optional language post-filtering for Vietnamese content.
//
// Query params:
//   q        - Search keyword (required)
//   type     - "show" or "episode" (default: "show")
//   market   - Market code (default: "VN")
//   language - Language code to post-filter results (e.g. "vi")
//   limit    - Number of results per page (default: 10, max: 50)
//   offset   - Pagination offset (default: 0)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  searchShows,
  searchEpisodes,
} from "@/lib/spotify/client";
import type { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    // ---- Validate required params ----
    const q = searchParams.get("q");
    if (!q || q.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing required query parameter: q" },
        { status: 400 }
      );
    }

    const type = searchParams.get("type") || "show";
    if (type !== "show" && type !== "episode") {
      return NextResponse.json(
        { error: 'Invalid type parameter. Must be "show" or "episode".' },
        { status: 400 }
      );
    }

    const market = searchParams.get("market") || "VN";
    const language = searchParams.get("language") || "vi";
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10) || 10, 1),
      50
    );
    const offset = Math.max(
      parseInt(searchParams.get("offset") || "0", 10) || 0,
      0
    );

    // ---- Perform search ----
    if (type === "show") {
      const result = await searchShows(q, { market, language, limit, offset });

      // Post-filter by language if specified
      let items: SpotifyShow[] = result.items;
      if (language) {
        items = items.filter((show) =>
          show.languages.some((lang) =>
            lang.toLowerCase().startsWith(language.toLowerCase())
          )
        );
      }

      return NextResponse.json({
        data: items,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      });
    }

    // type === "episode"
    const result = await searchEpisodes(q, { market, language, limit, offset });

    let items: SpotifyEpisode[] = result.items;
    if (language) {
      items = items.filter((episode) =>
        episode.languages.some((lang) =>
          lang.toLowerCase().startsWith(language.toLowerCase())
        )
      );
    }

    return NextResponse.json({
      data: items,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error) {
    console.error("[/api/search] Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
