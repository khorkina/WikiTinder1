import { Article } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import CommentsSection from "./comments-section";

interface ArticleDetailsDialogProps {
  article: Article | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ArticleDetailsDialog({
  article,
  open,
  onOpenChange,
}: ArticleDetailsDialogProps) {
  if (!article) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{article.title}</DialogTitle>
            <Badge variant="secondary" className="uppercase">
              {article.language}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <p className="text-muted-foreground">{article.excerpt}</p>

          <hr className="my-6" />

          <CommentsSection article={article} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
