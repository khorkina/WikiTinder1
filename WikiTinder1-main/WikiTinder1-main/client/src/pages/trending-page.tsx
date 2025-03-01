import { useQuery } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import WikiCard from "@/components/wiki-card";
import { Loader2 } from "lucide-react";

export default function TrendingPage() {
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/trending"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!articles?.length) {
    return (
      <div className="container max-w-md mx-auto py-12 text-center">
        <p className="text-muted-foreground">
          No trending articles yet. Start liking articles to see them here!
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Trending Articles</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <WikiCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
