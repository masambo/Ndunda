import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Camera, Upload, MapPin, DollarSign, Bed, Bath, Square, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@clerk/react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Property } from "@/types/property";
import { useProperty } from "@/hooks/useProperties";
import type { Id } from "../../convex/_generated/dataModel";

const propertyTypes = [
  { id: "house", label: "House", image: "/Houses.png", category: "long-term", modes: ["buy", "rent"] },
  { id: "apartment", label: "Apartment", image: "/apartments.png", category: "long-term", modes: ["buy", "rent"] },
  { id: "plot", label: "Plot", image: "/commercial.png", category: "long-term", modes: ["buy"] },
  { id: "room", label: "Room", image: "/rooms.png", category: "long-term", modes: ["rent"] },
  { id: "mbashu", label: "Ghetto/Mbashu", image: "/ghetto.png", category: "long-term", modes: ["rent"] },
  { id: "commercial", label: "Commercial", image: "/commercial.png", category: "long-term", modes: ["buy", "rent"] },
  { id: "office-space", label: "Office Space", image: "/office.png", category: "long-term", modes: ["rent"] },
  { id: "student-accommodation", label: "Student Accommodation", image: "/student.png", category: "long-term", modes: ["rent"] },
  { id: "guesthouse", label: "Guest House", image: "/guesthouse.png", category: "short-term", modes: ["rent"] },
  { id: "airbnb", label: "Vacation Rental", image: "/Houses.png", category: "short-term", modes: ["rent"] },
] as const;

type PropertyTypeOption = (typeof propertyTypes)[number];
const MAX_LISTING_IMAGES = 6;
const MAX_IMAGE_FILE_SIZE = 8 * 1024 * 1024;

function resizeListingImage(file: File) {
  return new Promise<Blob>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const maxWidth = 1400;
      const maxHeight = 1000;
      const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Could not prepare image"));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Could not prepare image"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        0.78,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image"));
    };

    image.src = objectUrl;
  });
}

function getPropertyTypeOption(typeId: string, listingMode: "buy" | "rent"): PropertyTypeOption | undefined {
  return propertyTypes.find((type) => type.id === typeId && (type.modes as readonly string[]).includes(listingMode));
}

