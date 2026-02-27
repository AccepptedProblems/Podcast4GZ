"use client";

import * as React from "react";
import Link from "next/link";

import { cn, formatDuration, formatDate } from "@/lib/utils";
import type { SpotifyEpisode } from "@/lib/spotify/types";
import { Card, CardContent } from "@/components/ui/card";
import { AudioPreview } from "@/components/episode/audio-preview";

interface EpisodeCardProps {
  /** Spotify episode data */
  episode: SpotifyEpisode;
  /** Additional CSS class names */
  className?: string;
}

export function EpisodeCard({ episode, className }: EpisodeCardProps) {
  return (
    <Card className={cn("transition-colors hover:bg-accent/50", className)}>
      <CardContent className="flex items-start gap-4 p-4">
        {/* Audio Preview Button */}
        <div className="shrink-0 pt-1">
          <AudioPreview
            audioUrl={episode.audio_preview_url}
            compact
          />
        </div>

        {/* Episode Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <Link
            href={`/episode/${episode.id}`}
            className="hover:underline"
          >
            <h4 className="font-bold text-sm leading-tight line-clamp-1">
              {episode.name}
            </h4>
          </Link>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(episode.release_date)}</span>
            <span aria-hidden="true">-</span>
            <span>{formatDuration(episode.duration_ms)}</span>
          </div>

          {episode.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {episode.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
