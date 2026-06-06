// Updated Types for CarMandi Database Schema

export type UserRole = 'buyer' | 'seller' | 'inspector' | 'admin';
export type ListingStatus = 'draft' | 'pending_inspection' | 'active' | 'sold' | 'unsold' | 'relisted';
export type AuctionStatus = 'scheduled' | 'active' | 'closing' | 'closed';
export type InspectionStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type InspectionResult = 'pass' | 'fail' | 'na';

export interface User {
  id: string;
  phone: string;
  cnic_hash?: string;
  name: string;
  city?: string;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface Make {
  id: string;
  name: string;
  logo_url?: string;
  slug: string;
}

export interface Model {
  id: string;
  make_id: string;
  name: string;
  slug: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  make_id: string;
  model_id: string;
  year: number;
  variant?: string;
  city: string;
  description?: string;
  demand_price?: number;
  reserve_price?: number; // usually hidden, but here for typing
  status: ListingStatus;
  slug: string;
  created_at: string;
}

export interface Auction {
  id: string;
  listing_id: string;
  starts_at: string;
  ends_at: string;
  status: AuctionStatus;
  current_highest_bid: number;
  bid_count: number;
  winner_bid_id?: string;
  reserve_met: boolean;
  created_at: string;
}

export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
  placed_at: string;
  is_winner: boolean;
}

export interface Inspection {
  id: string;
  listing_id: string;
  inspector_id?: string;
  booked_at: string;
  scheduled_at?: string;
  completed_at?: string;
  status: InspectionStatus;
  total_checkpoints: number;
  report_url?: string;
  photo_urls?: string[];
}

export interface Photo {
  id: string;
  listing_id: string;
  url: string;
  order_index: number;
  type: 'exterior' | 'interior' | 'engine' | 'inspection';
}

// Temporary Car interface used for frontend components to avoid large refactors immediately
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  variant?: string;
  city: string;
  description?: string;
  price: number;
  condition?: string;
  mileage?: number;
  fuelType?: string;
  transmission?: string;
  tags?: string[];
  images?: string[];
  primary_image_index?: number;
  is_available?: boolean;
}
