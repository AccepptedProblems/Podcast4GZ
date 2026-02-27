"use client";

import * as React from "react";
import { Play, Pause } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AudioPreviewProps {
  /** URL of the 30-second audio preview */
  audioUrl: string | null;
  /** Show a compact play button only (no progress bar) */
  compact?: boolean;
  /** Additional CSS class names */
  className?: string;
}

export function AudioPreview({
  audioUrl,
  compact = false,
  className,
}: AudioPreviewProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    audio.currentTime = clickPosition * audio.duration;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!audioUrl) {
    if (compact) {
      return (
        <Button variant="ghost" size="icon" disabled className="h-8 w-8">
          <Play className="h-4 w-4 opacity-30" />
        </Button>
      );
    }

    return (
      <div className={cn("text-xs text-muted-foreground italic", className)}>
        No preview available
      </div>
    );
  }

  if (compact) {
    return (
      <>
        <audio ref={audioRef} src={audioUrl} preload="none" />
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlayPause}
          className="h-8 w-8"
          aria-label={isPlaying ? "Pause preview" : "Play preview"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <audio ref={audioRef} src={audioUrl} preload="none" />

      {/* Play/Pause Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={togglePlayPause}
        aria-label={isPlaying ? "Pause preview" : "Play preview"}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {/* Progress Bar */}
      <div
        className="relative flex-1 h-2 bg-secondary rounded-full cursor-pointer"
        onClick={handleProgressClick}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Duration Display */}
      <span className="text-xs text-muted-foreground tabular-nums min-w-[40px]">
        {duration > 0 ? formatTime(duration) : "0:30"}
      </span>
    </div>
  );
}
