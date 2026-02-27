"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export interface SearchFilterValues {
  language: string;
  vnMarket: boolean;
  hideExplicit: boolean;
  episodeCountRange: [number, number];
}

interface SearchFiltersProps {
  /** Current filter values */
  filters: SearchFilterValues;
  /** Called when any filter value changes */
  onFiltersChange: (filters: SearchFilterValues) => void;
  /** Additional CSS class names */
  className?: string;
}

export const defaultFilters: SearchFilterValues = {
  language: "vi",
  vnMarket: true,
  hideExplicit: false,
  episodeCountRange: [0, 500],
};

export function SearchFilters({
  filters,
  onFiltersChange,
  className,
}: SearchFiltersProps) {
  const [expanded, setExpanded] = React.useState(false);

  const updateFilter = <K extends keyof SearchFilterValues>(
    key: K,
    value: SearchFilterValues[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Toggle Button (visible on mobile, always available) */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 md:hidden"
      >
        <Filter className="h-4 w-4" />
        Filters
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {/* Filter Controls */}
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
          !expanded && "hidden md:grid"
        )}
      >
        {/* Language Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Language</label>
          <Select
            value={filters.language}
            onValueChange={(value) => updateFilter("language", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vi">Vietnamese</SelectItem>
              <SelectItem value="all">All Languages</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* VN Market Toggle */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">VN Market</label>
          <div className="flex items-center space-x-2 pt-1">
            <Switch
              checked={filters.vnMarket}
              onCheckedChange={(checked) => updateFilter("vnMarket", checked)}
              id="vn-market"
            />
            <label htmlFor="vn-market" className="text-sm text-muted-foreground">
              {filters.vnMarket ? "VN only" : "All markets"}
            </label>
          </div>
        </div>

        {/* Explicit Content Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Explicit Content
          </label>
          <div className="flex items-center space-x-2 pt-1">
            <Switch
              checked={filters.hideExplicit}
              onCheckedChange={(checked) =>
                updateFilter("hideExplicit", checked)
              }
              id="hide-explicit"
            />
            <label
              htmlFor="hide-explicit"
              className="text-sm text-muted-foreground"
            >
              {filters.hideExplicit ? "Hidden" : "Shown"}
            </label>
          </div>
        </div>

        {/* Episode Count Range */}
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">
            Episode Count ({filters.episodeCountRange[0]} -{" "}
            {filters.episodeCountRange[1]})
          </label>
          <Slider
            min={0}
            max={500}
            step={10}
            value={filters.episodeCountRange}
            onValueChange={(value) =>
              updateFilter("episodeCountRange", value as [number, number])
            }
            className="pt-2"
          />
        </div>
      </div>
    </div>
  );
}
