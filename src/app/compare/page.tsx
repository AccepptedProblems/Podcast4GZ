"use client";

import { useState, useCallback } from "react";
import {
  GitCompareArrows,
  Download,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CompareSelector } from "@/components/compare/compare-selector";
import { CompareTable } from "@/components/compare/compare-table";
import type { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";
import {
  formatNumber,
  calculateAverageDuration,
  calculateTotalContentHours,
} from "@/lib/utils";

interface PodcastComparison {
  show: SpotifyShow;
  episodes: SpotifyEpisode[];
}

const CHART_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

export default function ComparePage() {
  const [selectedShows, setSelectedShows] = useState<SpotifyShow[]>([]);
  const [searchResults, setSearchResults] = useState<SpotifyShow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [comparisons, setComparisons] = useState<PodcastComparison[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=show&market=VN&limit=5`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch (err) {
      console.error("Compare search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleAdd = useCallback(
    async (show: SpotifyShow) => {
      if (selectedShows.some((s) => s.id === show.id)) return;
      if (selectedShows.length >= 4) return;

      const newSelected = [...selectedShows, show];
      setSelectedShows(newSelected);
      setSearchResults([]);

      // Auto-fetch episodes for comparison
      if (newSelected.length >= 2) {
        await fetchComparisons(newSelected);
      }
    },
    [selectedShows]
  );

  const handleRemove = useCallback(
    async (showId: string) => {
      const newSelected = selectedShows.filter((s) => s.id !== showId);
      setSelectedShows(newSelected);

      if (newSelected.length >= 2) {
        await fetchComparisons(newSelected);
      } else {
        setComparisons([]);
      }
    },
    [selectedShows]
  );

  const fetchComparisons = async (shows: SpotifyShow[]) => {
    setIsComparing(true);
    try {
      const results = await Promise.all(
        shows.map(async (show) => {
          const res = await fetch(
            `/api/shows/${show.id}/episodes?limit=50&market=VN`
          );
          if (!res.ok) throw new Error(`Failed to fetch episodes for ${show.name}`);
          const data = await res.json();
          return {
            show,
            episodes: (data.data || []) as SpotifyEpisode[],
          };
        })
      );
      setComparisons(results);
    } catch (err) {
      console.error("Compare fetch error:", err);
    } finally {
      setIsComparing(false);
    }
  };

  const handleExportCSV = () => {
    if (comparisons.length === 0) return;

    const headers = [
      "Podcast",
      "Publisher",
      "Total Episodes",
      "Avg Duration (min)",
      "Total Content Hours",
      "Languages",
    ];
    const rows = comparisons.map((c) => [
      c.show.name,
      c.show.publisher,
      String(c.show.total_episodes),
      String(Math.round(calculateAverageDuration(c.episodes) / 60000)),
      String(calculateTotalContentHours(c.episodes)),
      c.show.languages?.join("; ") || "",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "podcast-comparison.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Chart data
  const episodeChartData = comparisons.map((c, i) => ({
    name: c.show.name.length > 20 ? c.show.name.slice(0, 20) + "..." : c.show.name,
    episodes: c.show.total_episodes,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const durationChartData = comparisons.map((c, i) => ({
    name: c.show.name.length > 20 ? c.show.name.slice(0, 20) + "..." : c.show.name,
    avgMinutes: Math.round(calculateAverageDuration(c.episodes) / 60000),
    totalHours: calculateTotalContentHours(c.episodes),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitCompareArrows className="h-6 w-6 text-primary" />
            Compare Podcasts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select 2-4 podcasts to compare side by side
          </p>
        </div>
        {comparisons.length >= 2 && (
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Selector */}
      <CompareSelector
        selectedShows={selectedShows}
        searchResults={searchResults}
        isSearching={isSearching}
        onSearch={handleSearch}
        onAdd={handleAdd}
        onRemove={handleRemove}
        maxSelections={4}
        className="mb-8"
      />

      {/* Loading State */}
      {isComparing && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
          <span className="text-muted-foreground">Loading comparison data...</span>
        </div>
      )}

      {/* Empty State */}
      {!isComparing && selectedShows.length < 2 && (
        <Card>
          <CardContent className="py-16 text-center">
            <GitCompareArrows className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Select 2-4 podcasts to compare
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Use the search bar above to find and add podcasts. You can compare
              up to 4 podcasts at a time with detailed metrics and charts.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Comparison Results */}
      {!isComparing && comparisons.length >= 2 && (
        <div className="space-y-8">
          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <CompareTable podcasts={comparisons} />
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Episode Count Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Episode Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={episodeChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="name"
                        className="text-xs"
                        tick={{ fontSize: 11 }}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="episodes"
                        radius={[4, 4, 0, 0]}
                        fill="#22c55e"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Duration Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Content Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={durationChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="name"
                        className="text-xs"
                        tick={{ fontSize: 11 }}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="avgMinutes"
                        name="Avg Duration (min)"
                        fill="#22c55e"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="totalHours"
                        name="Total Hours"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
