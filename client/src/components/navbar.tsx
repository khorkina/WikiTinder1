import { Link } from "wouter";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Heart, LogOut } from "lucide-react";
import { LanguageSelector } from "./language-selector";

export default function Navbar() {
  const { user, logoutMutation, isLoading } = useAuth();

  if (isLoading) {
    return (
      <nav className="border-b px-4 h-14 flex items-center">
        <Loader2 className="h-5 w-5 animate-spin" />
      </nav>
    );
  }

  if (!user) return null;

  return (
    <nav className="border-b px-4 h-14 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/">
          <a className="font-bold text-lg">WikiTinder</a>
        </Link>
        <LanguageSelector />
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          asChild
        >
          <Link href="/favorites">
            <Heart className="h-4 w-4" />
            Favorites
          </Link>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </nav>
  );
}
