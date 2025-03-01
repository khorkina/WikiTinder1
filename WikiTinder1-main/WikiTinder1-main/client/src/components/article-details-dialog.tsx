import { Article } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <DialogTitle className="text-2xl">{article.title}</DialogTitle>
            <Badge variant="secondary" className="uppercase">
              {article.language}
            </Badge>
          </div>
          <DialogDescription>
            View full article content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          <div className="prose prose-sm max-w-none">
            <p>{article.excerpt}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}