const AddListing = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = Boolean(editId);
  const { isLoaded, isSignedIn } = useAuth();
  const createProperty = useMutation(api.properties.create);
  const updateProperty = useMutation(api.properties.update);
  const generateUploadUrl = useMutation(api.properties.generateUploadUrl);
  const { property: editingProperty, loading: editingLoading } = useProperty(editId);
  const [listingMode, setListingMode] = useState<"buy" | "rent">("rent");
  const [selectedType, setSelectedType] = useState("");
  const [rentalType, setRentalType] = useState<"long-term" | "short-term">("long-term");
  const [images, setImages] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    price: "",
    bedrooms: "",
    bathrooms: "",
    size: "",
    latitude: "",
    longitude: "",
    description: "",
  });
  const [shortTermData, setShortTermData] = useState({
    dailyPrice: "",
    weeklyPrice: "",
    monthlyPrice: "",
    minimumStay: "1",
    maxGuests: "",
    cleaningFee: "",
    checkInTime: "14:00",
    checkOutTime: "11:00",
    instantBook: false,
    cancellationPolicy: "moderate" as "flexible" | "moderate" | "strict",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  useEffect(() => {
    if (!editingProperty) return;
    setListingMode(editingProperty.listing_mode);
    setSelectedType(editingProperty.type);
    setRentalType(editingProperty.rental_type);
    setImages(editingProperty.images);
    setImagePreviews(editingProperty.images);
    setFormData({
      title: editingProperty.title,
      location: editingProperty.location,
      price: String(editingProperty.price),
      bedrooms: String(editingProperty.bedrooms),
      bathrooms: String(editingProperty.bathrooms),
      size: editingProperty.size ? String(editingProperty.size) : "",
      latitude: editingProperty.latitude !== null ? String(editingProperty.latitude) : "",
      longitude: editingProperty.longitude !== null ? String(editingProperty.longitude) : "",
      description: editingProperty.description ?? "",
    });
    setShortTermData({
      dailyPrice: editingProperty.daily_price ? String(editingProperty.daily_price) : "",
      weeklyPrice: editingProperty.weekly_price ? String(editingProperty.weekly_price) : "",
      monthlyPrice: editingProperty.monthly_price ? String(editingProperty.monthly_price) : "",
      minimumStay: editingProperty.minimum_stay ? String(editingProperty.minimum_stay) : "1",
      maxGuests: editingProperty.max_guests ? String(editingProperty.max_guests) : "",
      cleaningFee: editingProperty.cleaning_fee ? String(editingProperty.cleaning_fee) : "",
      checkInTime: editingProperty.check_in_time ?? "14:00",
      checkOutTime: editingProperty.check_out_time ?? "11:00",
      instantBook: editingProperty.instant_book,
      cancellationPolicy: editingProperty.cancellation_policy ?? "moderate",
    });
  }, [editingProperty]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!isLoaded || !isSignedIn) {
      toast.error("Please sign in before uploading photos");
      navigate("/login");
      return;
    }

    const remainingSlots = MAX_LISTING_IMAGES - images.length;
    const selectedFiles = Array.from(files).slice(0, remainingSlots);

    if (selectedFiles.length === 0) {
      toast.error(`You can upload up to ${MAX_LISTING_IMAGES} photos`);
      return;
    }

    const invalidFile = selectedFiles.find((file) => !file.type.startsWith("image/"));
    if (invalidFile) {
      toast.error("Please upload image files only");
      return;
    }

    const oversizedFile = selectedFiles.find((file) => file.size > MAX_IMAGE_FILE_SIZE);
    if (oversizedFile) {
      toast.error("Each photo must be less than 8MB");
      return;
    }

    setIsUploadingImages(true);
    try {
      const uploadedImages: string[] = [];
      const uploadedPreviews: string[] = [];

      for (const file of selectedFiles) {
        const uploadUrl = await generateUploadUrl({});
        const resizedImage = await resizeListingImage(file);
        const previewUrl = URL.createObjectURL(resizedImage);
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": "image/jpeg" },
          body: resizedImage,
        });

        if (!result.ok) {
          throw new Error("Image upload failed");
        }

        const { storageId } = (await result.json()) as { storageId: string };
        uploadedImages.push(storageId);
        uploadedPreviews.push(previewUrl);
      }

      setImages((prev) => [...prev, ...uploadedImages].slice(0, MAX_LISTING_IMAGES));
      setImagePreviews((prev) => [...prev, ...uploadedPreviews].slice(0, MAX_LISTING_IMAGES));
      toast.success(uploadedImages.length === 1 ? "Photo uploaded" : "Photos uploaded");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not upload photos";
      toast.error(message);
    } finally {
      setIsUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!formData.location.trim()) {
      toast.error("Please enter a location");
      return;
    }
    if (listingMode === "rent" && rentalType === "short-term") {
      const hasShortTermPrice = [shortTermData.dailyPrice, shortTermData.weeklyPrice, shortTermData.monthlyPrice].some(
        (value) => value && parseFloat(value) > 0,
      );
      if (!hasShortTermPrice) {
        toast.error("Please enter at least one short-term price");
        return;
      }
    } else if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (images.length === 0) {
      toast.error("Please add at least one photo");
      return;
    }
    const selectedCategory = getPropertyTypeOption(selectedType, listingMode);
    if (!selectedCategory) {
      toast.error("Please choose a property category");
      return;
    }
    const latitude = formData.latitude.trim() ? Number(formData.latitude) : undefined;
    const longitude = formData.longitude.trim() ? Number(formData.longitude) : undefined;
    if ((latitude !== undefined && !Number.isFinite(latitude)) || (longitude !== undefined && !Number.isFinite(longitude))) {
      toast.error("Please enter valid latitude and longitude values");
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (!isLoaded || !isSignedIn) {
        toast.error(`Please sign in before ${isEditMode ? "saving" : "publishing"} a listing`);
        setIsSubmitting(false);
        navigate("/login");
        return;
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim(),
        fullAddress: formData.location.trim(),
        type: selectedCategory.id as Property["type"],
        listingMode,
        rentalType: selectedCategory.category,
        price:
          listingMode === "rent" && rentalType === "short-term"
            ? parseFloat(shortTermData.monthlyPrice || shortTermData.weeklyPrice || shortTermData.dailyPrice || "0")
            : parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms || "0", 10),
        bathrooms: parseInt(formData.bathrooms || "0", 10),
        size: parseInt(formData.size || "0", 10) || undefined,
        latitude,
        longitude,
        images,
        dailyPrice: shortTermData.dailyPrice ? parseFloat(shortTermData.dailyPrice) : undefined,
        weeklyPrice: shortTermData.weeklyPrice ? parseFloat(shortTermData.weeklyPrice) : undefined,
        monthlyPrice: shortTermData.monthlyPrice ? parseFloat(shortTermData.monthlyPrice) : undefined,
        minimumStay: parseInt(shortTermData.minimumStay || "1", 10),
        maxGuests: shortTermData.maxGuests ? parseInt(shortTermData.maxGuests, 10) : undefined,
        cleaningFee: shortTermData.cleaningFee ? parseFloat(shortTermData.cleaningFee) : undefined,
        checkInTime: rentalType === "short-term" ? shortTermData.checkInTime : undefined,
        checkOutTime: rentalType === "short-term" ? shortTermData.checkOutTime : undefined,
        instantBook: rentalType === "short-term" ? shortTermData.instantBook : false,
        cancellationPolicy: rentalType === "short-term" ? shortTermData.cancellationPolicy : undefined,
      };

      if (isEditMode && editId) {
        await updateProperty({
          id: editId as Id<"properties">,
          ...payload,
        });
      } else {
        await createProperty(payload);
      }

      setIsSubmitting(false);
      toast.success(isEditMode ? "Listing updated successfully" : "Listing published successfully");
      // Reset form
      setFormData({
        title: "",
        location: "",
        price: "",
        bedrooms: "",
        bathrooms: "",
        size: "",
        latitude: "",
        longitude: "",
        description: "",
      });
      setImages([]);
      setImagePreviews([]);
      setSelectedType("");
      setRentalType("long-term");
      navigate("/my-listings");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to publish listing";
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-6">
        <h1 className="text-xl font-semibold text-foreground mb-1">
          {isEditMode ? "Edit Listing" : "Add Listing"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {isEditMode ? "Update your property details" : "List your property for free"}
        </p>
        {editingLoading && isEditMode && (
          <div className="mb-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Loading listing details...
          </div>
        )}

        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-3 block">
            Listing Purpose
          </label>
          <div className="grid grid-cols-2 gap-2 bg-muted rounded-lg p-1">
            {(["rent", "buy"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setListingMode(mode);
                  const currentCategory = getPropertyTypeOption(selectedType, mode);
                  if (!currentCategory) {
                    setSelectedType("");
                    setRentalType("long-term");
                  } else {
                    setRentalType(currentCategory.category);
                  }
                  if (mode === "buy") {
                    setRentalType("long-term");
                  }
                }}
                className={cn(
                  "h-11 rounded-md text-sm font-semibold transition-colors",
                  listingMode === mode
                    ? "bg-card text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "buy" ? "Sell" : "Rent"}
              </button>
            ))}
          </div>
        </div>

        {/* Property Type */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-3 block">
            Property Category <span className="text-destructive">*</span>
          </label>
          {!selectedType && (
            <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
              Choose a category before publishing. This controls where the property appears in search.
            </p>
          )}
          <div className="grid grid-cols-3 gap-3">
            {propertyTypes
              .filter((type) => (type.modes as readonly string[]).includes(listingMode))
              .map((type, index) => {
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => {
                    setSelectedType(type.id);
                    setRentalType(type.category as "long-term" | "short-term");
                  }}
                  style={{ animationDelay: `${index * 30}ms` }}
                  className={cn(
                    "group flex min-h-[6.75rem] flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all duration-300 animate-slide-up hover:-translate-y-0.5 active:scale-[0.98]",
                    selectedType === type.id
                      ? "border-primary bg-primary/5 shadow-card"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-card"
                  )}
                >
                  <div className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300",
                    selectedType === type.id ? "bg-primary/10 scale-105" : "bg-muted",
                  )}>
                    <img
                      src={type.image}
                      alt=""
                      className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                  <span
                    className={cn(
                      "text-center text-xs font-medium leading-tight md:text-sm",
                      selectedType === type.id ? "text-primary" : "text-foreground"
                    )}
                  >
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Photos */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-3 block">
            Photos {images.length > 0 && `(${images.length})`}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {imagePreviews.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-border">
                <img src={image} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImages(images.filter((_, i) => i !== index));
                    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-destructive text-primary-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/90"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < MAX_LISTING_IMAGES && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={isUploadingImages}
                  className="hidden"
                />
                <Camera className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {isUploadingImages ? "Uploading..." : "Add Photo"}
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Title
          </label>
          <input
            type="text"
            placeholder="e.g., Cozy room in Windhoek Central"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            required
          />
        </div>

        {/* Location */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Area, suburb"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="-22.5609"
              value={formData.latitude}
              onChange={(e) => handleInputChange("latitude", e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              placeholder="17.0658"
              value={formData.longitude}
              onChange={(e) => handleInputChange("longitude", e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Price - Different for long-term vs short-term */}
        {listingMode === "buy" ? (
          <div className="mb-4">
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Sale Price (N$)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                placeholder="1200000"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                min="0"
                step="1000"
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
          </div>
        ) : rentalType === "long-term" ? (
          <div className="mb-4">
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Monthly Rent (N$)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                placeholder="5000"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                min="0"
                step="100"
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                required
              />
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Pricing (N$)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Daily</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="500"
                    value={shortTermData.dailyPrice}
                    onChange={(e) => setShortTermData({...shortTermData, dailyPrice: e.target.value})}
                    min="0"
                    className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Weekly</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="3000"
                    value={shortTermData.weeklyPrice}
                    onChange={(e) => setShortTermData({...shortTermData, weeklyPrice: e.target.value})}
                    min="0"
                    className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Monthly</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <input
                    type="number"
                    placeholder="10000"
                    value={shortTermData.monthlyPrice}
                    onChange={(e) => setShortTermData({...shortTermData, monthlyPrice: e.target.value})}
                    min="0"
                    className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              Bedrooms
            </label>
            <div className="relative">
              <Bed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                placeholder="1"
                value={formData.bedrooms}
                onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                min="0"
                className="w-full pl-9 pr-3 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              Bathrooms
            </label>
            <div className="relative">
              <Bath className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                placeholder="1"
                value={formData.bathrooms}
                onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                min="0"
                className="w-full pl-9 pr-3 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-2 block">
              Size (m²)
            </label>
            <div className="relative">
              <Square className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                placeholder="25"
                value={formData.size}
                onChange={(e) => handleInputChange("size", e.target.value)}
                min="0"
                className="w-full pl-9 pr-3 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {/* Short-term specific fields */}
        {rentalType === "short-term" && (
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Minimum Stay (nights)
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={shortTermData.minimumStay}
                  onChange={(e) => setShortTermData({...shortTermData, minimumStay: e.target.value})}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Max Guests
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="4"
                  value={shortTermData.maxGuests}
                  onChange={(e) => setShortTermData({...shortTermData, maxGuests: e.target.value})}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Check-in Time
                </label>
                <input
                  type="time"
                  value={shortTermData.checkInTime}
                  onChange={(e) => setShortTermData({...shortTermData, checkInTime: e.target.value})}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Check-out Time
                </label>
                <input
                  type="time"
                  value={shortTermData.checkOutTime}
                  onChange={(e) => setShortTermData({...shortTermData, checkOutTime: e.target.value})}
                  className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Cleaning Fee (N$)
              </label>
              <input
                type="number"
                min="0"
                placeholder="500"
                value={shortTermData.cleaningFee}
                onChange={(e) => setShortTermData({...shortTermData, cleaningFee: e.target.value})}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Cancellation Policy
              </label>
              <select
                value={shortTermData.cancellationPolicy}
                onChange={(e) => setShortTermData({...shortTermData, cancellationPolicy: e.target.value as "flexible" | "moderate" | "strict"})}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="flexible">Flexible - Full refund 1 day before</option>
                <option value="moderate">Moderate - Full refund 5 days before</option>
                <option value="strict">Strict - 50% refund up to 1 week before</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="instantBook"
                checked={shortTermData.instantBook}
                onChange={(e) => setShortTermData({...shortTermData, instantBook: e.target.checked})}
                className="rounded"
              />
              <label htmlFor="instantBook" className="text-sm text-foreground">
                Enable instant booking (guests can book without approval)
              </label>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="mb-6">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Description
          </label>
          <textarea
            rows={4}
            placeholder="Describe your property..."
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>

        {/* Info Box */}
        <div className="bg-secondary rounded-xl p-4 mb-6 flex gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Free Listing</p>
            <p className="text-xs text-muted-foreground mt-1">
              Listing your property on Ndunda is completely free. No hidden charges.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Button 
            type="submit" 
            variant="hero" 
            size="xl" 
            className="w-full"
            disabled={isSubmitting || isUploadingImages || !getPropertyTypeOption(selectedType, listingMode)}
          >
            {isSubmitting
              ? isEditMode ? "Saving..." : "Publishing..."
              : selectedType
                ? isEditMode ? "Save Changes" : "Publish Listing"
                : "Choose Category to Publish"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
};

export default AddListing;
