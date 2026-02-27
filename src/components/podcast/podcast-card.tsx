"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { SpotifyShow } from "@/lib/spotify/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PodcastCardProps {
  /** Spotify show data */
  show: SpotifyShow;
  /** Additional CSS class names */
  className?: string;
}

export function PodcastCard({ show, className }: PodcastCardProps) {
  const coverImage =
    show.images?.[0]?.url ?? "/placeholder-podcast.png";

  return (
    <Link href={`/podcast/${show.id}`}>
      <Card
        className={cn(
          "group overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
          className
        )}
      >
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center space-y-3">
            {/* Cover Art */}
            <div className="relative h-40 w-40 overflow-hidden rounded-md">
              <Image
                src={coverImage}
                alt={show.name}
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>

            {/* Podcast Name */}
            <h3 className="font-bold text-sm leading-tight line-clamp-2">
              {show.name}
            </h3>

            {/* Publisher */}
            <p className="text-xs text-muted-foreground line-clamp-1">
              {show.publisher}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <Badge variant="secondary" className="text-xs">
                {show.total_episodes} ep{show.total_episodes !== 1 ? "s" : ""}
              </Badge>

              {show.languages?.map((lang) => (
                <Badge key={lang} variant="outline" className="text-xs">
                  {lang}
                </Badge>
              ))}

              {show.explicit && (
                <Badge variant="destructive" className="text-xs">
                  E
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
