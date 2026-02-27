import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Home,
  ExternalLink,
  Podcast,
  Globe,
  Calendar,
  Clock,
  Hash,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getShow, getShowEpisodes } from "@/lib/spotify/client";
import {
  formatDuration,
  formatNumber,
  calculateAverageDuration,
  calculateTotalContentHours,
  detectPublishingPattern,
  getActiveStatus,
  truncateText,
} from "@/lib/utils";
import type { SpotifyShow, SpotifyEpisode } from "@/lib/spotify/types";
import { PodcastEpisodeList } from "@/components/podcast/podcast-episode-list";
import { PodcastAnalytics } from "@/components/podcast/podcast-analytics";

interface PodcastPageProps {
  params: Promise<{ id: string }>;
}

export default async function PodcastDetailPage({ params }: PodcastPageProps) {
  const { id } = await params;

  let show: SpotifyShow;
  let episodes: SpotifyEpisode[];

  try {
    const [showData, episodesData] = await Promise.all([
      getShow(id, "VN"),
      getShowEpisodes(id, { limit: 50, market: "VN" }),
    ]);
    show = showData;
    episodes = episodesData.items;
  } catch (error) {
    console.error("Failed to fetch podcast:", error);
    notFound();
  }

  const imageUrl = show.images?.[0]?.url;
  const avgDuration = calculateAverageDuration(episodes);
  const totalHours = calculateTotalContentHours(episodes);
  const publishingPattern = detectPublishingPattern(episodes);
  const latestEpisodeDate = episodes[0]?.release_date || "";
  const activeStatus = getActiveStatus(latestEpisodeDate);

  const statusColors = {
    active: "bg-green-500/10 text-green-600 border-green-200",
    hiatus: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    ended: "bg-red-500/10 text-red-600 border-red-200",
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/search" className="hover:text-foreground transition-colors">
          Search
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {show.name}
        </span>
      </nav>

      {/* Podcast Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={show.name}
              width={200}
              height={200}
              className="rounded-lg shadow-md"
              priority
            />
          ) : (
            <div className="w-[200px] h-[200px] rounded-lg bg-muted flex items-center justify-center">
              <Podcast className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">{show.name}</h1>
          </div>

          <p className="text-muted-foreground mb-3">{show.publisher}</p>

          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge className={statusColors[activeStatus]}>
              {activeStatus === "active"
                ? "Active"
                : activeStatus === "hiatus"
                ? "On Hiatus"
                : "Ended"}
            </Badge>
            {show.languages?.map((lang) => (
              <Badge key={lang} variant="outline">
                <Globe className="h-3 w-3 mr-1" />
                {lang}
              </Badge>
            ))}
            {show.explicit && <Badge variant="destructive">Explicit</Badge>}
          </div>

          <p className="text-sm text-muted-foreground line-clamp-4 mb-4">
            {show.description}
          </p>

          <div className="flex items-center gap-3">
            <a
              href={show.external_urls?.spotify}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Open in Spotify
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Hash className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{formatNumber(show.total_episodes)}</p>
            <p className="text-xs text-muted-foreground">Episodes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{formatDuration(avgDuration)}</p>
            <p className="text-xs text-muted-foreground">Avg Duration</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Calendar className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{publishingPattern}</p>
            <p className="text-xs text-muted-foreground">Schedule</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <Podcast className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalHours}h</p>
            <p className="text-xs text-muted-foreground">Total Content</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="episodes">
        <TabsList className="mb-4">
          <TabsTrigger value="episodes">Episodes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="similar">Similar</TabsTrigger>
        </TabsList>

        <TabsContent value="episodes">
          <PodcastEpisodeList showId={id} initialEpisodes={episodes} />
        </TabsContent>

        <TabsContent value="analytics">
          <PodcastAnalytics episodes={episodes} show={show} />
        </TabsContent>

        <TabsContent value="similar">
          <Card>
            <CardContent className="py-16 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Coming in Phase 3</h3>
              <p className="text-sm text-muted-foreground">
                Similar podcast recommendations will be available in a future
                update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
