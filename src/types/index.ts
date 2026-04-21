export interface Car {
  id: string;
  title: string;
  description: string;
  price: number;
  mileage: number;
  year: number;
  make: string;
  model: string;
  category?: 'sedan' | 'suv' | 'truck' | 'coupe' | 'convertible' | 'van' | 'hatchback' | 'wagon';
  condition: 'new' | 'used' | 'refurbished';
  fuelType: 'gasoline' | 'diesel' | 'hybrid' | 'electric';
  transmission: 'manual' | 'automatic';
  color: string;
  tags?: string[]; // 'Featured', 'On Sale', 'New Arrival', etc.
  specs?: CarSpecs;
  images: string[]; // Image URLs from Supabase Storage
  primary_image_index?: number; // Index of primary/cover image
  seller_id: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarSpecs {
  horsepower?: number;
  engine_size?: string; // e.g., "2.0L"
  doors?: number;
  seats?: number;
  trunk_capacity?: string;
  acceleration?: string; // e.g., "0-60 in 8.5s"
  top_speed?: number;
  mpg?: number;
  features?: string[]; // ['Air conditioning', 'Cruise control', etc.]
}

export interface CarImage {
  car_id: string;
  file_path: string;
  uploaded_at: string;
}

export interface Listing {
  id: string;
  car_id: string;
  seller_id: string;
  price: number;
  status: 'active' | 'sold' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  user_type: 'buyer' | 'seller' | 'dealer' | 'admin';
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

export interface FilterOptions {
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  make?: string;
  condition?: 'new' | 'used' | 'refurbished';
  fuelType?: string;
  category?: string;
  tags?: string[];
  sortBy?: 'newest' | 'oldest' | 'price-low' | 'price-high';
}
