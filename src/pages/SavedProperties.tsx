import AppLayout from "@/components/layout/AppLayout";
import PropertyListCard from "@/components/home/PropertyListCard";
import PropertyCard from "@/components/home/PropertyCard";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

type Tab = "all" | "buy" | "rent";

const SavedProperties = () => {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("all");
  const savedProperties = useQuery(api.properties.saved);
  const loading = savedProperties === undefined;

  const cards = useMemo(
    () =>
      (savedProperties ?? []).map((property) => ({
        id: property._id,
        title: property.title,
        location: property.location,
        price: property.price,
        image: property.images[0] || "/placeholder.svg",
        images: property.images,
        ownerName: property.owner?.fullName || property.owner?.email || null,
        ownerAvatarUrl: property.owner?.avatarUrl || null,
        ownerRole: property.owner?.role || null,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        size: property.size || 0,
        type: property.type,
        rentalType: property.rentalType,
        listingMode: property.listingMode,
        initialFavorite: true,
      })),
    [savedProperties],
  );

  const filtered = tab === "all" ? cards : cards.filter((property) => property.listingMode === tab);

  return (
    <AppLayout>
      <div className="md:hidden bg-secondary/50 px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold text-foreground text-center">{t.favorites.title}</h1>
      </div>

      <div className="px-4 pt-4 pb-6 md:px-0 md:pt-8 md:pb-8 md:max-w-7xl md:mx-auto w-full">
        <div className="hidden md:flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary fill-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.favorites.title}</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} {t.favorites.saved}
            </p>
          </div>
        </div>

        <div className="flex border-b border-border mb-6">
          {(["all", "buy", "rent"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "flex-1 py-3 text-sm font-semibold border-b-2 transition-colors",
                tab === key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground",
              )}
            >
              {key === "all" ? t.favorites.all : key === "buy" ? t.favorites.buy : t.favorites.rent}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid min-h-48 place-items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">{t.favorites.emptyTitle}</h3>
            <p className="text-sm text-muted-foreground mb-6">{t.favorites.emptyDesc}</p>
            <Button asChild>
              <Link to="/search">{t.favorites.browse}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:hidden">
              {filtered.map((property) => (
                <PropertyListCard key={property.id} {...property} />
              ))}
            </div>
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((property) => (
                <PropertyCard key={property.id} {...property} />
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default SavedProperties;
