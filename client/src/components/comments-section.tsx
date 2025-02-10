import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Article, Comment } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CommentsSectionProps {
  article: Article;
}

export default function CommentsSection({ article }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: [`/api/articles/${article.id}/comments`],
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/articles/${article.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${article.id}/comments`] });
      setContent("");
    },
    onError: (error) => {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (content.trim()) {
            commentMutation.mutate(content);
          }
        }}
        className="space-y-3"
      >
        <Textarea
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="sm"
            className="gap-2"
            disabled={!content.trim() || commentMutation.isPending}
          >
            {commentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Post
          </Button>
        </div>
      </form>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments?.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No comments yet. Start the discussion!
          </p>
        ) : (
          <div className="divide-y">
            {comments?.map((comment) => (
              <div key={comment.id} className="py-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">
                    {user?.id === comment.userId ? "You" : `User #${comment.userId}`}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}