import AppLayout from "@/components/layout/AppLayout";
import { Search as SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import PropertyCard from "@/components/home/PropertyCard";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useSearchProperties, useProperties } from "@/hooks/useProperties";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Property, PropertyFilters } from "@/types/property";

const DEFAULT_MAX_PRICE = 10000000;

const normalizeType = (type: string | null) => {
  if (!type) return null;
  const normalized = type.trim().toLowerCase();
  const aliases: Record<string, string> = {
    houses: "house",
    flat: "apartment",
    flats: "apartment",
    arpartment: "apartment",
    aprtment: "apartment",
    artment: "apartment",
    partment: "apartment",
    apartments: "apartment",
    plots: "plot",
    land: "plot",
    erf: "plot",
    rooms: "room",
    guesthouses: "guesthouse",
    "guest-houses": "guesthouse",
    ghetto: "mbashu",
    "ghetto-mbashu": "mbashu",
    offices: "office-space",
    office: "office-space",
    "student-room": "student-accommodation",
    "student-rooms": "student-accommodation",
    hotels: "office-space",
    hotel: "office-space",
    lodges: "student-accommodation",
    camps: "student-accommodation",
    "lodges-camps": "student-accommodation",
  };
  return aliases[normalized] ?? normalized;
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, listingMode, setListingMode } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, DEFAULT_MAX_PRICE]);
  const [bedroomsFilter, setBedroomsFilter] = useState<number | null>(null);
  const [bathroomsFilter, setBathroomsFilter] = useState<number | null>(null);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string | null>(null);
  const [rentalTypeFilter, setRentalTypeFilter] = useState<PropertyFilters["rentalType"] | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  
  // Get filters from URL params
  useEffect(() => {
    const typeParam = normalizeType(searchParams.get("type"));
    const minPrice = Number(searchParams.get("minPrice") || 0);
    const maxPrice = Number(searchParams.get("maxPrice") || DEFAULT_MAX_PRICE);
    const bedrooms = searchParams.get("bedrooms");
    const bathrooms = searchParams.get("bathrooms");
    const rentalType = searchParams.get("rentalType");
    const verified = searchParams.get("verified") === "true";

    setPropertyTypeFilter(typeParam);
    setPriceRange([minPrice, maxPrice]);
    setBedroomsFilter(bedrooms ? Number(bedrooms) : null);
    setBathroomsFilter(bathrooms ? Number(bathrooms) : null);
    setRentalTypeFilter(rentalType === "long-term" || rentalType === "short-term" ? rentalType : null);
    setVerifiedOnly(verified);

    const nextActiveFilters: string[] = [];
    if (minPrice > 0 || maxPrice < DEFAULT_MAX_PRICE) nextActiveFilters.push("price");
    if (bedrooms) nextActiveFilters.push("beds");
    if (bathrooms) nextActiveFilters.push("baths");
    if (typeParam) nextActiveFilters.push("type");
    if (rentalType) nextActiveFilters.push("rentalType");
    if (verified) nextActiveFilters.push("verified");
    setActiveFilters(nextActiveFilters);
  }, [searchParams]);

  useEffect(() => {
    const query = searchParams.get("q");
    setSearchQuery(query || "");

    const modeParam = searchParams.get("mode");
    if (modeParam === "buy" || modeParam === "rent") {
      setListingMode(modeParam);
    }
  }, [searchParams, setListingMode]);

  const handleApplyFilters = () => {
    const newFilters: string[] = [];
    if (priceRange[0] > 0 || priceRange[1] < DEFAULT_MAX_PRICE) newFilters.push("price");
    if (bedroomsFilter !== null) newFilters.push("beds");
    if (bathroomsFilter !== null) newFilters.push("baths");
    if (propertyTypeFilter) newFilters.push("type");
    if (rentalTypeFilter) newFilters.push("rentalType");
    if (verifiedOnly) newFilters.push("verified");

    const nextParams: Record<string, string> = { mode: listingMode };
    if (searchQuery.trim()) nextParams.q = searchQuery.trim();
    if (propertyTypeFilter) nextParams.type = propertyTypeFilter;
    if (priceRange[0] > 0) nextParams.minPrice = String(priceRange[0]);
    if (priceRange[1] < DEFAULT_MAX_PRICE) nextParams.maxPrice = String(priceRange[1]);
    if (bedroomsFilter !== null) nextParams.bedrooms = String(bedroomsFilter);
    if (bathroomsFilter !== null) nextParams.bathrooms = String(bathroomsFilter);
    if (rentalTypeFilter) nextParams.rentalType = rentalTypeFilter;
    if (verifiedOnly) nextParams.verified = "true";

    setActiveFilters(newFilters);
    setSearchParams(nextParams);
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setPriceRange([0, DEFAULT_MAX_PRICE]);
    setBedroomsFilter(null);
    setBathroomsFilter(null);
    setPropertyTypeFilter(null);
    setRentalTypeFilter(null);
    setVerifiedOnly(false);
    setActiveFilters([]);
    const nextParams: Record<string, string> = { mode: listingMode };
    if (searchQuery.trim()) nextParams.q = searchQuery.trim();
    setSearchParams(nextParams);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (priceRange[0] > 0 || priceRange[1] < DEFAULT_MAX_PRICE) count++;
    if (bedroomsFilter !== null) count++;
    if (bathroomsFilter !== null) count++;
    if (propertyTypeFilter) count++;
    if (rentalTypeFilter) count++;
    if (verifiedOnly) count++;
    return count;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams: Record<string, string> = { mode: listingMode };
    if (searchQuery.trim()) nextParams.q = searchQuery.trim();
    setSearchParams(nextParams);
  };

  const propertyTypeOptions = useMemo(() => {
    const base = [
      { value: "house", label: "House", modes: ["buy", "rent"] },
      { value: "apartment", label: "Apartment", modes: ["buy", "rent"] },
      { value: "plot", label: "Plot", modes: ["buy"] },
      { value: "room", label: "Room", modes: ["rent"] },
      { value: "mbashu", label: "Ghetto/Mbashu", modes: ["rent"] },
      { value: "guesthouse", label: "Guest House", modes: ["rent"] },
      { value: "office-space", label: "Office Space", modes: ["rent"] },
      { value: "student-accommodation", label: "Student Accommodation", modes: ["rent"] },
      { value: "commercial", label: "Commercial", modes: ["buy", "rent"] },
      { value: "airbnb", label: "Vacation Rental", modes: ["rent"] },
    ];
    return base.filter((option) => option.modes.includes(listingMode));
  }, [listingMode]);

  // Build filters object for property search
  const filters = useMemo(() => {
    const filterObj: PropertyFilters = {
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < DEFAULT_MAX_PRICE ? priceRange[1] : undefined,
      bedrooms: bedroomsFilter !== null ? bedroomsFilter : undefined,
      bathrooms: bathroomsFilter !== null ? bathroomsFilter : undefined,
      type: propertyTypeFilter || undefined,
      rentalType: rentalTypeFilter || undefined,
      verified: verifiedOnly || undefined,
      listingMode,
      limit: 72,
    };
    // Remove undefined values
    Object.keys(filterObj).forEach(key => filterObj[key] === undefined && delete filterObj[key]);
    return filterObj;
  }, [priceRange, bedroomsFilter, bathroomsFilter, propertyTypeFilter, rentalTypeFilter, verifiedOnly, listingMode]);

  // Property search from Convex.
  const { properties: searchResults, loading: searchLoading } = useSearchProperties(
    searchQuery,
    filters
  );
  const hasSearchQuery = Boolean(searchQuery.trim());
  const { properties: allProperties, loading: allLoading } = useProperties(filters, { skip: hasSearchQuery });

  // Use search results if query exists, otherwise use all properties
  const properties = hasSearchQuery ? searchResults : allProperties;
  const loading = hasSearchQuery ? searchLoading : allLoading;

  // Transform properties for PropertyCard component
  const transformedProperties = useMemo(() => {
    return properties.map((property: Property) => ({
      id: property.id,
      title: property.title,
      location: property.location,
      price: property.price,
      image: property.images?.[0] || '/placeholder.svg',
      images: property.images,
      ownerName: property.owner_name || property.owner_email,
      ownerAvatarUrl: property.owner_avatar_url,
      ownerRole: property.owner_role,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      size: property.size || 0,
      type: property.type,
      rentalType: property.rental_type,
      pricingModel: property.rental_type === 'short-term' ? {
        daily: property.daily_price,
        weekly: property.weekly_price,
        monthly: property.monthly_price,
      } : undefined,
      isNew: property.is_new,
      listingMode: property.listing_mode,
    }));
  }, [properties]);

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-2 md:px-0 md:pt-8 md:pb-4">
        <form onSubmit={handleSearch} className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="flex-1 flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 shadow-card max-w-2xl md:max-w-none">
            <SearchIcon className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Location, property name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm md:text-base outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Button type="submit" variant="secondary" size="iconLg" className="md:h-12 md:w-12">
            <SearchIcon className="w-5 h-5" />
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-1 bg-muted rounded-lg p-1 mb-4 md:max-w-sm">
          {(["buy", "rent"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                setListingMode(mode);
                const nextParams: Record<string, string> = { mode };
                if (searchQuery.trim()) nextParams.q = searchQuery.trim();
                const nextTypes = propertyTypeOptions
                  .filter((option) => option.modes.includes(mode))
                  .map((option) => option.value);
                if (propertyTypeFilter && nextTypes.includes(propertyTypeFilter)) {
                  nextParams.type = propertyTypeFilter;
                } else {
                  setPropertyTypeFilter(null);
                }
                setSearchParams(nextParams);
              }}
              className={cn(
                "h-10 rounded-md text-sm font-semibold transition-colors",
                listingMode === mode
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {mode === "buy" ? t.home.buy : t.home.rent}
            </button>
          ))}
        </div>

        {/* Filter Button */}
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "gap-2",
                activeFilters.length > 0 && "bg-primary text-primary-foreground border-primary"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilters.length > 0 && (
                <span className="ml-1 bg-primary-foreground/20 text-primary-foreground px-2 py-0.5 rounded-full text-xs font-semibold">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Properties</SheetTitle>
              <SheetDescription>
                Refine your search to find exactly what you're looking for
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Price Range */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Price Range (N$)</Label>
                <div className="space-y-4">
                  <Slider
                    value={[priceRange[0], priceRange[1]]}
                    onValueChange={(values) => setPriceRange([values[0], values[1]])}
                    min={0}
                    max={DEFAULT_MAX_PRICE}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1">Min Price</Label>
                      <Input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        min={0}
                        max={priceRange[1]}
                        className="w-full"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1">Max Price</Label>
                      <Input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 50000])}
                        min={priceRange[0]}
                        max={DEFAULT_MAX_PRICE}
                        className="w-full"
                      />
                    </div>
                  </div>
        </div>
      </div>

              {/* Bedrooms */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Bedrooms</Label>
                <Select
                  value={bedroomsFilter?.toString() || "any"}
                  onValueChange={(value) => setBedroomsFilter(value === "any" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1 Bedroom</SelectItem>
                    <SelectItem value="2">2 Bedrooms</SelectItem>
                    <SelectItem value="3">3 Bedrooms</SelectItem>
                    <SelectItem value="4">4 Bedrooms</SelectItem>
                    <SelectItem value="5">5+ Bedrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bathrooms */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Bathrooms</Label>
                <Select
                  value={bathroomsFilter?.toString() || "any"}
                  onValueChange={(value) => setBathroomsFilter(value === "any" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1 Bathroom</SelectItem>
                    <SelectItem value="2">2 Bathrooms</SelectItem>
                    <SelectItem value="3">3 Bathrooms</SelectItem>
                    <SelectItem value="4">4+ Bathrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Property Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Property Type</Label>
                <Select
                  value={propertyTypeFilter || "any"}
                  onValueChange={(value) => setPropertyTypeFilter(value === "any" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    {propertyTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rental Type */}
        <div className="space-y-3">
                <Label className="text-base font-semibold">Rental Type</Label>
                <Select
                  value={rentalTypeFilter || "any"}
                  onValueChange={(value) =>
                    setRentalTypeFilter(value === "any" ? null : value as PropertyFilters["rentalType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="long-term">Long-term (Monthly)</SelectItem>
                    <SelectItem value="short-term">Short-term (Daily/Weekly)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Verified Only */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="verified"
                  checked={verifiedOnly}
                  onCheckedChange={(checked) => setVerifiedOnly(checked === true)}
                />
                <Label
                  htmlFor="verified"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Verified properties only
                </Label>
              </div>

              {/* Active Filters Summary */}
              {getActiveFilterCount() > 0 && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Active Filters</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="h-8 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {priceRange[0] > 0 || priceRange[1] < DEFAULT_MAX_PRICE ? (
                      <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                        Price: N${priceRange[0].toLocaleString()} - N${priceRange[1].toLocaleString()}
                        <button
                          onClick={() => setPriceRange([0, 50000])}
                          className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null}
                    {bedroomsFilter !== null && (
                      <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                        {bedroomsFilter} Bedroom{bedroomsFilter !== 1 ? "s" : ""}
                        <button
                          onClick={() => setBedroomsFilter(null)}
                          className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {bathroomsFilter !== null && (
                      <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                        {bathroomsFilter} Bathroom{bathroomsFilter !== 1 ? "s" : ""}
                        <button
                          onClick={() => setBathroomsFilter(null)}
                          className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {propertyTypeFilter && (
                      <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                        {propertyTypeFilter.charAt(0).toUpperCase() + propertyTypeFilter.slice(1)}
                        <button
                          onClick={() => setPropertyTypeFilter(null)}
                          className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {rentalTypeFilter && (
                      <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                        {rentalTypeFilter === "long-term" ? "Long-term" : "Short-term"}
                        <button
                          onClick={() => setRentalTypeFilter(null)}
                          className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {verifiedOnly && (
                      <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                        Verified Only
                        <button
                          onClick={() => setVerifiedOnly(false)}
                          className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background pb-4">
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="flex-1"
                  disabled={getActiveFilterCount() === 0}
                >
                  Clear All
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="flex-1"
                >
                  Apply Filters
                </Button>
              </div>
                </div>
          </SheetContent>
        </Sheet>
                </div>

      <div className="px-4 py-4 md:px-0 md:py-6">
        {loading ? (
          <div className="text-center py-12 md:py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm md:text-base text-muted-foreground">Loading properties...</p>
                </div>
        ) : (
          <>
            <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
              {transformedProperties.length} {transformedProperties.length === 1 ? "property" : "properties"} found
              {searchQuery && ` for "${searchQuery}"`}
            </p>

            {transformedProperties.length === 0 ? (
              <div className="text-center py-12 md:py-16">
                <SearchIcon className="w-16 h-16 md:w-20 md:h-20 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">No properties found</h3>
                <p className="text-base md:text-lg text-muted-foreground">
                  Try clearing mode, category, price, bedroom, bathroom, rental type, or verified filters.
                </p>
                <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {transformedProperties.map((listing) => (
                  <PropertyCard
                    key={listing.id}
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
                    pricingModel={listing.pricingModel}
                    isNew={listing.isNew}
                    listingMode={listing.listingMode}
                  />
          ))}
        </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Search;
