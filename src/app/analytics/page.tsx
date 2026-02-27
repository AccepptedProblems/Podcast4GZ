"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Podcast,
  Users,
  Clock,
  Hash,
  Loader2,
  Database,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCards, type StatItem } from "@/components/analytics/stats-cards";

const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// Placeholder landscape data - in production this would come from /api/analytics/landscape
const placeholderLanguageData = [
  { name: "Vietnamese", value: 45 },
  { name: "English", value: 30 },
  { name: "Bilingual", value: 15 },
  { name: "Other", value: 10 },
];

const placeholderPublisherData = [
  { name: "Independent", count: 42 },
  { name: "Vietcetera", count: 18 },
  { name: "VnExpress", count: 12 },
  { name: "Spotify Studios", count: 9 },
  { name: "Have a Sip", count: 7 },
  { name: "The Present Writer", count: 6 },
  { name: "Giang Oi Radio", count: 5 },
  { name: "Other", count: 15 },
];

const placeholderEpisodeDistribution = [
  { range: "1-10", count: 35 },
  { range: "11-50", count: 45 },
  { range: "51-100", count: 25 },
  { range: "101-200", count: 15 },
  { range: "201-500", count: 8 },
  { range: "500+", count: 3 },
];

export default function AnalyticsPage() {
  const [hasData, setHasData] = useState(true);

  const stats: StatItem[] = [
    {
      icon: Podcast,
      label: "Indexed Podcasts",
      value: "131",
      change: "Vietnamese ecosystem",
      changeType: "neutral",
    },
    {
      icon: Hash,
      label: "Total Episodes",
      value: "8,240",
      change: "Across all shows",
      changeType: "neutral",
    },
    {
      icon: Users,
      label: "Unique Publishers",
      value: "87",
      change: "Content creators",
      changeType: "neutral",
    },
    {
      icon: Clock,
      label: "Content Hours",
      value: "6,120",
      change: "Total audio content",
      changeType: "neutral",
    },
  ];

  if (!hasData) {
    return (
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Vietnamese Podcast Landscape
        </h1>
        <Card className="mt-8">
          <CardContent className="py-16 text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Data Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Start by searching and indexing podcasts to build the directory.
              Analytics will be generated from indexed podcast data.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Vietnamese Podcast Landscape
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of the Vietnamese podcast ecosystem on Spotify
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} className="mb-8" />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Language Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Language Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={placeholderLanguageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {placeholderLanguageData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Publishers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Publishers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={placeholderPublisherData}
                  layout="vertical"
                  margin={{ left: 80 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    className="text-xs"
                    width={80}
                    tick={{ fontSize: 11 }}
                  />
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
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Episode Count Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Episode Count Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={placeholderEpisodeDistribution}>
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
                  formatter={(value: number) => [`${value} podcasts`, "Count"]}
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      <p className="text-xs text-muted-foreground text-center">
        Data based on indexed podcasts in the directory. Figures are
        representative and will update as more podcasts are indexed.
      </p>
    </div>
  );
}
