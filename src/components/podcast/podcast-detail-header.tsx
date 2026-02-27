"use client";

import * as React from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { cn, formatNumber, formatDuration } from "@/lib/utils";
import type { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PodcastDetailHeaderProps {
  /** The podcast show data */
  show: SpotifyShow;
  /** Episodes list for computing analytics */
  episodes?: SpotifyEpisode[];
  /** Additional CSS class names */
  className?: string;
}

export function PodcastDetailHeader({
  show,
  episodes = [],
  className,
}: PodcastDetailHeaderProps) {
  const [descriptionExpanded, setDescriptionExpanded] = React.useState(false);

  const coverImage = show.images?.[0]?.url ?? "/placeholder-podcast.png";
  const descriptionTooLong = show.description.length > 300;

  // Compute stats from episodes
  const totalDurationMs = episodes.reduce(
    (sum, ep) => sum + ep.duration_ms,
    0
  );
  const avgDurationMs =
    episodes.length > 0 ? Math.round(totalDurationMs / episodes.length) : 0;
  const contentHours = (totalDurationMs / (1000 * 60 * 60)).toFixed(1);

  // Determine status from the most recent episode
  const sortedEpisodes = [...episodes].sort(
    (a, b) =>
      new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
  );
  const lastEpisodeDate = sortedEpisodes[0]?.release_date;
  let status: "Active" | "Hiatus" | "Ended" = "Ended";
  if (lastEpisodeDate) {
    const daysSince =
      (Date.now() - new Date(lastEpisodeDate).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSince <= 30) status = "Active";
    else if (daysSince <= 90) status = "Hiatus";
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-8 md:flex-row md:items-start",
        className
      )}
    >
      {/* Cover Art */}
      <div className="relative h-[300px] w-[300px] shrink-0 overflow-hidden rounded-lg shadow-lg">
        <Image
          src={coverImage}
          alt={show.name}
          fill
          className="object-cover"
          sizes="300px"
          priority
        />
      </div>

      {/* Info Section */}
      <div className="flex flex-1 flex-col space-y-4 text-center md:text-left">
        {/* Title */}
        <h1 className="text-3xl font-bold tracking-tight">{show.name}</h1>

        {/* Publisher */}
        <p className="text-lg text-muted-foreground">{show.publisher}</p>

        {/* Description */}
        <div>
          <p
            className={cn(
              "text-sm text-muted-foreground leading-relaxed",
              !descriptionExpanded && descriptionTooLong && "line-clamp-4"
            )}
          >
            {show.description}
          </p>
          {descriptionTooLong && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              className="px-0 h-auto"
            >
              {descriptionExpanded ? "Show less" : "Read more"}
            </Button>
          )}
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:justify-start">
          <div className="text-center">
            <p className="text-2xl font-bold">
              {formatNumber(show.total_episodes)}
            </p>
            <p className="text-xs text-muted-foreground">Total Episodes</p>
          </div>
          <Separator orientation="vertical" className="h-10 hidden sm:block" />
          <div className="text-center">
            <p className="text-2xl font-bold">
              {avgDurationMs > 0 ? formatDuration(avgDurationMs) : "N/A"}
            </p>
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </div>
          <Separator orientation="vertical" className="h-10 hidden sm:block" />
          <div className="text-center">
            <p className="text-2xl font-bold">{contentHours}h</p>
            <p className="text-xs text-muted-foreground">Content Hours</p>
          </div>
          <Separator orientation="vertical" className="h-10 hidden sm:block" />
          <div className="text-center">
            <Badge
              variant={
                status === "Active"
                  ? "default"
                  : status === "Hiatus"
                  ? "secondary"
                  : "outline"
              }
            >
              {status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">Status</p>
          </div>
        </div>

        {/* Language & Explicit Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
          {show.languages?.map((lang) => (
            <Badge key={lang} variant="outline">
              {lang}
            </Badge>
          ))}
          {show.explicit && <Badge variant="destructive">Explicit</Badge>}
        </div>

        {/* Open in Spotify */}
        <div className="pt-2">
          <Button asChild>
            <a
              href={show.external_urls?.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Open in Spotify
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
