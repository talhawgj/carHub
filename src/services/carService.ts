import { supabase } from '@/lib/supabase';
import { normalizeCarFromDb, normalizeCarsFromDb, toCarDbPayload } from '@/lib/carTransform';
import { Car } from '@/types';

type CarSearchFilters = {
  make?: string;
  model?: string;
  minPrice?: number;
  maxPrice?: number;
  fuelType?: string;
};

export const carService = {
  // Get all available cars
  async getAllCars(limit = 20, offset = 0): Promise<Car[]> {
    const { data, error } = await supabase.instance
      .from('cars')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return normalizeCarsFromDb(data);
  },

  // Get single car by ID
  async getCarById(id: string): Promise<Car | null> {
    const { data, error } = await supabase.instance
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data ? normalizeCarFromDb(data) : null;
  },

  // Get cars by seller
  async getCarsBySeller(sellerId: string): Promise<Car[]> {
    const { data, error } = await supabase.instance
      .from('cars')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return normalizeCarsFromDb(data);
  },

  // Search cars
  async searchCars(query: string, filters?: CarSearchFilters): Promise<Car[]> {
    let queryBuilder = supabase.instance
      .from('cars')
      .select('*')
      .textSearch('search_vector', query);

    if (filters?.make) {
      queryBuilder = queryBuilder.eq('make', filters.make);
    }
    if (filters?.model) {
      queryBuilder = queryBuilder.eq('model', filters.model);
    }
    if (filters?.minPrice) {
      queryBuilder = queryBuilder.gte('price', filters.minPrice);
    }
    if (filters?.maxPrice) {
      queryBuilder = queryBuilder.lte('price', filters.maxPrice);
    }
    if (filters?.fuelType) {
      queryBuilder = queryBuilder.eq('fuel_type', filters.fuelType);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return normalizeCarsFromDb(data);
  },

  // Create new car listing
  async createCar(car: Omit<Car, 'id' | 'created_at' | 'updated_at'>): Promise<Car> {
    const dbPayload = toCarDbPayload(car);

    const { data, error } = await supabase.instance
      .from('cars')
      .insert([dbPayload])
      .select()
      .single();

    if (error) throw error;
    return normalizeCarFromDb(data);
  },

  // Update car listing
  async updateCar(id: string, updates: Partial<Car>): Promise<Car> {
    const dbPayload = toCarDbPayload(updates);

    const { data, error } = await supabase.instance
      .from('cars')
      .update(dbPayload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return normalizeCarFromDb(data);
  },

  // Delete car listing
  async deleteCar(id: string): Promise<void> {
    const { error } = await supabase.instance
      .from('cars')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
