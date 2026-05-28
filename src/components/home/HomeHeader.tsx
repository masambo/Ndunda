import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface HomeHeaderProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (query: string) => void;
  onFilterClick?: () => void;
}

const HomeHeader = ({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onFilterClick,
}: HomeHeaderProps) => {
  const { t, city, listingMode, setListingMode } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="bg-primary text-primary-foreground rounded-b-3xl pb-4 shadow-soft">
      <div className="px-4 pt-4 pb-2 flex items-center">
        <img
          src="/Ndunda_logo.png"
          alt="Ndunda"
          className="h-9 w-auto brightness-0 invert"
        />
      </div>

      <div className="px-4">
        <div>
          <p className="text-sm text-primary-foreground/80">{t.home.greeting}</p>
          <Link
            to="/choose-city"
            className="flex items-center gap-1 text-lg font-bold hover:opacity-90"
          >
            {city}
            <ChevronDown className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="flex rounded-t-2xl overflow-hidden bg-primary-foreground/10 p-1 gap-1">
          {(["buy", "rent"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setListingMode(mode)}
              className={cn(
                "flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all",
                listingMode === mode
                  ? "bg-card text-primary shadow-sm"
                  : "text-primary-foreground/90 hover:text-primary-foreground",
              )}
            >
              {mode === "buy" ? t.home.buy : t.home.rent}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const q = fd.get("q") as string;
            if (onSearchSubmit) {
              onSearchSubmit(q);
              return;
            }
            navigate(`/?q=${encodeURIComponent(q)}&mode=${listingMode}`);
          }}
          className="flex gap-2 bg-card rounded-b-2xl rounded-t-none p-2 shadow-card"
        >
          <div className="flex-1 flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              name="q"
              type="search"
              placeholder={t.home.searchPlaceholder}
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button
            type="button"
            size="icon"
            className="h-11 w-11 rounded-xl shrink-0"
            onClick={() => onFilterClick?.()}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default HomeHeader;
