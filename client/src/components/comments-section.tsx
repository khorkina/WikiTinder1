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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Comments</h2>
      
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (content.trim()) {
            commentMutation.mutate(content);
          }
        }}
        className="space-y-4"
      >
        <Textarea
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px]"
        />
        <Button 
          type="submit" 
          className="gap-2"
          disabled={!content.trim() || commentMutation.isPending}
        >
          {commentMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Post Comment
        </Button>
      </form>

      <div className="space-y-4">
        {comments?.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments?.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span className="font-medium">{user?.id === comment.userId ? "You" : `User #${comment.userId}`}</span>
                <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
