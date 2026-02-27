// =============================================================================
// GET /api/shows/[id]/episodes
// =============================================================================
// Fetches paginated episodes for a podcast (show) by its Spotify ID.
//
// Path params:
//   id     - Spotify show ID (required)
//
// Query params:
//   limit  - Number of episodes per page (default: 50, max: 50)
//   offset - Pagination offset (default: 0)
//   market - Market code (default: "VN")
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getShowEpisodes } from "@/lib/spotify/client";

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

    const { searchParams } = request.nextUrl;
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "50", 10) || 50, 1),
      50
    );
    const offset = Math.max(
      parseInt(searchParams.get("offset") || "0", 10) || 0,
      0
    );
    const market = searchParams.get("market") || "VN";

    const result = await getShowEpisodes(id, { limit, offset, market });

    return NextResponse.json({
      data: result.items,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      next: result.next,
      previous: result.previous,
    });
  } catch (error) {
    console.error("[/api/shows/[id]/episodes] Error:", error);

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
