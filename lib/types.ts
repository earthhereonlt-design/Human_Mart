export type Mood = "celebrate" | "lonely" | "waiting" | "problem" | "curious";

export interface Profile {
  id: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  photo_url: string | null;
  created_by: string | null;
  claimed_by: string | null;
  created_at: string;
}

/** Row shape of the `market_listings` view (listing + person + rating stats) */
export interface MarketListing {
  id: string;
  person_id: string;
  title: string;
  description: string | null;
  price: number;
  unit: string;
  category: string;
  tags: string[];
  availability: string | null;
  is_active: boolean;
  created_at: string;
  person_name: string;
  person_slug: string;
  person_photo_url: string | null;
  person_claimed: boolean;
  avg_rating: number;
  review_count: number;
}

export interface Review {
  id: string;
  listing_id: string;
  author_id: string;
  rating: number;
  body: string;
  created_at: string;
  author_name?: string;
}

export interface CartLine {
  listingId: string;
  title: string;
  unit: string;
  price: number; // INR
  qty: number;
  personName: string;
  personSlug: string;
  photoUrl: string | null;
}

export interface Address {
  fullName: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface OrderTotals {
  subtotal: number;
  humanTouch: number; // discount
  serviceFee: number;
  total: number;
}

export interface OrderRow {
  id: string;
  buyer_id: string;
  address: Address;
  items: CartLine[];
  totals: OrderTotals;
  payment_method: string;
  status: string;
  created_at: string;
}
