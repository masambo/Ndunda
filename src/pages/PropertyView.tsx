import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import {
  Heart,
  MapPin,
  Bed,
  Bath,
  Square,
  ArrowLeft,
  Share2,
  Phone,
  Mail,
  Calendar,
  Wifi,
  Car,
  Shield,
  Coffee,
  Home,
  Building,
  CheckCircle2,
  Star,
  Camera,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import PropertyCard from "@/components/home/PropertyCard";
import BookingWidget from "@/components/booking/BookingWidget";
import { useProperty } from "@/hooks/useProperties";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

import property1 from "@/assets/property-1.jpg";

const OwnerAvatar = ({
  image,
  name,
  className,
}: {
  image?: string;
  name: string;
  className: string;
}) => {
  if (image) {
    return <img src={image} alt={name} className={className} />;
  }

  return (
    <div className={cn(className, "grid place-items-center bg-primary/10 font-semibold text-primary")}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

const PropertyView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const propertyId = id || "";
  const { property: syncedProperty, loading: propertyLoading } = useProperty(propertyId);
  const { isSignedIn } = useAuth();
  const savedProperties = useQuery(api.properties.saved);
  const toggleSaved = useMutation(api.properties.toggleSaved);
  const property = syncedProperty ? {
    id: syncedProperty.id,
    title: syncedProperty.title,
    location: syncedProperty.location,
    fullAddress: syncedProperty.full_address ?? syncedProperty.location,
    latitude: syncedProperty.latitude,
    longitude: syncedProperty.longitude,
    price: syncedProperty.price,
    images: syncedProperty.images.length > 0 ? syncedProperty.images : [property1],
    bedrooms: syncedProperty.bedrooms,
    bathrooms: syncedProperty.bathrooms,
    size: syncedProperty.size ?? 0,
    type: syncedProperty.type,
    listingMode: syncedProperty.listing_mode,
    rentalType: syncedProperty.rental_type,
    isNew: syncedProperty.is_new,
    verified: syncedProperty.verified,
    description: syncedProperty.description ?? "Contact the agent for more details about this property.",
    amenities: [
      { icon: Shield, label: syncedProperty.verified ? "Verified" : "Listed" },
      { icon: Home, label: syncedProperty.furnished ? "Furnished" : "Unfurnished" },
      { icon: Car, label: "Parking nearby" },
    ],
    agent: {
      id: syncedProperty.owner_id,
      name: syncedProperty.owner_name || syncedProperty.owner_email || "Ndunda user",
      image: syncedProperty.owner_avatar_url || "",
      phone: syncedProperty.owner_whatsapp || syncedProperty.owner_phone || "",
      email: syncedProperty.owner_email || "hello@ndunda.na",
      verified: syncedProperty.verified,
      rating: 4.8,
      listings: 1,
    },
    availableFrom: syncedProperty.available_from ?? new Date().toISOString(),
    deposit: syncedProperty.deposit ?? syncedProperty.price,
    leaseTerm: syncedProperty.lease_term ?? "Contact agent",
    petsAllowed: syncedProperty.pets_allowed,
    furnished: syncedProperty.furnished,
    pricingModel: syncedProperty.rental_type === "short-term" ? {
      daily: syncedProperty.daily_price ?? undefined,
      weekly: syncedProperty.weekly_price ?? undefined,
      monthly: syncedProperty.monthly_price ?? undefined,
    } : undefined,
    checkInTime: syncedProperty.check_in_time,
    checkOutTime: syncedProperty.check_out_time,
    maxGuests: syncedProperty.max_guests,
    minimumStay: syncedProperty.minimum_stay,
  } : null;
  
  // Get similar properties (excluding current property)
  const similarProperties: any[] = [];
  
  const reviews: Array<{
    id: string;
    user: string;
    rating: number;
    date: string;
    comment: string;
    verified: boolean;
  }> = [];
  
  const averageRating = reviews.length > 0
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0;

  useEffect(() => {
    if (!propertyId) return;
    setIsFavorite(Boolean(savedProperties?.some((property) => property._id === propertyId)));
  }, [propertyId, savedProperties]);

  useEffect(() => {
    if (!carouselApi) return;

    const onSelect = () => {
      setSelectedImageIndex(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", onSelect);
    onSelect();

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  if (propertyLoading && !property) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] grid place-items-center">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!property) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">Property Not Found</h2>
          <p className="text-muted-foreground mb-6">The property you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/search")}>Back to Search</Button>
        </div>
      </AppLayout>
    );
  }

  const handleFavorite = async () => {
    if (!propertyId) return;
    if (!isSignedIn) {
      navigate("/login");
      return;
    }

    try {
      const saved = await toggleSaved({ propertyId: propertyId as Id<"properties"> });
      setIsFavorite(saved);
      toast.success(saved ? "Saved property" : "Removed from saved properties");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update saved property";
      toast.error(message);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.title,
          text: `Check out this property: ${property.title}`,
          url,
        });
        toast.success("Shared successfully");
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  const handleContactAgent = (method: "phone" | "email" | "whatsapp") => {
    if (method === "phone") {
      if (!property.agent.phone) {
        toast.error("This owner has not added a phone number yet.");
        return;
      }
      window.location.href = `tel:${property.agent.phone}`;
    } else if (method === "email") {
      window.location.href = `mailto:${property.agent.email}?subject=Inquiry about ${property.title}`;
    } else if (method === "whatsapp") {
      if (!property.agent.phone) {
        toast.error("This owner has not added a WhatsApp number yet.");
        return;
      }
      const phoneNumber = property.agent.phone.replace(/\s+/g, "").replace(/\+/g, "");
      const message = encodeURIComponent(`Hi! I'm interested in ${property.title}. Is it still available?`);
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
    }
  };

  const handleScheduleViewing = () => {
    setScheduleOpen(true);
  };

  const handleSubmitSchedule = () => {
    if (!selectedDate || !selectedTime || !name || !email || !phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    // In real app, submit to API
    toast.success(`Viewing scheduled for ${format(selectedDate, "PPP")} at ${selectedTime}`);
    setScheduleOpen(false);
    setSelectedDate(undefined);
    setSelectedTime("");
    setName("");
    setEmail("");
    setPhone("");
    setNotes("");
  };

  const availableTimeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
  ];
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  const streetViewLocation = property.latitude && property.longitude
    ? `${property.latitude},${property.longitude}`
    : encodeURIComponent(property.fullAddress || property.location);

  const handleImageThumbnailClick = (index: number) => {
    carouselApi?.scrollTo(index);
  };

  return (
    <AppLayout>
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFavorite}
              className={cn("rounded-full", isFavorite && "text-destructive")}
            >
              <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="rounded-full"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-background md:px-6 md:py-5 lg:px-8">
        <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)] lg:items-start lg:gap-6">
          <div className="min-w-0">
            {/* Image Gallery */}
            <div className="relative overflow-hidden md:rounded-2xl md:border md:border-border md:shadow-sm">
              <Carousel className="w-full" setApi={setCarouselApi}>
                <CarouselContent>
                  {property.images.map((image: string, index: number) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-[4/3] w-full md:aspect-[16/9] lg:h-[420px] lg:aspect-auto">
                        <img
                          src={image}
                          alt={`${property.title} - Image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 md:left-6" />
                <CarouselNext className="right-4 md:right-6" />
              </Carousel>

              <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {selectedImageIndex + 1} / {property.images.length}
              </div>
            </div>

            {/* Image Thumbnails */}
            {property.images.length > 1 && (
              <div className="bg-background px-4 py-3 md:px-0">
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 md:justify-center md:overflow-x-visible lg:justify-start">
                  {property.images.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleImageThumbnailClick(index)}
                      className={cn(
                        "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all md:h-16 md:w-24",
                        selectedImageIndex === index
                          ? "border-primary ring-2 ring-primary/25"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold leading-tight text-foreground">{property.title}</h1>
                  <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{property.fullAddress}</span>
                  </div>
                </div>
                {property.verified && (
                  <Badge className="shrink-0 bg-primary text-primary-foreground">
                    Verified
                  </Badge>
                )}
              </div>

              <div className="mb-5 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-primary">
                  N${property.price.toLocaleString()}
                </span>
                {property.listingMode !== "buy" && (
                  <span className="text-sm text-muted-foreground">
                    /{property.rentalType === "short-term" ? "night" : "month"}
                  </span>
                )}
              </div>

              <div className="mb-5 grid grid-cols-3 gap-2 border-y border-border py-4">
                <div className="rounded-xl bg-muted/50 p-3">
                  <Bed className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">{property.bedrooms} Beds</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <Bath className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">{property.bathrooms} Bath</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <Square className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">{property.size}m²</p>
                </div>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-3">
                {property.rentalType === "short-term" ? (
                  <>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="text-sm font-semibold">{property.checkInTime || "14:00"}</p>
                    </div>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">Check-out</p>
                      <p className="text-sm font-semibold">{property.checkOutTime || "11:00"}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">Deposit</p>
                      <p className="text-sm font-semibold">N${property.deposit.toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl border border-border p-3">
                      <p className="text-xs text-muted-foreground">Available</p>
                      <p className="text-sm font-semibold">
                        {new Date(property.availableFrom).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="mb-5 flex items-center gap-3 rounded-xl bg-primary/5 p-3">
                <OwnerAvatar
                  image={property.agent.image}
                  name={property.agent.name}
                  className="h-12 w-12 rounded-full border border-primary/20 object-cover"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{property.agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {property.agent.verified ? "Verified publisher" : "Property publisher"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {property.listingMode !== "buy" && property.rentalType === "long-term" && (
                  <Button className="col-span-2" onClick={handleScheduleViewing}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Viewing
                  </Button>
                )}
                <Button variant="outline" onClick={() => handleContactAgent("phone")}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call
                </Button>
                <Button variant="outline" onClick={() => handleContactAgent("whatsapp")}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Property Details */}
      <div className="px-4 py-6 md:px-6 md:py-6 lg:pt-1">
        {/* Desktop Layout: Side-by-side */}
        <div className="mx-auto max-w-7xl md:grid md:grid-cols-3 md:gap-8 md:items-start">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Title and Location */}
            <div className="lg:hidden">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground mb-2">{property.title}</h1>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="text-sm md:text-base">{property.fullAddress}</span>
              </div>
            </div>

            {/* Price */}
        <div className="flex items-baseline gap-2 lg:hidden">
          {property.listingMode === "buy" ? (
            <>
              <span className="text-2xl font-semibold text-primary">
                N${property.price.toLocaleString()}
              </span>
            </>
          ) : property.rentalType === "short-term" && property.pricingModel?.daily ? (
            <>
              <span className="text-2xl font-semibold text-primary">
                N${property.pricingModel.daily.toLocaleString()}
              </span>
              <span className="text-muted-foreground">/night</span>
              {property.pricingModel.weekly && (
                <span className="text-sm text-muted-foreground ml-2">
                  • Weekly: N${property.pricingModel.weekly.toLocaleString()}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-2xl font-semibold text-primary">
                N${property.price.toLocaleString()}
              </span>
              <span className="text-muted-foreground">/month</span>
            </>
          )}
        </div>

        {/* Key Features */}
        <div className="flex items-center gap-6 py-4 border-y border-border lg:hidden">
          <div className="flex items-center gap-2">
            <Bed className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">{property.bedrooms} Bed{property.bedrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <Bath className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">{property.bathrooms} Bath{property.bathrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <Square className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium">{property.size}m²</span>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-4 lg:hidden">
          {property.rentalType === "short-term" ? (
            <>
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Check-in</p>
                <p className="text-sm font-semibold">{property.checkInTime || "14:00"}</p>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Check-out</p>
                <p className="text-sm font-semibold">{property.checkOutTime || "11:00"}</p>
              </div>
              {property.maxGuests && (
                <div className="bg-card rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Max Guests</p>
                  <p className="text-sm font-semibold">{property.maxGuests}</p>
                </div>
              )}
              {property.minimumStay && (
                <div className="bg-card rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Min Stay</p>
                  <p className="text-sm font-semibold">{property.minimumStay} nights</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Deposit</p>
                <p className="text-sm font-semibold">N${property.deposit.toLocaleString()}</p>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Available From</p>
                <p className="text-sm font-semibold">
                  {new Date(property.availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Lease Term</p>
                <p className="text-sm font-semibold">{property.leaseTerm}</p>
              </div>
              <div className="bg-card rounded-lg p-3 border border-border">
                <p className="text-xs text-muted-foreground mb-1">Furnished</p>
                <p className="text-sm font-semibold">{property.furnished ? "Yes" : "No"}</p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons - Only show for long-term rentals */}
        {property.listingMode !== "buy" && property.rentalType === "long-term" && (
          <div className="md:col-span-2 lg:hidden">
          <div className="flex gap-3">
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild>
                <Button
                  className="flex-1"
                  onClick={handleScheduleViewing}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Viewing
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule a Viewing</DialogTitle>
                <DialogDescription>
                  Choose a date and time that works for you. The agent will confirm the appointment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Date *</Label>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {format(selectedDate, "PPP")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Select Time *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Your Name *</Label>
                  <Input
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any specific questions or requests..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setScheduleOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitSchedule} className="flex-1">
                  Confirm Viewing
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleContactAgent("phone")}
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Agent
          </Button>
          </div>
          </div>
        )}

            {/* Booking Widget for Short-term Rentals - Mobile */}
            {property.rentalType === "short-term" && (
              <div className="md:hidden mb-6">
                <BookingWidget property={property} />
              </div>
            )}

            {/* Tabs */}
          <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="reviews">
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-4">
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {property.description}
            </p>
          </TabsContent>
          <TabsContent value="amenities" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {property.amenities.map((amenity: any, index: number) => {
                const Icon = amenity.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium">{amenity.label}</span>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          <TabsContent value="location" className="mt-4">
            <div className="bg-card rounded-lg p-4 border border-border mb-4">
              <p className="text-sm font-medium mb-2">Full Address</p>
              <p className="text-sm text-muted-foreground">{property.fullAddress}</p>
            </div>
            {/* Google Street View Integration */}
            <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border mb-4 relative">
              {googleMapsApiKey ? (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/streetview?key=${googleMapsApiKey}&location=${streetViewLocation}&heading=210&pitch=0&fov=90`}
                  title="Property Street View"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/95 backdrop-blur-sm">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Street View</p>
                    <p className="text-xs text-muted-foreground">Add VITE_GOOGLE_MAPS_API_KEY to enable Street View</p>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                window.open(
                  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(property.fullAddress)}`,
                  "_blank"
                );
              }}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Get Directions
            </Button>
          </TabsContent>
          <TabsContent value="reviews" className="mt-4">
            {/* Reviews Summary */}
            <div className="bg-card rounded-lg p-4 border border-border mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-foreground mb-1">
                    {averageRating.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "w-4 h-4",
                          star <= Math.round(averageRating)
                            ? "text-yellow-500 fill-current"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                  </p>
                </div>
                  <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = reviews.filter((r) => r.rating === rating).length;
                    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-xs w-3">{rating}</span>
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-6 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-card rounded-lg p-4 border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {review.user.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{review.user}</p>
                          {review.verified && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "w-3 h-3",
                                star <= review.rating
                                  ? "text-yellow-500 fill-current"
                                  : "text-muted-foreground"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(review.date), "MMM d, yyyy")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
          </div>

          {/* Desktop Sidebar - Booking Widget for Short-term */}
          {property.rentalType === "short-term" && (
            <div className="hidden md:block md:col-span-1 md:sticky md:top-20">
              <BookingWidget property={property} />
            </div>
          )}
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <div className="mt-6 md:mt-8">
            <h2 className="text-lg md:text-2xl font-bold text-foreground mb-4 md:mb-6">Similar Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {similarProperties.map((similarProperty: any) => (
                <PropertyCard key={similarProperty.id} {...similarProperty} />
              ))}
            </div>
          </div>
        )}

        {/* Agent Card */}
        <div className="bg-card rounded-xl p-4 md:p-6 border border-border mt-6">
          <div className="flex items-start gap-4 mb-4">
            <OwnerAvatar
              image={property.agent.image}
              name={property.agent.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{property.agent.name}</h3>
                {property.agent.verified && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-sm font-medium">{property.agent.rating}</span>
                <span className="text-xs text-muted-foreground">
                  ({property.agent.listings} listings)
                </span>
              </div>
              <Link
                to={`/agents/${property.agent.id}`}
                className="text-xs text-primary hover:underline"
              >
                View all listings
              </Link>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleContactAgent("phone")}
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleContactAgent("whatsapp")}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar - Only for long-term rentals (Mobile only) */}
      {property.listingMode !== "buy" && property.rentalType === "long-term" && (
        <div className="md:hidden sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Price</p>
              <p className="text-lg font-bold text-primary">
                N${property.price.toLocaleString()}/mo
              </p>
            </div>
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild>
                <Button
                  className="flex-1"
                  onClick={handleScheduleViewing}
                >
                  Schedule Viewing
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule a Viewing</DialogTitle>
                <DialogDescription>
                  Choose a date and time that works for you. The agent will confirm the appointment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Date *</Label>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {format(selectedDate, "PPP")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Select Time *</Label>
                  <Select value={selectedTime} onValueChange={setSelectedTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Your Name *</Label>
                  <Input
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Additional Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any specific questions or requests..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setScheduleOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitSchedule} className="flex-1">
                  Confirm Viewing
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      )}
    </AppLayout>
  );
};

export default PropertyView;

