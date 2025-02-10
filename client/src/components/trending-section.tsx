import { useQuery } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import WikiCard from "./wiki-card";
import { Loader2 } from "lucide-react";

export default function TrendingSection() {
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/trending"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!articles?.length) {
    return (
      <p className="text-muted-foreground text-center">
        No trending articles yet
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Trending Articles</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <WikiCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
