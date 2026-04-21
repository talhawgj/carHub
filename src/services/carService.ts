import { supabase } from '@/lib/supabase';
import { Car } from '@/types';

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
    return data || [];
  },

  // Get single car by ID
  async getCarById(id: string): Promise<Car | null> {
    const { data, error } = await supabase.instance
      .from('cars')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get cars by seller
  async getCarsBySeller(sellerId: string): Promise<Car[]> {
    const { data, error } = await supabase.instance
      .from('cars')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Search cars
  async searchCars(query: string, filters?: Record<string, any>): Promise<Car[]> {
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
      queryBuilder = queryBuilder.eq('fuelType', filters.fuelType);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data || [];
  },

  // Create new car listing
  async createCar(car: Omit<Car, 'id' | 'created_at' | 'updated_at'>): Promise<Car> {
    const { data, error } = await supabase.instance
      .from('cars')
      .insert([car])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update car listing
  async updateCar(id: string, updates: Partial<Car>): Promise<Car> {
    const { data, error } = await supabase.instance
      .from('cars')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
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
