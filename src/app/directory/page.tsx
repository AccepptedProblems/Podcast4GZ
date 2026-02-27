"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Fuse from "fuse.js";
import {
  Library,
  Search,
  Podcast,
  Filter,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SpotifyShow } from "@/lib/spotify/types";
import { truncateText } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface IndexedShow {
  id: string;
  name: string;
  description: string;
  publisher: string;
  languages: string;
  totalEpisodes: number;
  imageUrl: string | null;
  activeStatus: string | null;
}

export default function DirectoryPage() {
  const [shows, setShows] = useState<IndexedShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [episodeMinFilter, setEpisodeMinFilter] = useState<string>("0");

  // Fetch indexed shows from directory
  useEffect(() => {
    async function fetchDirectory() {
      setLoading(true);
      try {
        const res = await fetch("/api/directory");
        if (res.ok) {
          const data = await res.json();
          setShows(data.data || []);
        } else {
          // API might not exist yet -- that's expected
          setShows([]);
        }
      } catch {
        setShows([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDirectory();
  }, []);

  // Fuse.js setup for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(shows, {
      keys: ["name", "publisher", "description"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [shows]);

  // Filtered and searched shows
  const filteredShows = useMemo(() => {
    let results = shows;

    // Fuzzy search
    if (searchQuery.trim()) {
      results = fuse.search(searchQuery).map((r) => r.item);
    }

    // Alphabet filter
    if (activeLetter) {
      results = results.filter((s) =>
        s.name.toUpperCase().startsWith(activeLetter)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      results = results.filter((s) => s.activeStatus === statusFilter);
    }

    // Episode count filter
    const minEpisodes = parseInt(episodeMinFilter, 10) || 0;
    if (minEpisodes > 0) {
      results = results.filter((s) => s.totalEpisodes >= minEpisodes);
    }

    return results;
  }, [shows, searchQuery, activeLetter, statusFilter, episodeMinFilter, fuse]);

  // Group shows by first letter for display
  const newThisWeek = useMemo(() => {
    return shows.slice(0, 4); // Placeholder: last 4 added
  }, [shows]);

  const mostActive = useMemo(() => {
    return [...shows]
      .filter((s) => s.activeStatus === "active")
      .sort((a, b) => b.totalEpisodes - a.totalEpisodes)
      .slice(0, 4);
  }, [shows]);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Library className="h-6 w-6 text-primary" />
          Vietnamese Podcast Directory
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse and discover indexed Vietnamese podcasts
        </p>
      </div>

      {/* Alphabet Navigation */}
      <div className="flex flex-wrap gap-1 mb-6">
        <Button
          variant={activeLetter === null ? "default" : "outline"}
          size="sm"
          className="h-8 w-8 p-0 text-xs"
          onClick={() => setActiveLetter(null)}
        >
          All
        </Button>
        {ALPHABET.map((letter) => (
          <Button
            key={letter}
            variant={activeLetter === letter ? "default" : "ghost"}
            size="sm"
            className="h-8 w-8 p-0 text-xs"
            onClick={() =>
              setActiveLetter(activeLetter === letter ? null : letter)
            }
          >
            {letter}
          </Button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search directory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hiatus">On Hiatus</SelectItem>
            <SelectItem value="ended">Ended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={episodeMinFilter} onValueChange={setEpisodeMinFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Min Episodes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any Episodes</SelectItem>
            <SelectItem value="10">10+ Episodes</SelectItem>
            <SelectItem value="50">50+ Episodes</SelectItem>
            <SelectItem value="100">100+ Episodes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex gap-3 p-4">
                <Skeleton className="w-16 h-16 rounded-md shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && shows.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              No podcasts indexed yet
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Use Search to discover and add podcasts to the directory. Once
              indexed, podcasts will appear here for browsing.
            </p>
            <Link href="/search">
              <Button className="gap-2">
                <Search className="h-4 w-4" />
                Go to Search
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {!loading && shows.length > 0 && (
        <>
          {/* Featured Sections (only when not filtering) */}
          {!searchQuery && !activeLetter && statusFilter === "all" && (
            <>
              {/* New This Week */}
              {newThisWeek.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4">
                    Recently Added
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {newThisWeek.map((show) => (
                      <DirectoryCard key={show.id} show={show} />
                    ))}
                  </div>
                </div>
              )}

              {/* Most Active */}
              {mostActive.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4">Most Active</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {mostActive.map((show) => (
                      <DirectoryCard key={show.id} show={show} />
                    ))}
                  </div>
                </div>
              )}

              <h2 className="text-lg font-semibold mb-4">All Podcasts</h2>
            </>
          )}

          {/* Results Info */}
          <p className="text-sm text-muted-foreground mb-4">
            {filteredShows.length} podcast{filteredShows.length !== 1 ? "s" : ""}{" "}
            {searchQuery && `matching "${searchQuery}"`}
            {activeLetter && ` starting with "${activeLetter}"`}
          </p>

          {/* Grid */}
          {filteredShows.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShows.map((show) => (
                <DirectoryCard key={show.id} show={show} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No podcasts match your current filters.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Directory Card sub-component
// ---------------------------------------------------------------------------

function DirectoryCard({ show }: { show: IndexedShow }) {
  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-600 border-green-200",
    hiatus: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    ended: "bg-red-500/10 text-red-600 border-red-200",
  };

  return (
    <Link href={`/podcast/${show.id}`}>
      <Card className="hover:border-primary/50 hover:shadow-md transition-all h-full">
        <CardContent className="flex gap-3 p-4">
          <div className="shrink-0">
            {show.imageUrl ? (
              <Image
                src={show.imageUrl}
                alt={show.name}
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
            <h3 className="font-medium text-sm truncate">{show.name}</h3>
            <p className="text-xs text-muted-foreground truncate mb-1">
              {show.publisher}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className="text-xs py-0">
                {show.totalEpisodes} eps
              </Badge>
              {show.activeStatus && (
                <Badge
                  className={`text-xs py-0 ${statusColors[show.activeStatus] || ""}`}
                >
                  {show.activeStatus}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
