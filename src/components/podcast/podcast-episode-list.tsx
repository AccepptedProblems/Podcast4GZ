"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Clock, Calendar, ChevronLeft, ChevronRight, Podcast, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SpotifyEpisode } from "@/lib/spotify/types";
import { formatDuration, formatDate, truncateText } from "@/lib/utils";

const EPISODES_PER_PAGE = 10;

interface PodcastEpisodeListProps {
  showId: string;
  initialEpisodes: SpotifyEpisode[];
}

export function PodcastEpisodeList({
  showId,
  initialEpisodes,
}: PodcastEpisodeListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "longest" | "shortest">("newest");
  const [page, setPage] = useState(0);

  const filteredEpisodes = useMemo(() => {
    let filtered = [...initialEpisodes];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ep) =>
          ep.name.toLowerCase().includes(q) ||
          ep.description.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortOrder) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.release_date).getTime() -
            new Date(a.release_date).getTime()
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.release_date).getTime() -
            new Date(b.release_date).getTime()
        );
        break;
      case "longest":
        filtered.sort((a, b) => b.duration_ms - a.duration_ms);
        break;
      case "shortest":
        filtered.sort((a, b) => a.duration_ms - b.duration_ms);
        break;
    }

    return filtered;
  }, [initialEpisodes, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filteredEpisodes.length / EPISODES_PER_PAGE);
  const paginatedEpisodes = filteredEpisodes.slice(
    page * EPISODES_PER_PAGE,
    (page + 1) * EPISODES_PER_PAGE
  );

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search episodes..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={sortOrder}
          onValueChange={(v) => {
            setSortOrder(v as typeof sortOrder);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="longest">Longest first</SelectItem>
            <SelectItem value="shortest">Shortest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results info */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {paginatedEpisodes.length} of {filteredEpisodes.length} episodes
      </p>

      {/* Episode List */}
      {paginatedEpisodes.length > 0 ? (
        <div className="space-y-3">
          {paginatedEpisodes.map((episode) => {
            const imageUrl = episode.images?.[1]?.url || episode.images?.[0]?.url;
            return (
              <Link key={episode.id} href={`/episode/${episode.id}`}>
                <Card className="hover:border-primary/50 hover:shadow-sm transition-all mb-3">
                  <CardContent className="flex gap-3 p-3">
                    <div className="shrink-0">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={episode.name}
                          width={64}
                          height={64}
                          className="rounded-md object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                          <Podcast className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate mb-1">
                        {episode.name}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {truncateText(episode.description, 120)}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(episode.release_date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(episode.duration_ms)}
                        </span>
                        {episode.audio_preview_url && (
                          <Badge variant="secondary" className="text-xs py-0">
                            <Play className="h-2.5 w-2.5 mr-0.5" />
                            Preview
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Podcast className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? "No episodes match your search."
              : "No episodes available."}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
