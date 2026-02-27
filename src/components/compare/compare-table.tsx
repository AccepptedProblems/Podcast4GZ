"use client";

import * as React from "react";

import {
  cn,
  formatNumber,
  formatDuration,
  calculateAverageDuration,
  calculateTotalContentHours,
  detectPublishingPattern,
} from "@/lib/utils";
import type { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";
import { Badge } from "@/components/ui/badge";

interface PodcastComparison {
  /** The podcast show data */
  show: SpotifyShow;
  /** Episodes for computing analytics */
  episodes: SpotifyEpisode[];
}

interface CompareTableProps {
  /** Array of podcast comparisons (2-4 items) */
  podcasts: PodcastComparison[];
  /** Additional CSS class names */
  className?: string;
}

interface RowDef {
  label: string;
  getValue: (podcast: PodcastComparison) => string | React.ReactNode;
  /** If true, highlight the highest numeric value */
  highlightMax?: boolean;
  /** Function to extract numeric value for comparison */
  getNumericValue?: (podcast: PodcastComparison) => number;
}

export function CompareTable({ podcasts, className }: CompareTableProps) {
  if (podcasts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Select podcasts above to compare them.
      </p>
    );
  }

  const rows: RowDef[] = [
    {
      label: "Total Episodes",
      getValue: (p) => formatNumber(p.show.total_episodes),
      highlightMax: true,
      getNumericValue: (p) => p.show.total_episodes,
    },
    {
      label: "Avg Duration",
      getValue: (p) => {
        const avg = calculateAverageDuration(p.episodes);
        return avg > 0 ? formatDuration(avg) : "N/A";
      },
      highlightMax: true,
      getNumericValue: (p) => calculateAverageDuration(p.episodes),
    },
    {
      label: "Release Frequency",
      getValue: (p) => detectPublishingPattern(p.episodes),
    },
    {
      label: "Content Hours",
      getValue: (p) => {
        const hours = calculateTotalContentHours(p.episodes);
        return `${hours}h`;
      },
      highlightMax: true,
      getNumericValue: (p) => calculateTotalContentHours(p.episodes),
    },
    {
      label: "Languages",
      getValue: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.show.languages?.map((lang) => (
            <Badge key={lang} variant="outline" className="text-xs">
              {lang}
            </Badge>
          )) ?? "N/A"}
        </div>
      ),
    },
    {
      label: "Publisher",
      getValue: (p) => p.show.publisher,
    },
    {
      label: "Status",
      getValue: (p) => {
        const sorted = [...p.episodes].sort(
          (a, b) =>
            new Date(b.release_date).getTime() -
            new Date(a.release_date).getTime()
        );
        const lastDate = sorted[0]?.release_date;
        if (!lastDate) return "Unknown";
        const daysSince =
          (Date.now() - new Date(lastDate).getTime()) /
          (1000 * 60 * 60 * 24);
        if (daysSince <= 30)
          return <Badge variant="default">Active</Badge>;
        if (daysSince <= 90)
          return <Badge variant="secondary">Hiatus</Badge>;
        return <Badge variant="outline">Ended</Badge>;
      },
    },
  ];

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium text-muted-foreground sticky left-0 bg-background min-w-[140px]">
              Metric
            </th>
            {podcasts.map((podcast) => (
              <th
                key={podcast.show.id}
                className="text-left p-3 font-medium min-w-[180px]"
              >
                <div className="truncate max-w-[200px]">
                  {podcast.show.name}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            // Determine best value for highlighting
            let bestValue: number | null = null;
            if (row.highlightMax && row.getNumericValue) {
              bestValue = Math.max(
                ...podcasts.map((p) => row.getNumericValue!(p))
              );
            }

            return (
              <tr key={row.label} className="border-b last:border-0">
                <td className="p-3 font-medium text-muted-foreground sticky left-0 bg-background">
                  {row.label}
                </td>
                {podcasts.map((podcast) => {
                  const numericValue = row.getNumericValue?.(podcast);
                  const isBest =
                    row.highlightMax &&
                    bestValue !== null &&
                    numericValue === bestValue &&
                    podcasts.length > 1;

                  return (
                    <td
                      key={podcast.show.id}
                      className={cn(
                        "p-3",
                        isBest && "font-bold text-primary"
                      )}
                    >
                      {row.getValue(podcast)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
