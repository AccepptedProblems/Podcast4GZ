import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Home,
  ExternalLink,
  Clock,
  Calendar,
  Podcast,
  ArrowLeft,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getEpisode } from "@/lib/spotify/client";
import { formatDuration, formatDate } from "@/lib/utils";
import type { SpotifyEpisode } from "@/lib/spotify/types";
import { AudioPreview } from "@/components/episode/audio-preview";

interface EpisodePageProps {
  params: Promise<{ id: string }>;
}

export default async function EpisodeDetailPage({ params }: EpisodePageProps) {
  const { id } = await params;

  let episode: SpotifyEpisode;

  try {
    episode = await getEpisode(id, "VN");
  } catch (error) {
    console.error("Failed to fetch episode:", error);
    notFound();
  }

  const imageUrl = episode.images?.[0]?.url;
  const showName = episode.show?.name || "Unknown Podcast";
  const showId = episode.show?.id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
        </Link>
        <ChevronRight className="h-3 w-3" />
        {showId ? (
          <Link
            href={`/podcast/${showId}`}
            className="hover:text-foreground transition-colors truncate max-w-[150px]"
          >
            {showName}
          </Link>
        ) : (
          <span className="truncate max-w-[150px]">{showName}</span>
        )}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {episode.name}
        </span>
      </nav>

      {/* Episode Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={episode.name}
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
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            {episode.name}
          </h1>

          {showId && (
            <Link
              href={`/podcast/${showId}`}
              className="text-primary hover:underline font-medium mb-3 block"
            >
              {showName}
            </Link>
          )}

          <div className="flex items-center gap-3 flex-wrap mb-4">
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(episode.release_date)}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(episode.duration_ms)}
            </Badge>
            {episode.languages?.map((lang) => (
              <Badge key={lang} variant="outline" className="gap-1">
                <Globe className="h-3 w-3" />
                {lang}
              </Badge>
            ))}
            {episode.explicit && (
              <Badge variant="destructive">Explicit</Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <a
              href={episode.external_urls?.spotify}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Listen on Spotify
              </Button>
            </a>
            {showId && (
              <Link href={`/podcast/${showId}`}>
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Podcast
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Audio Preview */}
      <div className="mb-8">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground shrink-0">
                Audio Preview
              </span>
              <AudioPreview
                audioUrl={episode.audio_preview_url}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold mb-4">Episode Description</h2>
          <Separator className="mb-4" />
          {episode.html_description ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: episode.html_description }}
            />
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {episode.description || "No description available."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
