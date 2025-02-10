import { useQuery, useMutation } from "@tanstack/react-query";
import { Article } from "@shared/schema";
import CardStack from "@/components/card-stack";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    enabled: user?.languages?.length > 0,
  });

  const likeMutation = useMutation({
    mutationFn: async (articleId: number) => {
      await apiRequest("POST", `/api/articles/${articleId}/like`);
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

  if (user?.languages?.length === 0) {
    return (
      <div className="container max-w-md mx-auto py-12 text-center space-y-4">
        <h1 className="text-2xl font-bold">Welcome to WikiTinder!</h1>
        <p className="text-muted-foreground">
          Please select at least one language from the language selector in the navbar
          to start discovering articles.
        </p>
      </div>
    );
  }

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
        <p className="text-muted-foreground">No articles found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <CardStack
        articles={articles}
        onSwipeLeft={() => {}} // Ignore disliked articles
        onSwipeRight={(article) => likeMutation.mutate(article.id)}
      />
    </div>
  );
}
