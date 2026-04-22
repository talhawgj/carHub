import type { Car } from '@/types';
import type { Json } from '@/types/supabase';

type CarDbPayload = Omit<Partial<Car>, 'fuelType' | 'specs'> & {
  fuel_type?: string;
  specs?: Json;
};

type DbCar = {
  id?: string | null;
  title?: string | null;
  description?: string | null;
  price?: number | null;
  mileage?: number | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  category?: string | null;
  condition?: string | null;
  fuelType?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  color?: string | null;
  tags?: string[] | null;
  specs?: unknown;
  images?: string[] | null;
  primary_image_index?: number | null;
  seller_id?: string | null;
  is_available?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export function normalizeCarFromDb(car: DbCar): Car {
  return {
    id: car.id || '',
    title: car.title || '',
    description: car.description || '',
    price: car.price ?? 0,
    mileage: car.mileage ?? 0,
    year: car.year ?? new Date().getFullYear(),
    make: car.make || '',
    model: car.model || '',
    category: (car.category as Car['category']) ?? 'sedan',
    condition: (car.condition as Car['condition']) ?? 'used',
    fuelType: (car.fuelType ?? car.fuel_type ?? 'gasoline') as Car['fuelType'],
    color: car.color || '',
    transmission: (car.transmission as Car['transmission']) ?? 'automatic',
    tags: car.tags ?? [],
    specs: (car.specs as Car['specs']) ?? {},
    images: car.images ?? [],
    primary_image_index: car.primary_image_index ?? 0,
    seller_id: car.seller_id || '',
    is_available: car.is_available ?? true,
    created_at: car.created_at || new Date().toISOString(),
    updated_at: car.updated_at || new Date().toISOString(),
  };
}

export function normalizeCarsFromDb(cars: DbCar[] | null | undefined): Car[] {
  return (cars || []).map(normalizeCarFromDb);
}

export function toCarDbPayload(car: Partial<Car>): CarDbPayload {
  const { fuelType, specs, ...rest } = car;

  const payload: CarDbPayload = {
    ...rest,
  };

  if (typeof specs !== 'undefined') {
    payload.specs = specs as Json;
  }

  if (typeof fuelType !== 'undefined') {
    payload.fuel_type = fuelType;
  }

  return payload;
}