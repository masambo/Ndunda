import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { namibiaCities, STORAGE_KEYS } from "@/i18n";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, Crosshair, Search, X } from "lucide-react";
import { toast } from "sonner";

const cityImages: Record<string, string> = {
  Windhoek: "/windhoek.jpg",
  "Walvis Bay": "/Walvisbay.jpg",
  Swakopmund: "/swakopmund.jpg",
  Oshakati: "/oshakati.jfif",
  Rundu: "/Rundu.jpg",
  "Katima Mulilo": "/Katima.jpg",
  Otjiwarongo: "/Rundu.jpg",
  Keetmanshoop: "/Katima.jpg",
  Gobabis: "/windhoek.jpg",
  "Lüderitz": "/Walvisbay.jpg",
  Tsumeb: "/oshakati.jfif",
  Okahandja: "/windhoek.jpg",
  Ondangwa: "/oshakati.jfif",
  Eenhana: "/oshakati.jfif",
  Outjo: "/swakopmund.jpg",
  Mariental: "/Katima.jpg",
  Nkurenkuru: "/Rundu.jpg",
};

const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  Windhoek: { lat: -22.5609, lng: 17.0658 },
  "Walvis Bay": { lat: -22.9576, lng: 14.5053 },
  Swakopmund: { lat: -22.6784, lng: 14.5266 },
  Oshakati: { lat: -17.782, lng: 15.699 },
  Rundu: { lat: -17.9333, lng: 19.7667 },
  "Katima Mulilo": { lat: -17.5, lng: 24.2667 },
  Otjiwarongo: { lat: -20.4637, lng: 16.6477 },
  Keetmanshoop: { lat: -26.5833, lng: 18.1333 },
  Gobabis: { lat: -22.45, lng: 18.9667 },
  "Lüderitz": { lat: -26.6481, lng: 15.1594 },
  Tsumeb: { lat: -19.25, lng: 17.7167 },
  Okahandja: { lat: -21.9833, lng: 16.9167 },
  Ondangwa: { lat: -17.9167, lng: 15.95 },
  Eenhana: { lat: -17.4667, lng: 16.3333 },
  Outjo: { lat: -20.1167, lng: 16.15 },
  Mariental: { lat: -24.6333, lng: 17.9667 },
  Nkurenkuru: { lat: -17.6167, lng: 18.6 },
};

const citySuburbs: Record<string, string[]> = {
  Windhoek: [
    "Windhoek North",
    "Windhoek West",
    "Eros",
    "Klein Windhoek",
    "Kleine Kuppe",
    "Khomasdal",
    "Katutura",
    "Pioneerspark",
    "Olympia",
    "Ludwigsdorf",
    "Cimbebasia",
    "Academia",
  ],
  "Walvis Bay": [
    "Meersig",
    "Narraville",
    "Kuisebmond",
    "Fairways",
    "Central Walvis Bay",
  ],
  Swakopmund: [
    "Vineta",
    "Kramersdorf",
    "Ocean View",
    "Mile 4",
    "Mondesa",
    "Tamariskia",
  ],
  Oshakati: [
    "Oshakati West",
    "Oshakati East",
    "Evululuko",
    "Oneshila",
  ],
  Rundu: [
    "Sauyemwa",
    "Tutungeni",
    "Ndama",
    "Queens Park",
  ],
  "Katima Mulilo": [
    "Cowboy",
    "Choto",
    "Ngweze",
    "Boma",
  ],
};

const resolveCityForLocation = (location: string) => {
  if (namibiaCities.all.includes(location as (typeof namibiaCities.all)[number])) {
    return location;
  }

  const matchedCity = Object.entries(citySuburbs).find(([, areas]) =>
    areas.includes(location),
  );

  return matchedCity?.[0] ?? "Windhoek";
};

