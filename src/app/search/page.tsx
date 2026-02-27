"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Podcast,
  Clock,
  Calendar,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";
import { formatDuration, truncateText } from "@/lib/utils";

const RESULTS_PER_PAGE = 10;

interface SearchResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const initialType = searchParams.get("type") || "show";
  const initialMarket = searchParams.get("market") || "VN";
  const initialLanguage = searchParams.get("language") || "vi";

  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<"show" | "episode">(
    initialType === "episode" ? "episode" : "show"
  );
  const [market, setMarket] = useState(initialMarket);
  const [language, setLanguage] = useState(initialLanguage);
  const [sortBy, setSortBy] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [offset, setOffset] = useState(0);

  const [shows, setShows] = useState<SpotifyShow[]>([]);
  const [episodes, setEpisodes] = useState<SpotifyEpisode[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [popularShows, setPopularShows] = useState<SpotifyShow[]>([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  const fetchResults = useCallback(
    async (q: string, type: "show" | "episode", off: number) => {
      if (!q.trim()) return;

      setLoading(true);
      setHasSearched(true);

      try {
        const params = new URLSearchParams({
          q: q.trim(),
          type,
          market,
          limit: String(RESULTS_PER_PAGE),
          offset: String(off),
        });
        if (language) {
          params.set("language", language);
        }

        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error("Search failed");

        if (type === "show") {
          const data: SearchResponse<SpotifyShow> = await res.json();
          setShows(data.data);
          setEpisodes([]);
          setTotal(data.total);
        } else {
          const data: SearchResponse<SpotifyEpisode> = await res.json();
          setEpisodes(data.data);
          setShows([]);
          setTotal(data.total);
        }
      } catch (err) {
        console.error("Search error:", err);
        setShows([]);
        setEpisodes([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [market, language]
  );

  // Fetch popular Vietnamese podcasts on first load
  useEffect(() => {
    const fetchPopular = async () => {
      setLoadingPopular(true);
      try {
        const queries = ["podcast tiếng Việt", "Việt Nam podcast", "podcast hay"];
        const allShows: SpotifyShow[] = [];
        const seenIds = new Set<string>();

        const results = await Promise.all(
          queries.map((q) =>
            fetch(`/api/search?q=${encodeURIComponent(q)}&type=show&market=VN&language=vi&limit=10`)
              .then((r) => r.json())
              .catch(() => ({ data: [] }))
          )
        );

        for (const result of results) {
          for (const show of result.data || []) {
            if (!seenIds.has(show.id)) {
              seenIds.add(show.id);
              allShows.push(show);
            }
          }
        }

        // Sort by total_episodes descending as a proxy for popularity
        allShows.sort((a, b) => b.total_episodes - a.total_episodes);
        setPopularShows(allShows.slice(0, 20));
      } catch (err) {
        console.error("Failed to fetch popular podcasts:", err);
      } finally {
        setLoadingPopular(false);
      }
    };

    if (!initialQuery) {
      fetchPopular();
    } else {
      setLoadingPopular(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-search when URL params change
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setOffset(0);
      fetchResults(initialQuery, searchType, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setOffset(0);
    const params = new URLSearchParams({ q: trimmed, type: searchType, market, language: language || "vi" });
    router.push(`/search?${params.toString()}`);
    fetchResults(trimmed, searchType, 0);
  };

  const handleTabChange = (value: string) => {
    const type = value as "show" | "episode";
    setSearchType(type);
    setOffset(0);
    if (query.trim()) {
      fetchResults(query, type, 0);
    }
  };

  const handlePageChange = (newOffset: number) => {
    setOffset(newOffset);
    fetchResults(query, searchType, newOffset);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(total / RESULTS_PER_PAGE);
  const currentPage = Math.floor(offset / RESULTS_PER_PAGE) + 1;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Search Podcasts</h1>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search Vietnamese podcasts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </form>

        {/* Filters (collapsible) */}
        {showFilters && (
          <div className="mt-4 p-4 border rounded-lg bg-card">
            <h3 className="text-sm font-medium mb-3">Filters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Market
                </label>
                <Select value={market} onValueChange={setMarket}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VN">Vietnam (VN)</SelectItem>
                    <SelectItem value="US">United States (US)</SelectItem>
                    <SelectItem value="GB">United Kingdom (GB)</SelectItem>
                    <SelectItem value="SG">Singapore (SG)</SelectItem>
                    <SelectItem value="JP">Japan (JP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Language
                </label>
                <Select value={language || "vi"} onValueChange={(v) => setLanguage(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    <SelectItem value="vi">Vietnamese</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Sort By
                </label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={searchType} onValueChange={handleTabChange}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="show">Podcasts</TabsTrigger>
            <TabsTrigger value="episode">Episodes</TabsTrigger>
          </TabsList>
          {hasSearched && !loading && (
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString()} result{total !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        {/* Podcast Results */}
        <TabsContent value="show">
          {loading ? (
            <SearchSkeleton />
          ) : shows.length > 0 ? (
            <div className="space-y-4">
              {shows.map((show) => (
                <ShowCard key={show.id} show={show} />
              ))}
            </div>
          ) : hasSearched ? (
            <EmptyState />
          ) : loadingPopular ? (
            <SearchSkeleton />
          ) : (
            <PopularPodcasts shows={popularShows} />
          )}
        </TabsContent>

        {/* Episode Results */}
        <TabsContent value="episode">
          {loading ? (
            <SearchSkeleton />
          ) : episodes.length > 0 ? (
            <div className="space-y-4">
              {episodes.map((episode) => (
                <EpisodeCard key={episode.id} episode={episode} />
              ))}
            </div>
          ) : hasSearched ? (
            <EmptyState />
          ) : loadingPopular ? (
            <SearchSkeleton />
          ) : (
            <PopularPodcasts shows={popularShows} />
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {total > RESULTS_PER_PAGE && !loading && (
        <>
          <Separator className="my-6" />
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => handlePageChange(Math.max(0, offset - RESULTS_PER_PAGE))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + RESULTS_PER_PAGE >= total}
              onClick={() => handlePageChange(offset + RESULTS_PER_PAGE)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ShowCard({ show }: { show: SpotifyShow }) {
  const imageUrl = show.images?.[0]?.url;

  return (
    <Link href={`/podcast/${show.id}`}>
      <Card className="hover:border-primary/50 hover:shadow-md transition-all">
        <CardContent className="flex gap-4 p-4">
          <div className="shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={show.name}
                width={80}
                height={80}
                className="rounded-md object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center">
                <Podcast className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1 truncate">
              {show.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {show.publisher}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {truncateText(show.description, 150)}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {show.total_episodes} episodes
              </Badge>
              {show.languages?.map((lang) => (
                <Badge key={lang} variant="outline" className="text-xs">
                  {lang}
                </Badge>
              ))}
              {show.explicit && (
                <Badge variant="destructive" className="text-xs">
                  Explicit
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EpisodeCard({ episode }: { episode: SpotifyEpisode }) {
  const imageUrl = episode.images?.[0]?.url;

  return (
    <Link href={`/episode/${episode.id}`}>
      <Card className="hover:border-primary/50 hover:shadow-md transition-all">
        <CardContent className="flex gap-4 p-4">
          <div className="shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={episode.name}
                width={80}
                height={80}
                className="rounded-md object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center">
                <Podcast className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-1 truncate">
              {episode.name}
            </h3>
            {episode.show && (
              <p className="text-sm text-primary mb-1">{episode.show.name}</p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {truncateText(episode.description, 150)}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(episode.duration_ms)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {episode.release_date}
              </span>
              {episode.explicit && (
                <Badge variant="destructive" className="text-xs">
                  Explicit
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex gap-4 p-4">
            <Skeleton className="w-20 h-20 rounded-md shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium mb-2">No results found</h3>
      <p className="text-sm text-muted-foreground">
        Try a different search term or adjust your filters.
      </p>
    </div>
  );
}

function PopularPodcasts({ shows }: { shows: SpotifyShow[] }) {
  if (shows.length === 0) {
    return (
      <div className="text-center py-16">
        <Podcast className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Search for podcasts</h3>
        <p className="text-sm text-muted-foreground">
          Enter a keyword above to discover Vietnamese podcasts on Spotify.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Podcast className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Popular Vietnamese Podcasts</h2>
      </div>
      <div className="space-y-4">
        {shows.map((show) => (
          <ShowCard key={show.id} show={show} />
        ))}
      </div>
    </div>
  );
}
