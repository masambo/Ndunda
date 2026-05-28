export interface Property {
  id: string;
  agent_id: string | null;
  owner_id: string;
  title: string;
  description: string | null;
  location: string;
  full_address: string | null;
  latitude: number | null;
  longitude: number | null;
  type:
    | "room"
    | "house"
    | "plot"
    | "apartment"
    | "guesthouse"
    | "hotel"
    | "lodge"
    | "camp"
    | "lodges-camps"
    | "office-space"
    | "student-accommodation"
    | "commercial"
    | "airbnb"
    | "mbashu";
  listing_mode: "buy" | "rent";
  rental_type: "long-term" | "short-term";
  price: number;
  bedrooms: number;
  bathrooms: number;
  size: number | null;
  images: string[];
  owner_name: string | null;
  owner_email: string | null;
  owner_avatar_url: string | null;
  owner_phone: string | null;
  owner_whatsapp: string | null;
  owner_role: "customer" | "agent" | "admin" | null;
  verified: boolean;
  recommended: boolean;
  status: "active" | "pending" | "sold" | "rented" | "inactive";
  is_new: boolean;
  available_from: string | null;
  deposit: number | null;
  lease_term: string | null;
  pets_allowed: boolean;
  furnished: boolean;
  daily_price: number | null;
  weekly_price: number | null;
  monthly_price: number | null;
  minimum_stay: number | null;
  max_guests: number | null;
  cleaning_fee: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  instant_book: boolean;
  cancellation_policy: "flexible" | "moderate" | "strict" | null;
  availability: unknown;
  created_at: string;
  updated_at: string;
}

export interface PropertyFilters {
  listingMode?: "buy" | "rent";
  type?: string;
  rentalType?: "long-term" | "short-term";
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  verified?: boolean;
  location?: string;
  status?: string;
  limit?: number;
}
