import AppLayout from "@/components/layout/AppLayout";
import { ArrowLeft, Home, MapPin, Eye, Edit, Trash2, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PropertyCard from "@/components/home/PropertyCard";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

const MyListings = () => {
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const convexListings = useQuery(api.properties.mine);
  const removeProperty = useMutation(api.properties.remove);
  const syncedListings = useMemo(
    () =>
      (convexListings ?? []).map((property) => ({
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
        status: property.status,
        views: property.views ?? 0,
        rentalType: property.rentalType,
        listingMode: property.listingMode,
        isSynced: true,
      })),
    [convexListings],
  );
  const myListings = syncedListings
    .filter((listing) => !deletedIds.includes(listing.id));

  const handleDelete = async (id: string) => {
    await removeProperty({ id: id as Id<"properties"> });
    setDeletedIds((prev) => [...prev, id]);
  };

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-6 md:px-0 md:pt-8 md:pb-8">
        <Link to="/profile" className="inline-flex items-center gap-2 text-muted-foreground mb-4 md:mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm md:text-base">Back</span>
        </Link>

        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Home className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">My Listings</h1>
              <p className="text-sm md:text-base text-muted-foreground">{myListings.length} properties</p>
            </div>
          </div>
          <Button variant="default" size="icon" className="md:h-12 md:w-12" asChild>
            <Link to="/add-listing">
              <Plus className="w-5 h-5 md:w-6 md:h-6" />
            </Link>
          </Button>
        </div>

        {myListings.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <Home className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2 md:text-lg">No listings yet</h3>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
              List your first property for free
            </p>
            <Button variant="default" size="lg" asChild>
              <Link to="/add-listing">Add Listing</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {myListings.map((listing) => (
              <div key={listing.id} className="relative">
                <PropertyCard
                  id={listing.id}
                  title={listing.title}
                  location={listing.location}
                  price={listing.price}
                  image={listing.image}
                  images={listing.images}
                  ownerName={listing.ownerName}
                  ownerAvatarUrl={listing.ownerAvatarUrl}
                  ownerRole={listing.ownerRole}
                  bedrooms={listing.bedrooms}
                  bathrooms={listing.bathrooms}
                  size={listing.size}
                  type={listing.type}
                  rentalType={listing.rentalType}
                  listingMode={listing.listingMode}
                />
                {/* Status Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <span className={cn(
                    "text-xs font-semibold px-2 py-1 rounded-full",
                    listing.status === "active" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-warning text-foreground"
                  )}>
                    {listing.status === "active" ? "Active" : "Pending"}
                  </span>
                </div>
                {/* Action Buttons Overlay */}
                <div className="absolute bottom-3 right-3 z-10 flex gap-2">
                  <button className="p-2 bg-background/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-background transition-colors">
                    <Edit className="w-4 h-4 text-primary" />
                  </button>
                  <button
                    onClick={() => void handleDelete(listing.id)}
                    className="p-2 bg-background/90 backdrop-blur-sm rounded-lg shadow-md hover:bg-background transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
                {/* Views Info */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  <span>{listing.views}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MyListings;
