import AppLayout from "@/components/layout/AppLayout";
import HomeHeader from "@/components/home/HomeHeader";
import AccommodationTypes from "@/components/home/AccommodationTypes";
import FeaturedAgents from "@/components/home/FeaturedAgents";
import PropertyListCard from "@/components/home/PropertyListCard";
import PropertyCard from "@/components/home/PropertyCard";
import { ChevronDown, ChevronRight, Navigation, Search, SlidersHorizontal, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import { useProperties, useSearchProperties } from "@/hooks/useProperties";
import type { Property, PropertyFilters } from "@/types/property";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const filterCategories = [
  { id: "house", label: "House", image: "/Houses.png", modes: ["buy", "rent"] },
  { id: "apartment", label: "Apartment", image: "/apartments.png", modes: ["buy", "rent"] },
  { id: "plot", label: "Plot", image: "/commercial.png", modes: ["buy"] },
  { id: "room", label: "Room", image: "/rooms.png", modes: ["rent"] },
  { id: "guesthouse", label: "Guest House", image: "/guesthouse.png", modes: ["rent"] },
  { id: "office-space", label: "Office Space", image: "/office.png", modes: ["rent"] },
  { id: "student-accommodation", label: "Student Accommodation", image: "/student.png", modes: ["rent"] },
  { id: "commercial", label: "Commercial", image: "/commercial.png", modes: ["buy", "rent"] },
  { id: "mbashu", label: "Ghetto/Mbashu", image: "/ghetto.png", modes: ["rent"] },
];

const normalizeType = (type: string | null) => {
  if (!type) return "";
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

const toCardProperty = (property: Property) => ({
  id: property.id,
  title: property.title,
  location: property.location,
  price: property.price,
  image: property.images?.[0] || "/placeholder.svg",
  images: property.images,
  ownerName: property.owner_name || property.owner_email,
  ownerAvatarUrl: property.owner_avatar_url,
  ownerRole: property.owner_role,
  bedrooms: property.bedrooms,
  bathrooms: property.bathrooms,
  size: property.size || 0,
  type: property.type,
  rentalType: property.rental_type,
  pricingModel: property.rental_type === "short-term"
    ? {
        daily: property.daily_price ?? undefined,
        weekly: property.weekly_price ?? undefined,
        monthly: property.monthly_price ?? undefined,
      }
    : undefined,
  isNew: property.is_new,
  recommended: property.recommended,
  listingMode: property.listing_mode,
});

const categoryMatchesProperty = (categoryId: string, propertyType: string) => {
  if (categoryId === "plot") return propertyType === "plot";
  if (categoryId === "office-space") return ["office-space", "hotel"].includes(propertyType);
  if (categoryId === "student-accommodation") {
    return ["student-accommodation", "lodge", "camp", "lodges-camps"].includes(propertyType);
  }
  return propertyType === categoryId;
};

const isCategoryAllowedForMode = (categoryId: string, mode: "buy" | "rent") => {
  return filterCategories.some((category) => category.id === categoryId && category.modes.includes(mode));
};

const Index = () => {
  const { t, city, listingMode, setListingMode } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftSearch, setDraftSearch] = useState(searchParams.get("q") || "");
  const query = searchParams.get("q") || "";
  const selectedType = normalizeType(searchParams.get("type"));
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const bedrooms = searchParams.get("bedrooms") ? Number(searchParams.get("bedrooms")) : undefined;
  const bathrooms = searchParams.get("bathrooms") ? Number(searchParams.get("bathrooms")) : undefined;
  const rentalType = searchParams.get("rentalType") as PropertyFilters["rentalType"] | null;
  const verifiedOnly = searchParams.get("verified") === "true";
  const hasAdvancedFilters = Boolean(minPrice || maxPrice || bedrooms || bathrooms || rentalType || verifiedOnly);
  const isResultMode = Boolean(query.trim() || selectedType || hasAdvancedFilters);

  useEffect(() => {
    setDraftSearch(query);
  }, [query]);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "buy" || mode === "rent") {
      setListingMode(mode);
    }
  }, [searchParams, setListingMode]);
  const filters = useMemo<PropertyFilters>(
    () => ({
      listingMode,
      type: selectedType || undefined,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      rentalType: rentalType || undefined,
      verified: verifiedOnly || undefined,
      limit: 48,
    }),
    [listingMode, selectedType, minPrice, maxPrice, bedrooms, bathrooms, rentalType, verifiedOnly],
  );
  const { properties: allModeProperties, loading: allModeLoading } = useProperties({ listingMode, limit: 120 });
  const hasSearchQuery = Boolean(query.trim());
  const { properties: allProperties, loading: allPropertiesLoading } = useProperties(filters, { skip: hasSearchQuery });
  const { properties: searchedProperties, loading: searchedPropertiesLoading } = useSearchProperties(query, filters);
  const recommendedCards = useMemo(
    () =>
      allModeProperties
        .filter((property) => property.recommended)
        .concat(allModeProperties.filter((property) => !property.recommended))
        .slice(0, 8)
        .map(toCardProperty),
    [allModeProperties],
  );
  const resultProperties = hasSearchQuery ? searchedProperties : allProperties;
  const resultsLoading = hasSearchQuery ? searchedPropertiesLoading : allPropertiesLoading;
  const resultCards = useMemo(
    () => resultProperties.map(toCardProperty),
    [resultProperties],
  );
  const categoryCounts = useMemo(
    () =>
      filterCategories.reduce<Record<string, number>>((counts, category) => {
        if (!category.modes.includes(listingMode)) return counts;
        counts[category.id] = allModeProperties.filter((property) =>
          categoryMatchesProperty(category.id, property.type),
        ).length;
        return counts;
      }, {}),
    [allModeProperties, listingMode],
  );

  const updateHomeSearch = (next: {
    q?: string;
    type?: string;
    mode?: "buy" | "rent";
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    rentalType?: string;
    verified?: boolean;
    clearAdvanced?: boolean;
  }) => {
    const params = new URLSearchParams(searchParams);
    if (next.mode) {
      params.set("mode", next.mode);
      setListingMode(next.mode);
      const currentType = normalizeType(params.get("type"));
      if (currentType && !isCategoryAllowedForMode(currentType, next.mode)) {
        params.delete("type");
      }
    } else {
      params.set("mode", listingMode);
    }

    if (next.q !== undefined) {
      const value = next.q.trim();
      if (value) params.set("q", value);
      else params.delete("q");
    }

    if (next.type !== undefined) {
      if (next.type) params.set("type", next.type);
      else params.delete("type");
    }

    if (next.clearAdvanced) {
      ["minPrice", "maxPrice", "bedrooms", "bathrooms", "rentalType", "verified"].forEach((key) =>
        params.delete(key),
      );
    }

    (["minPrice", "maxPrice", "bedrooms", "bathrooms", "rentalType"] as const).forEach((key) => {
      if (next[key] !== undefined) {
        const value = next[key]?.trim();
        if (value) params.set(key, value);
        else params.delete(key);
      }
    });

    if (next.verified !== undefined) {
      if (next.verified) params.set("verified", "true");
      else params.delete("verified");
    }

    setSearchParams(params);
  };

  const clearResults = () => {
    setSearchParams({ mode: listingMode });
  };

  return (
    <AppLayout hideMobileHeader>
      <div className="md:hidden -mx-0">
        <HomeHeader
          searchValue={draftSearch}
          onSearchChange={setDraftSearch}
          onSearchSubmit={(value) => updateHomeSearch({ q: value })}
          onFilterClick={() => setFilterOpen(true)}
        />
      </div>

      <section className="hidden md:block py-8">
        <div className="bg-primary text-primary-foreground rounded-2xl p-6 shadow-card">
          <div className="flex items-end justify-between gap-6 mb-5">
            <div>
              <p className="text-sm text-primary-foreground/80">{t.home.greeting}</p>
              <Link
                to="/choose-city"
                className="inline-flex items-center gap-1 text-xl font-semibold hover:opacity-90 transition-opacity"
              >
                {city}
                <ChevronDown className="w-5 h-5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-1 bg-primary-foreground/10 rounded-xl p-1 min-w-64">
              {(["buy", "rent"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateHomeSearch({ mode })}
                  className={cn(
                    "h-11 rounded-lg text-sm font-semibold transition-colors",
                    listingMode === mode
                      ? "bg-card text-primary shadow-sm"
                      : "text-primary-foreground/90 hover:text-primary-foreground",
                  )}
                >
                  {mode === "buy" ? t.home.buy : t.home.rent}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const q = fd.get("q") as string;
              updateHomeSearch({ q });
            }}
            className="flex gap-3 bg-card rounded-xl p-2 shadow-card"
          >
            <div className="flex-1 flex items-center gap-3 bg-muted/60 rounded-lg px-4 h-12">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                name="q"
                type="search"
                placeholder={t.home.searchPlaceholder}
                value={draftSearch}
                onChange={(event) => setDraftSearch(event.target.value)}
                className="flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button type="button" className="h-12 px-5 rounded-lg">
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full overflow-y-auto sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>{isResultMode ? "Filter results" : "Search filters"}</SheetTitle>
                </SheetHeader>
                <HomeFilterDrawer
                  listingMode={listingMode}
                  showCategories={isResultMode}
                  selectedType={selectedType}
                  counts={allModeLoading ? {} : categoryCounts}
                  values={{
                    minPrice,
                    maxPrice,
                    bedrooms,
                    bathrooms,
                    rentalType: rentalType || "",
                    verified: verifiedOnly,
                  }}
                  onApply={(next) => {
                    updateHomeSearch(next);
                    setFilterOpen(false);
                  }}
                  onClear={() => {
                    updateHomeSearch({ type: "", clearAdvanced: true });
                    setFilterOpen(false);
                  }}
                />
              </SheetContent>
            </Sheet>
          </form>
        </div>
      </section>

      <div className="md:hidden">
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetContent className="w-full overflow-y-auto sm:max-w-md">
            <SheetHeader>
              <SheetTitle>{isResultMode ? "Filter results" : "Search filters"}</SheetTitle>
            </SheetHeader>
            <HomeFilterDrawer
              listingMode={listingMode}
              showCategories={isResultMode}
              selectedType={selectedType}
              counts={allModeLoading ? {} : categoryCounts}
              values={{
                minPrice,
                maxPrice,
                bedrooms,
                bathrooms,
                rentalType: rentalType || "",
                verified: verifiedOnly,
              }}
              onApply={(next) => {
                updateHomeSearch(next);
                setFilterOpen(false);
              }}
              onClear={() => {
                updateHomeSearch({ type: "", clearAdvanced: true });
                setFilterOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>
      </div>

      {isResultMode ? (
        <SearchResults
          query={query}
          selectedType={selectedType}
          resultCards={resultCards}
          loading={resultsLoading}
          onClear={clearResults}
        />
      ) : (
        <>
          <AccommodationTypes />

          <div className="px-4 py-3 md:px-0 md:py-6">
            <Link to="/nearby">
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 md:p-6 border border-primary/20 flex items-center gap-3 hover:shadow-card transition-all">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Navigation className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-sm md:text-lg">
                    {t.home.scanNearby}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {t.home.scanNearbyDesc}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
              </div>
            </Link>
          </div>

          <FeaturedAgents />

          <section className="px-4 py-4 md:px-0 md:py-8">
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-foreground">
                {t.home.recommended}
              </h2>
              <Link
                to="/"
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
              >
                {t.home.viewAll}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {recommendedCards.map((listing) => (
                <PropertyListCard
                  key={listing.id}
                  {...listing}
                  listingMode={listingMode}
                />
              ))}
            </div>
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {recommendedCards.map((listing) => (
                <PropertyCard
                  key={listing.id}
                  {...listing}
                  listingMode={listingMode}
                />
              ))}
            </div>
          </section>
        </>
      )}

      <div className="h-4" />
    </AppLayout>
  );
};

type HomeFilterValues = {
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  rentalType?: string;
  verified?: boolean;
};

const HomeFilterDrawer = ({
  showCategories,
  listingMode,
  selectedType,
  counts,
  values,
  onApply,
  onClear,
}: {
  showCategories: boolean;
  listingMode: "buy" | "rent";
  selectedType: string;
  counts: Record<string, number>;
  values: HomeFilterValues;
  onApply: (next: {
    type?: string;
    minPrice?: string;
    maxPrice?: string;
    bedrooms?: string;
    bathrooms?: string;
    rentalType?: string;
    verified?: boolean;
  }) => void;
  onClear: () => void;
}) => {
  const [type, setType] = useState(selectedType);
  const [minPriceValue, setMinPriceValue] = useState(values.minPrice?.toString() || "");
  const [maxPriceValue, setMaxPriceValue] = useState(values.maxPrice?.toString() || "");
  const [bedroomsValue, setBedroomsValue] = useState(values.bedrooms?.toString() || "");
  const [bathroomsValue, setBathroomsValue] = useState(values.bathrooms?.toString() || "");
  const [rentalTypeValue, setRentalTypeValue] = useState(values.rentalType || "");
  const [verifiedValue, setVerifiedValue] = useState(Boolean(values.verified));

  return (
    <div className="mt-6 space-y-6">
      {showCategories && (
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Category</h3>
        <div className="grid grid-cols-2 gap-3">
          {filterCategories.filter((category) => category.modes.includes(listingMode)).map((category) => {
            const active = type === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setType(active ? "" : category.id)}
                className={cn(
                  "group flex min-h-[8.5rem] flex-col items-center justify-center rounded-xl p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card",
                  active ? "bg-primary/10 ring-2 ring-primary" : "bg-muted/70",
                )}
              >
                <img
                  src={category.image}
                  alt=""
                  className="h-16 w-16 object-contain transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
                <span className="mt-2 text-sm font-semibold text-foreground">{category.label}</span>
                <span className="mt-0.5 text-xs text-muted-foreground">
                  {(counts[category.id] ?? 0).toLocaleString()} properties
                </span>
              </button>
            );
          })}
        </div>
      </div>
      )}

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Price Range</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="home-filter-min">Min</Label>
            <Input
              id="home-filter-min"
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={minPriceValue}
              onChange={(event) => setMinPriceValue(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="home-filter-max">Max</Label>
            <Input
              id="home-filter-max"
              type="number"
              inputMode="numeric"
              placeholder="50000"
              value={maxPriceValue}
              onChange={(event) => setMaxPriceValue(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Room Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="home-filter-beds">Bedrooms</Label>
            <Input
              id="home-filter-beds"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Any"
              value={bedroomsValue}
              onChange={(event) => setBedroomsValue(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="home-filter-baths">Bathrooms</Label>
            <Input
              id="home-filter-baths"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Any"
              value={bathroomsValue}
              onChange={(event) => setBathroomsValue(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Rental Type</h3>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
          {[
            { value: "", label: "Any" },
            { value: "long-term", label: "Monthly" },
            { value: "short-term", label: "Short Stay" },
          ].map((option) => (
            <button
              key={option.value || "any"}
              type="button"
              onClick={() => setRentalTypeValue(option.value)}
              className={cn(
                "h-10 rounded-md text-sm font-semibold transition-colors",
                rentalTypeValue === option.value
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
                option.value === "short-term" && "col-span-2",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between rounded-lg bg-muted/70 p-3">
        <span className="text-sm font-medium text-foreground">Verified properties only</span>
        <Checkbox
          checked={verifiedValue}
          onCheckedChange={(checked) => setVerifiedValue(checked === true)}
        />
      </label>

      <div className="sticky bottom-0 grid grid-cols-2 gap-3 bg-background pt-3">
        <Button variant="outline" onClick={onClear}>
          <X className="mr-2 h-4 w-4" />
          Clear
        </Button>
        <Button
          onClick={() =>
            onApply({
              type,
              minPrice: minPriceValue,
              maxPrice: maxPriceValue,
              bedrooms: bedroomsValue,
              bathrooms: bathroomsValue,
              rentalType: rentalTypeValue,
              verified: verifiedValue,
            })
          }
        >
          Apply
        </Button>
      </div>
    </div>
  );
};

const SearchResults = ({
  query,
  selectedType,
  resultCards,
  loading,
  onClear,
}: {
  query: string;
  selectedType: string;
  resultCards: ReturnType<typeof toCardProperty>[];
  loading: boolean;
  onClear: () => void;
}) => {
  const categoryLabel = filterCategories.find((category) => category.id === selectedType)?.label;

  return (
    <section className="px-4 py-4 md:px-0 md:py-2">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Search Results</h2>
          <p className="text-sm text-muted-foreground">
            {resultCards.length} {resultCards.length === 1 ? "property" : "properties"}
            {query.trim() ? ` for "${query.trim()}"` : ""}
            {categoryLabel ? ` in ${categoryLabel}` : ""}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClear}>
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl bg-card p-8 text-center shadow-card">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <h3 className="font-semibold text-foreground">Loading properties...</h3>
          <p className="mt-1 text-sm text-muted-foreground">Checking the latest listings for this search.</p>
        </div>
      ) : resultCards.length === 0 ? (
        <div className="rounded-xl bg-card p-8 text-center shadow-card">
          <Search className="mx-auto h-10 w-10 text-muted-foreground" />
          <h3 className="mt-3 font-semibold text-foreground">No properties found</h3>
          <p className="mt-1 text-sm text-muted-foreground">Try another search or category.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {resultCards.map((listing) => (
              <PropertyListCard key={listing.id} {...listing} />
            ))}
          </div>
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {resultCards.map((listing) => (
              <PropertyCard key={listing.id} {...listing} />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default Index;
