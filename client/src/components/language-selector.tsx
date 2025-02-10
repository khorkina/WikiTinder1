import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "zh", name: "Chinese" },
];

export function LanguageSelector() {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateLanguages = async (languages: string[]) => {
    setIsUpdating(true);
    try {
      await apiRequest("PATCH", "/api/user/languages", { languages });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          Languages
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="space-y-2">
          {AVAILABLE_LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start gap-2",
                user?.languages?.includes(lang.code) &&
                  "bg-primary/10 hover:bg-primary/20"
              )}
              onClick={() => {
                const newLanguages = user?.languages?.includes(lang.code)
                  ? user.languages.filter((l) => l !== lang.code)
                  : [...(user?.languages || []), lang.code];
                updateLanguages(newLanguages);
              }}
              disabled={isUpdating}
            >
              {user?.languages?.includes(lang.code) && (
                <Check className="h-4 w-4" />
              )}
              {!user?.languages?.includes(lang.code) && (
                <div className="w-4" />
              )}
              {lang.name}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
