"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PodcastGrid } from "@/components/podcast/podcast-grid";
import { EpisodeCard } from "@/components/episode/episode-card";

interface SearchResultsProps {
  /** Search query string for the header display */
  query: string;
  /** Podcast results */
  shows?: SpotifyShow[];
  /** Episode results */
  episodes?: SpotifyEpisode[];
  /** Whether results are loading */
  isLoading?: boolean;
  /** Additional CSS class names */
  className?: string;
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-40 w-40 rounded-md" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4 text-muted-foreground">~</div>
      <h3 className="text-lg font-semibold">No results found</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        {query
          ? `No podcasts or episodes matched "${query}". Try adjusting your search terms or filters.`
          : "Start searching to discover Vietnamese podcasts on Spotify."}
      </p>
    </div>
  );
}

export function SearchResults({
  query,
  shows = [],
  episodes = [],
  isLoading = false,
  className,
}: SearchResultsProps) {
  const totalResults = shows.length + episodes.length;

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Skeleton className="h-6 w-48" />
        <LoadingSkeleton />
      </div>
    );
  }

  if (!query) {
    return <EmptyState query="" />;
  }

  if (totalResults === 0) {
    return <EmptyState query={query} />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      <p className="text-sm text-muted-foreground">
        {totalResults} result{totalResults !== 1 ? "s" : ""} for &ldquo;{query}
        &rdquo;
      </p>

      <Tabs defaultValue="podcasts" className="w-full">
        <TabsList>
          <TabsTrigger value="podcasts">
            Podcasts ({shows.length})
          </TabsTrigger>
          <TabsTrigger value="episodes">
            Episodes ({episodes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="podcasts" className="mt-6">
          {shows.length > 0 ? (
            <PodcastGrid shows={shows} />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No podcast shows found.
            </p>
          )}
        </TabsContent>

        <TabsContent value="episodes" className="mt-6">
          {episodes.length > 0 ? (
            <div className="space-y-3">
              {episodes.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No episodes found.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
