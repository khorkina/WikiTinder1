import { useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import WikiCard from "./wiki-card";
import { Article } from "@shared/schema";
import { X, Heart } from "lucide-react";

const SWIPE_THRESHOLD = 100;

interface CardStackProps {
  articles: Article[];
  onSwipeLeft: (article: Article) => void;
  onSwipeRight: (article: Article) => void;
}

export default function CardStack({
  articles,
  onSwipeLeft,
  onSwipeRight,
}: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [props, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotation: 0,
  }));

  const bind = useDrag(
    ({ down, movement: [mx], direction: [xDir], velocity }) => {
      const trigger = Math.abs(mx) > SWIPE_THRESHOLD;
      const dir = xDir < 0 ? -1 : 1;

      if (!down && trigger) {
        // Swipe completed
        api.start({
          x: dir * window.innerWidth * 1.5,
          rotation: dir * 45,
          immediate: false,
          onRest: () => {
            // Reset for next card
            api.start({ x: 0, y: 0, rotation: 0, immediate: true });
            if (dir === -1) {
              onSwipeLeft(articles[currentIndex]);
            } else {
              onSwipeRight(articles[currentIndex]);
            }
            setCurrentIndex((i) => i + 1);
          },
        });
      } else {
        // Dragging
        api.start({
          x: down ? mx : 0,
          rotation: down ? mx / 20 : 0,
          immediate: down,
        });
      }
    }
  );

  if (currentIndex >= articles.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        No more articles to show
      </div>
    );
  }

  return (
    <div className="relative h-[60vh] flex items-center justify-center">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <X className="h-8 w-8 text-destructive" />
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Heart className="h-8 w-8 text-primary" />
      </div>

      <animated.div
        {...bind()}
        style={{
          x: props.x,
          y: props.y,
          rotate: props.rotation,
          touchAction: "none",
        }}
      >
        <WikiCard article={articles[currentIndex]} />
      </animated.div>
    </div>
  );
}