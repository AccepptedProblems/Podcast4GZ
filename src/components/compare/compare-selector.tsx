"use client";

import * as React from "react";
import { X, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SpotifyShow } from "@/lib/spotify/types";
import { SearchBar } from "@/components/search/search-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface CompareSelectorProps {
  /** Currently selected podcasts */
  selectedShows: SpotifyShow[];
  /** Search results to display in the dropdown */
  searchResults?: SpotifyShow[];
  /** Whether the search is loading */
  isSearching?: boolean;
  /** Called when the search query changes */
  onSearch: (query: string) => void;
  /** Called when a podcast is added to the comparison */
  onAdd: (show: SpotifyShow) => void;
  /** Called when a podcast is removed from the comparison */
  onRemove: (showId: string) => void;
  /** Maximum number of podcasts to compare */
  maxSelections?: number;
  /** Additional CSS class names */
  className?: string;
}

export function CompareSelector({
  selectedShows,
  searchResults = [],
  isSearching = false,
  onSearch,
  onAdd,
  onRemove,
  maxSelections = 4,
  className,
}: CompareSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const isMaxReached = selectedShows.length >= maxSelections;
  const selectedIds = new Set(selectedShows.map((s) => s.id));

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (query: string) => {
    onSearch(query);
    setIsDropdownOpen(query.length > 0);
  };

  const handleAdd = (show: SpotifyShow) => {
    if (!isMaxReached && !selectedIds.has(show.id)) {
      onAdd(show);
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search */}
      <div className="relative" ref={dropdownRef}>
        <SearchBar
          onChange={handleSearchChange}
          placeholder={
            isMaxReached
              ? `Maximum ${maxSelections} podcasts selected`
              : "Search podcasts to compare..."
          }
        />

        {/* Dropdown Results */}
        {isDropdownOpen && (
          <Card className="absolute z-50 mt-1 w-full max-h-60 overflow-auto">
            <CardContent className="p-2">
              {isSearching ? (
                <p className="text-sm text-muted-foreground p-2">
                  Searching...
                </p>
              ) : searchResults.length > 0 ? (
                <ul className="space-y-1">
                  {searchResults.map((show) => {
                    const alreadySelected = selectedIds.has(show.id);
                    return (
                      <li key={show.id}>
                        <button
                          type="button"
                          onClick={() => handleAdd(show)}
                          disabled={alreadySelected || isMaxReached}
                          className={cn(
                            "w-full flex items-center justify-between gap-2 rounded-sm px-3 py-2 text-sm text-left transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            (alreadySelected || isMaxReached) &&
                              "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">{show.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {show.publisher} - {show.total_episodes} episodes
                            </p>
                          </div>
                          {!alreadySelected && !isMaxReached && (
                            <Plus className="h-4 w-4 shrink-0" />
                          )}
                          {alreadySelected && (
                            <span className="text-xs text-muted-foreground">
                              Added
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground p-2">
                  No podcasts found.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected Shows as Chips */}
      {selectedShows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedShows.map((show) => (
            <Badge
              key={show.id}
              variant="secondary"
              className="flex items-center gap-1 pl-3 pr-1 py-1.5 text-sm"
            >
              <span className="truncate max-w-[200px]">{show.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1 hover:bg-destructive/20"
                onClick={() => onRemove(show.id)}
                aria-label={`Remove ${show.name}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground self-center">
            {selectedShows.length}/{maxSelections} selected
          </span>
        </div>
      )}
    </div>
  );
}
