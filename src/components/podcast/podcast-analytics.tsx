"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";
import { formatDuration } from "@/lib/utils";

interface PodcastAnalyticsProps {
  episodes: SpotifyEpisode[];
  show: SpotifyShow;
}

const CHART_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(210, 76%, 50%)",
  "hsl(35, 92%, 50%)",
  "hsl(280, 65%, 55%)",
  "hsl(0, 72%, 51%)",
  "hsl(180, 60%, 45%)",
];

export function PodcastAnalytics({ episodes, show }: PodcastAnalyticsProps) {
  // Duration distribution data
  const durationData = useMemo(() => {
    const buckets: Record<string, number> = {
      "0-15m": 0,
      "15-30m": 0,
      "30-45m": 0,
      "45-60m": 0,
      "60-90m": 0,
      "90m+": 0,
    };

    episodes.forEach((ep) => {
      const mins = ep.duration_ms / (1000 * 60);
      if (mins < 15) buckets["0-15m"]++;
      else if (mins < 30) buckets["15-30m"]++;
      else if (mins < 45) buckets["30-45m"]++;
      else if (mins < 60) buckets["45-60m"]++;
      else if (mins < 90) buckets["60-90m"]++;
      else buckets["90m+"]++;
    });

    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));
  }, [episodes]);

  // Release timeline data (episodes per month)
  const timelineData = useMemo(() => {
    const monthMap = new Map<string, number>();

    episodes
      .filter((ep) => ep.release_date)
      .sort(
        (a, b) =>
          new Date(a.release_date).getTime() -
          new Date(b.release_date).getTime()
      )
      .forEach((ep) => {
        const date = new Date(ep.release_date);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      });

    return Array.from(monthMap.entries()).map(([month, count]) => ({
      month,
      count,
    }));
  }, [episodes]);

  // Day of week distribution
  const dayOfWeekData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = new Array(7).fill(0);

    episodes
      .filter((ep) => ep.release_date)
      .forEach((ep) => {
        const date = new Date(ep.release_date);
        counts[date.getDay()]++;
      });

    return days.map((day, i) => ({ day, count: counts[i] }));
  }, [episodes]);

  // Duration trend over time
  const durationTrend = useMemo(() => {
    return episodes
      .filter((ep) => ep.release_date)
      .sort(
        (a, b) =>
          new Date(a.release_date).getTime() -
          new Date(b.release_date).getTime()
      )
      .slice(-20) // Last 20 episodes
      .map((ep, i) => ({
        episode: i + 1,
        name: ep.name.slice(0, 25) + (ep.name.length > 25 ? "..." : ""),
        durationMin: Math.round(ep.duration_ms / (1000 * 60)),
      }));
  }, [episodes]);

  if (episodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">
            No episode data available for analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Duration Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Episode Duration Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="range" className="text-xs" />
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
                  dataKey="count"
                  fill="hsl(142, 76%, 36%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Release Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Release Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  angle={-45}
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
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(142, 76%, 36%)", r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Day of Week Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Publishing Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
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
                    dataKey="count"
                    fill="hsl(210, 76%, 50%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Duration Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Duration Trend (Last 20)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={durationTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="episode" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    label={{
                      value: "min",
                      position: "insideTopLeft",
                      offset: -5,
                      style: { fontSize: "10px" },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value} min`, "Duration"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="durationMin"
                    stroke="hsl(35, 92%, 50%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(35, 92%, 50%)", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
