import * as React from "react";

import { cn } from "@/lib/utils";
import type { SpotifyShow } from "@/lib/spotify/types";
import { PodcastCard } from "@/components/podcast/podcast-card";

interface PodcastGridProps {
  /** Array of Spotify shows to display */
  shows: SpotifyShow[];
  /** Additional CSS class names */
  className?: string;
}

export function PodcastGrid({ shows, className }: PodcastGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {shows.map((show) => (
        <PodcastCard key={show.id} show={show} />
      ))}
    </div>
  );
}
