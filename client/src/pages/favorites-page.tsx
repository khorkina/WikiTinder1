import { useQuery, useMutation } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import WikiCard from "@/components/wiki-card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FavoritesPage() {
  const { toast } = useToast();

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles/liked"],
  });

  const unlikeMutation = useMutation({
    mutationFn: async (articleId: number) => {
      await apiRequest("DELETE", `/api/articles/${articleId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles/liked"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles/trending"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
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
          You haven't liked any articles yet. Start swiping to discover new content!
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-8">Favorite Articles</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <div key={article.id} className="relative group">
            <WikiCard article={article} />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => unlikeMutation.mutate(article.id)}
              disabled={unlikeMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