const distanceKm = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) => {
  const radius = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const ChooseCity = () => {
  const navigate = useNavigate();
  const { t, city, setCity } = useLanguage();
  const initialCity = resolveCityForLocation(city);
  const [selected, setSelected] = useState(initialCity);
  const [selectedArea, setSelectedArea] = useState(city === initialCity ? "" : city);
  const [addressQuery, setAddressQuery] = useState("");
  const [locating, setLocating] = useState(false);

  const suburbs = citySuburbs[selected] ?? [];

  const finish = () => {
    const location = addressQuery.trim() || selectedArea || selected;
    setCity(location);
    localStorage.setItem(STORAGE_KEYS.setupComplete, "true");
    navigate("/");
  };

  const selectCity = (name: string) => {
    setSelected(name);
    setSelectedArea("");
  };

  const selectArea = (name: string) => {
    setSelectedArea(name);
    setAddressQuery("");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported by this browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const nearest = namibiaCities.all.reduce((closest, name) => {
          const coordinates = cityCoordinates[name];
          if (!coordinates) return closest;
          const distance = distanceKm(userPoint, coordinates);
          return distance < closest.distance ? { name, distance } : closest;
        }, { name: "Windhoek", distance: Number.POSITIVE_INFINITY });

        selectCity(nearest.name);
        toast.success(`Using ${nearest.name} as your nearest city`);
        setLocating(false);
      },
      () => {
        toast.error("Could not access your location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const CityCard = ({ name, compact = false }: { name: string; compact?: boolean }) => (
    <button
      type="button"
      onClick={() => selectCity(name)}
      className={cn(
        "overflow-hidden bg-card shadow-sm transition-all text-left hover:-translate-y-0.5 hover:shadow-card",
        compact ? "rounded-md" : "rounded-lg",
        selected === name ? "ring-2 ring-primary" : "ring-1 ring-border/60",
      )}
    >
      <div className="aspect-square bg-muted relative overflow-hidden text-transparent">
        <img
          src={cityImages[name] ?? "/windhoek.jpg"}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
        {selected === name && (
          <span
            className={cn(
              "absolute rounded-full bg-primary flex items-center justify-center shadow-md",
              compact ? "top-1 right-1 w-4 h-4" : "top-1.5 right-1.5 w-5 h-5",
            )}
          >
            <Check className={cn("text-primary-foreground", compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
          </span>
        )}
      </div>
      <p
        className={cn(
          "font-semibold text-center text-foreground leading-tight truncate",
          compact ? "text-[9px] md:text-[10px] px-0.5 py-1" : "text-[11px] px-1 py-1.5",
        )}
      >
        {name}
      </p>
    </button>
  );

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 md:py-3 bg-secondary">
        <h1 className="flex-1 text-center text-lg md:text-base font-semibold text-foreground pr-8">
          {t.city.title}
        </h1>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-28 md:mx-auto md:w-full md:max-w-6xl md:overflow-visible md:pb-6">
        <main className="md:rounded-2xl md:bg-secondary/60 md:p-6">
        <section className="mb-5 rounded-2xl bg-card p-4 shadow-card md:grid md:grid-cols-[minmax(0,0.85fr)_minmax(24rem,1.15fr)] md:items-center md:gap-6 md:p-5">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">Where are you looking?</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter an address, area, or street. Cities below are quick shortcuts.
            </p>
          </div>

          <div className="mt-4 md:mt-0">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={addressQuery}
                  onChange={(e) => setAddressQuery(e.target.value)}
                  placeholder="Enter address, suburb, or location..."
                  className="rounded-xl bg-secondary/60 h-12 md:h-11"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      finish();
                    }
                  }}
                />
              </div>
              <Button
                size="icon"
                className="h-12 w-12 md:h-11 md:w-11 rounded-xl shrink-0"
                onClick={finish}
                aria-label="Use this location"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>

            <button
              type="button"
              className="mt-3 flex w-full items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-primary transition-colors hover:bg-primary/15 disabled:opacity-70"
              onClick={useCurrentLocation}
              disabled={locating}
            >
              <Crosshair className={cn("w-5 h-5", locating && "animate-spin")} />
              <span className="flex-1 text-left text-sm font-medium">
                {locating ? "Finding your nearest city..." : "Use my current location"}
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        <h3 className="font-semibold text-foreground mb-2">{t.city.popularCities}</h3>
        <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-6">
          {namibiaCities.popular.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => selectCity(name)}
              className={cn(
                "rounded-lg md:rounded-md overflow-hidden bg-card shadow-sm transition-all text-left hover:-translate-y-0.5 hover:shadow-card",
                selected === name ? "ring-2 ring-primary" : "ring-1 ring-border/60",
              )}
            >
              <div className="aspect-square bg-muted relative overflow-hidden text-transparent">
                <img
                  src={cityImages[name]}
                  alt={name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                {selected === name && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-md">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </span>
                )}
                <span className="text-2xl">🏙️</span>
              </div>
              <p className="text-xs md:text-[10px] font-semibold text-center px-1.5 md:px-0.5 py-1.5 md:py-1 text-foreground leading-tight truncate">{name}</p>
            </button>
          ))}
        </div>
        {suburbs.length > 0 && (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-foreground">Popular areas in {selected}</h3>
              {selectedArea && (
                <button
                  type="button"
                  onClick={() => setSelectedArea("")}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Clear area
                </button>
              )}
            </div>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2 hide-scrollbar md:flex-wrap md:overflow-visible md:pb-0">
              {suburbs.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => selectArea(name)}
                  className={cn(
                    "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                    selectedArea === name
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary/60 hover:bg-primary/5",
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </>
        )}
        <h3 className="font-semibold text-foreground mb-3">{t.city.allCities}</h3>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3">
          {namibiaCities.all.map((name) => (
            <CityCard key={name} name={name} compact />
          ))}
        </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-secondary/95 backdrop-blur border-t border-border md:static md:mx-auto md:w-full md:max-w-6xl md:border-0 md:bg-transparent md:px-4 md:pt-0">
        <Button
          className="w-full h-12 rounded-2xl text-base font-semibold md:max-w-sm md:mx-auto md:flex"
          onClick={finish}
        >
          {t.city.next}
        </Button>
      </div>
    </div>
  );
};

export default ChooseCity;
