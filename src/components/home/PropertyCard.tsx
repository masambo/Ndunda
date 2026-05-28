import { Heart, MapPin, Bed, Bath, Square } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface PropertyCardProps {
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
  type: "room" | "house" | "plot" | "apartment" | "guesthouse" | "hotel" | "lodge" | "camp" | "lodges-camps" | "office-space" | "student-accommodation" | "commercial" | "airbnb" | "mbashu";
  isNew?: boolean;
  listingMode?: "buy" | "rent";
  rentalType?: "long-term" | "short-term";
  pricingModel?: {
    daily?: number;
    weekly?: number;
    monthly?: number;
  };
  initialFavorite?: boolean;
}

const getPreviewImages = (image: string, images?: string[]) => {
  const ordered = [image, ...(images ?? [])].filter(Boolean);
  return Array.from(new Set(ordered)).slice(0, 3);
};

const getTypeLabel = (type: PropertyCardProps["type"]) => {
  const labels: Record<PropertyCardProps["type"], string> = {
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
    airbnb: "Vacation Stay",
    mbashu: "Mbashu",
  };
  return labels[type];
};

const PropertyCard = ({
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
  isNew,
  listingMode = "rent",
  rentalType = "long-term",
  pricingModel,
  initialFavorite = false,
}: PropertyCardProps) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const toggleSaved = useMutation(api.properties.toggleSaved);
  const images = getPreviewImages(image, listingImages);
  const typeLabel = getTypeLabel(type);
  const ownerLabel = ownerName || "Ndunda user";
  const ownerInitial = ownerLabel.charAt(0).toUpperCase();

  const handleCardClick = () => {
    navigate(`/property/${id}`);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
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
  };

  return (
    <div 
      onClick={handleCardClick}
      className="group bg-card rounded-xl overflow-hidden shadow-card transition-all duration-500 hover:-translate-y-1 hover:shadow-lifted hover:[transform:perspective(900px)_rotateX(1.5deg)_translateY(-6px)] animate-fade-in cursor-pointer"
    >
      <div className="relative">
        <img
          src={image}
          alt={title}
          className="w-full h-32 md:h-40 object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {images.length > 1 && (
        <div className="absolute bottom-2 left-2 right-2 grid grid-cols-3 gap-1.5">
          {images.map((preview) => (
            <img
              key={preview}
              src={preview}
              alt=""
              className="h-9 w-full rounded-md border border-white/80 object-cover shadow-sm"
              loading="lazy"
            />
          ))}
        </div>
        )}
        <button
          onClick={handleFavoriteClick}
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10",
            isFavorite
              ? "bg-destructive text-primary-foreground"
              : "bg-card/80 backdrop-blur-sm text-foreground hover:bg-card"
          )}
        >
          <Heart
            className={cn("w-3.5 h-3.5", isFavorite && "fill-current")}
          />
        </button>
        {isNew && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
            New
          </span>
        )}
        <span className="absolute left-2 top-9 rounded-full bg-card/90 px-2 py-0.5 text-[11px] font-semibold text-primary backdrop-blur">
          {typeLabel}
        </span>
      </div>

      <div className="p-3 md:p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-sm md:text-base font-semibold text-foreground line-clamp-1">{title}</h3>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground text-xs md:text-sm mb-2">
          <MapPin className="w-3 h-3" />
          <span className="line-clamp-1">{location}</span>
        </div>

        <div className="mb-3 flex items-center gap-2">
          {ownerAvatarUrl ? (
            <img src={ownerAvatarUrl} alt={ownerLabel} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
              {ownerInitial}
            </div>
          )}
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
            {ownerLabel}
          </span>
          {ownerRole && ownerRole !== "customer" && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {ownerRole === "admin" ? "Ndunda Admin" : "Agent"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Bed className="w-3 h-3" />
            <span>{bedrooms} Bed</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="w-3 h-3" />
            <span>{bathrooms} Bath</span>
          </div>
          <div className="flex items-center gap-1">
            <Square className="w-3 h-3" />
            <span>{size}m²</span>
          </div>
        </div>

        <div>
          {listingMode === "buy" ? (
            <>
              <span className="text-lg md:text-xl font-bold text-primary">
                N${price.toLocaleString()}
              </span>
            </>
          ) : rentalType === "short-term" && pricingModel?.daily ? (
            <>
              <span className="text-lg md:text-xl font-bold text-primary">
                N${pricingModel.daily.toLocaleString()}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">/night</span>
            </>
          ) : (
            <>
              <span className="text-lg md:text-xl font-bold text-primary">
                N${price.toLocaleString()}
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">/month</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
