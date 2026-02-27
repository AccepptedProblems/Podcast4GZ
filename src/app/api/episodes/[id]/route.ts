// =============================================================================
// GET /api/episodes/[id]
// =============================================================================
// Fetches details for a single episode by its Spotify ID.
//
// Path params:
//   id     - Spotify episode ID (required)
//
// Query params:
//   market - Market code (default: "VN")
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getEpisode } from "@/lib/spotify/client";

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

    const episode = await getEpisode(id, market);

    return NextResponse.json(episode);
  } catch (error) {
    console.error("[/api/episodes/[id]] Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status =
      error instanceof Error && "status" in error
        ? (error as { status: number }).status
        : 500;

    if (status === 404) {
      return NextResponse.json(
        { error: "Episode not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ error: message }, { status });
  }
}
