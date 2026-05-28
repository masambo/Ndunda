import { Heart, MapPin, Bed, Bath } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@clerk/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

export interface PropertyListCardProps {
  id: string;
  title: string;
  location: string;
  price: number;
  image: string;
  images?: string[];
  ownerName?: string | null;
  ownerAvatarUrl?: string | null;
  ownerRole?: "customer" | "agent" | "admin" | null;
  bedrooms: number;
  bathrooms: number;
  size: number;
  type: string;
  rentalType?: "long-term" | "short-term";
  listingMode?: "buy" | "rent";
  landlord?: string;
  pricingModel?: { daily?: number };
  isNew?: boolean;
  initialFavorite?: boolean;
}

const getPreviewImages = (image: string, images?: string[]) => {
  const ordered = [image, ...(images ?? [])].filter(Boolean);
  return Array.from(new Set(ordered)).slice(0, 3);
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    room: "Room",
    house: "House",
    plot: "Plot",
    apartment: "Apartment",
    guesthouse: "Guest House",
    hotel: "Office Space",
    lodge: "Student Accommodation",
    camp: "Student Accommodation",
    "lodges-camps": "Student Accommodation",
    "office-space": "Office Space",
    "student-accommodation": "Student Room",
    commercial: "Commercial",
    mbashu: "Mbashu",
    airbnb: "Vacation Stay",
  };
  return labels[type] ?? type.replace(/-/g, " ");
};

const PropertyListCard = ({
  id,
  title,
  location,
  price,
  image,
  images: listingImages,
  ownerName,
  ownerAvatarUrl,
  ownerRole,
  bedrooms,
  bathrooms,
  size,
  type,
  rentalType = "long-term",
  listingMode = "rent",
  pricingModel,
  isNew,
  initialFavorite = false,
}: PropertyListCardProps) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const toggleSaved = useMutation(api.properties.toggleSaved);
  const { t } = useLanguage();
  const images = getPreviewImages(image, listingImages);
  const typeLabel = getTypeLabel(type);
  const ownerLabel = ownerName || "Ndunda user";
  const ownerInitial = ownerLabel.charAt(0).toUpperCase();

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/property/${id}`)}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/property/${id}`)}
      className="group bg-card rounded-2xl p-3 shadow-card flex gap-3 cursor-pointer border border-border/40 transition-all duration-500 animate-slide-up hover:-translate-y-1 hover:shadow-lifted hover:[transform:perspective(900px)_rotateX(1.5deg)_translateY(-4px)]"
    >
      <div className="relative shrink-0">
        <img
          src={image}
          alt={title}
          className="w-28 h-32 md:w-32 rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {images.length > 1 && (
        <div className="absolute bottom-1.5 left-1.5 right-1.5 grid grid-cols-3 gap-1">
          {images.map((preview) => (
            <img
              key={preview}
              src={preview}
              alt=""
              className="h-8 w-full rounded-md border border-white/80 object-cover shadow-sm"
              loading="lazy"
            />
          ))}
        </div>
        )}
        {isNew && (
          <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
            {t.common.new}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        <div className="flex items-start justify-between gap-2">
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary capitalize">
            {typeLabel}
          </span>
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              if (!isSignedIn) {
                navigate("/login");
                return;
              }

              try {
                const saved = await toggleSaved({ propertyId: id as Id<"properties"> });
                setIsFavorite(saved);
                toast.success(saved ? "Saved property" : "Removed from saved properties");
              } catch (error) {
                const message = error instanceof Error ? error.message : "Could not update saved property";
                toast.error(message);
              }
            }}
            className="shrink-0 p-1"
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                isFavorite ? "fill-primary text-primary" : "text-primary",
              )}
            />
          </button>
        </div>

        <p className="text-lg font-bold text-primary leading-tight">
          {rentalType === "short-term" && pricingModel?.daily
            ? `N$${pricingModel.daily.toLocaleString()}`
            : `N$${price.toLocaleString()}`}
          <span className="text-xs font-normal text-muted-foreground">
            {rentalType === "short-term" ? t.property.perNight : t.property.perMonth}
          </span>
        </p>

        <h3 className="text-sm font-semibold text-foreground line-clamp-1 mt-0.5">
          {title}
        </h3>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          {ownerAvatarUrl ? (
            <img src={ownerAvatarUrl} alt={ownerLabel} className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
              {ownerInitial}
            </div>
          )}
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">
            {ownerLabel}
          </span>
          {ownerRole && ownerRole !== "customer" && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
              {ownerRole === "admin" ? "Admin" : "Agent"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
          <span className="flex items-center gap-0.5">
            <Bed className="w-3 h-3" />
            {bedrooms} {t.property.beds}
          </span>
          <span className="flex items-center gap-0.5">
            <Bath className="w-3 h-3" />
            {bathrooms} {t.property.baths}
          </span>
        </div>
        <p className="mt-auto pt-2 text-[11px] font-medium text-muted-foreground">
          {size} {t.property.sqft} · {listingMode === "buy" ? "For sale" : "Available to rent"}
        </p>
      </div>
    </div>
  );
};

export default PropertyListCard;
