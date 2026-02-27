import * as React from "react";
import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface StatItem {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Label displayed below the value */
  label: string;
  /** Main stat value */
  value: string | number;
  /** Optional change indicator (e.g., "+12%", "-3") */
  change?: string;
  /** Whether the change is positive, negative, or neutral */
  changeType?: "positive" | "negative" | "neutral";
}

interface StatsCardsProps {
  /** Array of stat items to display */
  stats: StatItem[];
  /** Additional CSS class names */
  className?: string;
}

export function StatsCards({ stats, className }: StatsCardsProps) {
  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-full bg-primary/10 p-3">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {stat.change && (
                  <p
                    className={cn(
                      "text-xs font-medium",
                      stat.changeType === "positive" && "text-green-600",
                      stat.changeType === "negative" && "text-red-600",
                      stat.changeType === "neutral" && "text-muted-foreground"
                    )}
                  >
                    {stat.change}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
