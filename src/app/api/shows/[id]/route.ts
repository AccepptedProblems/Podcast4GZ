// =============================================================================
// GET /api/shows/[id]
// =============================================================================
// Fetches details for a single podcast (show) by its Spotify ID.
//
// Path params:
//   id     - Spotify show ID (required)
//
// Query params:
//   market - Market code (default: "VN")
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getShow } from "@/lib/spotify/client";

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

    const show = await getShow(id, market);

    return NextResponse.json(show);
  } catch (error) {
    console.error("[/api/shows/[id]] Error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    // Spotify returns 404 when a show is not found
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
