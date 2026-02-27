import Link from "next/link";
import {
  Cpu,
  Briefcase,
  Laugh,
  GraduationCap,
  Heart,
  Newspaper,
  Landmark,
  Music,
  Users,
  Search,
  BarChart3,
  Code2,
  Podcast,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HomeSearchBar } from "@/components/home/home-search-bar";

const categories = [
  { name: "Technology", icon: Cpu, color: "text-blue-500" },
  { name: "Business", icon: Briefcase, color: "text-emerald-500" },
  { name: "Comedy", icon: Laugh, color: "text-yellow-500" },
  { name: "Education", icon: GraduationCap, color: "text-purple-500" },
  { name: "Health", icon: Heart, color: "text-red-500" },
  { name: "News", icon: Newspaper, color: "text-orange-500" },
  { name: "Culture", icon: Landmark, color: "text-pink-500" },
  { name: "Music", icon: Music, color: "text-cyan-500" },
  { name: "Society", icon: Users, color: "text-indigo-500" },
];

const stats = [
  {
    label: "Vietnamese Market Focus",
    icon: Podcast,
    description: "Specialized for VN podcasts",
  },
  {
    label: "Real-Time Spotify Data",
    icon: BarChart3,
    description: "Live data via Spotify Web API",
  },
  {
    label: "100% Open Source",
    icon: Code2,
    description: "Free and community-driven",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto text-center py-12 md:py-20">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Podcast className="h-10 w-10 md:h-12 md:w-12 text-primary" />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Podcast<span className="text-primary">W4GZ</span>
          </h1>
        </div>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Discover & Analyze Vietnamese Podcasts
        </p>
        <p className="text-sm text-muted-foreground mb-10 max-w-xl mx-auto">
          Search, compare, and explore the Vietnamese podcast ecosystem.
          Powered by the Spotify Web API.
        </p>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-6">
          <HomeSearchBar />
        </div>
      </section>

      {/* Category Quick Access */}
      <section className="w-full max-w-4xl mx-auto mb-16">
        <h2 className="text-xl font-semibold text-center mb-6">
          Browse by Category
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.name}
                href={`/search?q=${encodeURIComponent(category.name)}&market=VN&language=vi`}
              >
                <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="flex flex-col items-center gap-2 p-4">
                    <Icon
                      className={`h-6 w-6 ${category.color} group-hover:scale-110 transition-transform`}
                    />
                    <span className="text-xs font-medium text-center">
                      {category.name}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full max-w-4xl mx-auto mb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="text-center">
                <CardContent className="pt-6 pb-6">
                  <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">{stat.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="w-full max-w-4xl mx-auto text-center mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/search">
            <Button size="lg" className="gap-2">
              <Search className="h-4 w-4" />
              Start Searching
            </Button>
          </Link>
          <Link href="/directory">
            <Button variant="outline" size="lg">
              Browse Directory
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
