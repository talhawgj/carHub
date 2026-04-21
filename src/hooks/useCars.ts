'use client';

import { useState, useEffect } from 'react';
import { Car } from '@/types';
import { carService } from '@/services/carService';

export function useCars() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const data = await carService.getAllCars();
        setCars(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch cars');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  return { cars, loading, error, refetch: () => {} };
}

export function useCarById(id: string) {
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        setLoading(true);
        const data = await carService.getCarById(id);
        setCar(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch car');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchCar();
  }, [id]);

  return { car, loading, error };
}
