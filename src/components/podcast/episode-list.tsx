"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { SpotifyEpisode } from "@/lib/spotify/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EpisodeCard } from "@/components/episode/episode-card";

type SortOption = "newest" | "oldest" | "longest" | "shortest" | "name";

interface EpisodeListProps {
  /** Array of episodes to display */
  episodes: SpotifyEpisode[];
  /** Whether the episodes are loading */
  isLoading?: boolean;
  /** Number of episodes to show per page */
  pageSize?: number;
  /** Additional CSS class names */
  className?: string;
}

function EpisodeListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border rounded-lg">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EpisodeList({
  episodes,
  isLoading = false,
  pageSize = 20,
  className,
}: EpisodeListProps) {
  const [sortBy, setSortBy] = React.useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(pageSize);

  // Filter episodes by search query
  const filteredEpisodes = React.useMemo(() => {
    if (!searchQuery.trim()) return episodes;
    const query = searchQuery.toLowerCase();
    return episodes.filter(
      (ep) =>
        ep.name.toLowerCase().includes(query) ||
        ep.description?.toLowerCase().includes(query)
    );
  }, [episodes, searchQuery]);

  // Sort episodes
  const sortedEpisodes = React.useMemo(() => {
    const sorted = [...filteredEpisodes];
    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.release_date).getTime() -
            new Date(a.release_date).getTime()
        );
      case "oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.release_date).getTime() -
            new Date(b.release_date).getTime()
        );
      case "longest":
        return sorted.sort((a, b) => b.duration_ms - a.duration_ms);
      case "shortest":
        return sorted.sort((a, b) => a.duration_ms - b.duration_ms);
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return sorted;
    }
  }, [filteredEpisodes, sortBy]);

  const visibleEpisodes = sortedEpisodes.slice(0, visibleCount);
  const hasMore = visibleCount < sortedEpisodes.length;

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <EpisodeListSkeleton />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Search within episodes..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(pageSize);
          }}
          className="sm:max-w-xs"
        />

        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as SortOption)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="longest">Longest First</SelectItem>
            <SelectItem value="shortest">Shortest First</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {sortedEpisodes.length} episode{sortedEpisodes.length !== 1 ? "s" : ""}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>

      {/* Episode list */}
      {visibleEpisodes.length > 0 ? (
        <div className="space-y-3">
          {visibleEpisodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No episodes match your search.
        </p>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setVisibleCount((prev) => prev + pageSize)}
          >
            Load More ({sortedEpisodes.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
