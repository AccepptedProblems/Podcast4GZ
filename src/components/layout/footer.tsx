import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            PodcastW4GZ - Vietnamese Podcast Research Tool
          </p>
        </div>
        <Separator orientation="vertical" className="hidden md:block h-4" />
        <p className="text-center text-sm text-muted-foreground md:text-left">
          Powered by Spotify Web API
        </p>
        <div className="flex flex-1 items-center justify-end">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            GitHub
          </a>
        </div>
        <p className="text-xs text-muted-foreground">&copy; 2024</p>
      </div>
    </footer>
  );
}
