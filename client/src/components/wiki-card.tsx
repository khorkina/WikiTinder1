import { useState } from "react";
import { Article } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import ArticleDetailsDialog from "./article-details-dialog";
import CommentsSection from "./comments-section";

interface WikiCardProps {
  article: Article;
  style?: React.CSSProperties;
  onLike?: () => void;
  onDislike?: () => void;
}

export default function WikiCard({
  article,
  style,
}: WikiCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);

  return (
    <>
      <Card 
        className="w-full max-w-md mx-auto overflow-hidden shadow-lg"
        style={style}
      >
        <div 
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setDialogOpen(true)}
        >
          <div className="aspect-video relative">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="uppercase">
                {article.language}
              </Badge>
            </div>
          </div>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold text-xl line-clamp-2">{article.title}</h3>
            <p className="text-muted-foreground line-clamp-3">{article.excerpt}</p>
          </CardContent>
        </div>

        <div className="border-t px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 w-full"
            onClick={(e) => {
              e.stopPropagation();
              setShowComments(!showComments);
            }}
          >
            <MessageCircle className="h-4 w-4" />
            {showComments ? "Hide Comments" : "Show Comments"}
          </Button>
        </div>

        {showComments && (
          <div className="border-t">
            <CardContent className="p-6">
              <CommentsSection article={article} />
            </CardContent>
          </div>
        )}
      </Card>

      <ArticleDetailsDialog 
        article={article}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}