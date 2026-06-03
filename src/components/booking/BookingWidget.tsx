import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import BookingCalendar from "./BookingCalendar";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface BookingWidgetProps {
  property: {
    id: string;
    title: string;
    pricingModel?: {
      daily?: number;
      weekly?: number;
      monthly?: number;
    };
    minimumStay?: number;
    maxGuests?: number;
    cleaningFee?: number;
    serviceFee?: number;
    availability?: {
      startDate: string;
      endDate: string;
      blockedDates?: string[];
    } | null;
    rentalType: "long-term" | "short-term";
    instantBook?: boolean;
    cancellationPolicy?: "flexible" | "moderate" | "strict";
    checkInTime?: string;
    checkOutTime?: string;
  };
}

const BookingWidget = ({ property }: BookingWidgetProps) => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const createBooking = useMutation(api.bookings.create);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

  const nights = checkIn && checkOut 
    ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const calculatePrice = () => {
    if (!property.pricingModel || !nights) return 0;
    
    const { daily, weekly, monthly } = property.pricingModel;
    
    if (daily) {
      return daily * nights;
    } else if (weekly && nights >= 7) {
      return weekly * Math.ceil(nights / 7);
    } else if (monthly && nights >= 30) {
      return monthly * Math.ceil(nights / 30);
    }
    return 0;
  };

  const subtotal = calculatePrice();
  const cleaningFee = property.cleaningFee || 0;
  const serviceFee = subtotal * 0.1; // 10% service fee
  const total = subtotal + cleaningFee + serviceFee;

  const defaultAvailability = {
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    blockedDates: [],
  };
  const availability = property.availability ?? defaultAvailability;

  const handleBooking = async () => {
    if (!isSignedIn) {
      navigate("/login");
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error("Please select check-in and check-out dates");
      return;
    }
    if (nights < (property.minimumStay || 1)) {
      toast.error(`Minimum stay is ${property.minimumStay} nights`);
      return;
    }
    if (property.maxGuests && guests > property.maxGuests) {
      toast.error(`Maximum ${property.maxGuests} guests allowed`);
      return;
    }

    setIsBooking(true);
    try {
      await createBooking({
        propertyId: property.id as Id<"properties">,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guests,
        nights,
        subtotal,
        cleaningFee,
        serviceFee,
        total,
      });
      setIsBooking(false);
      toast.success(property.instantBook 
        ? "Booking confirmed! Check your email for details."
        : "Booking request sent! The host will confirm shortly.");
    } catch (error) {
      setIsBooking(false);
      toast.error(error instanceof Error ? error.message : "Could not submit booking request");
    }
  };

  if (property.rentalType === "long-term") {
    return null; // Don't show booking widget for long-term rentals
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border sticky top-4">
      <div className="space-y-4">
        <div>
          <p className="text-2xl font-bold text-primary mb-1">
            {property.pricingModel?.daily 
              ? `N$${property.pricingModel.daily.toLocaleString()}/night`
              : "Contact for pricing"}
          </p>
          {property.pricingModel?.weekly && (
            <p className="text-sm text-muted-foreground">
              Weekly: N${property.pricingModel.weekly.toLocaleString()}
            </p>
          )}
        </div>

        <BookingCalendar
          availability={availability}
          onDateSelect={(checkInDate, checkOutDate) => {
            setCheckIn(checkInDate);
            setCheckOut(checkOutDate);
          }}
          minimumStay={property.minimumStay}
        />

        <div>
          <Label>Guests</Label>
          <div className="flex items-center gap-2 mt-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <Input
              type="number"
              min={1}
              max={property.maxGuests || 10}
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
              className="flex-1"
            />
          </div>
        </div>

        {property.checkInTime && property.checkOutTime && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Check-in: {property.checkInTime}</p>
            <p>Check-out: {property.checkOutTime}</p>
          </div>
        )}

        {nights > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span>N${property.pricingModel?.daily?.toLocaleString()} × {nights} nights</span>
              <span>N${subtotal.toLocaleString()}</span>
            </div>
            {cleaningFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Cleaning fee</span>
                <span>N${cleaningFee.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Service fee</span>
              <span>N${serviceFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">N${total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleBooking}
          disabled={!checkIn || !checkOut || isBooking}
          className="w-full"
          size="lg"
        >
          {isBooking ? "Processing..." : property.instantBook ? "Book Now" : "Request to Book"}
        </Button>

        {property.cancellationPolicy && (
          <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {property.cancellationPolicy.charAt(0).toUpperCase() + property.cancellationPolicy.slice(1)} cancellation policy
          </p>
        )}
      </div>
    </div>
  );
};

export default BookingWidget;
