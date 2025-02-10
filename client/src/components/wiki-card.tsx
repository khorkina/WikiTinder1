import { Article } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  return (
    <Card 
      className="w-full max-w-md mx-auto overflow-hidden shadow-lg"
      style={style}
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
    </Card>
  );
}
