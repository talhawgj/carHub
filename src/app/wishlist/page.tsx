'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { Car } from '@/types';

export default function WishlistPage() {
  const [wishlistCars, setWishlistCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistCars = async () => {
      try {
        const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');

        if (wishlistIds.length === 0) {
          setWishlistCars([]);
          setLoading(false);
          return;
        }

        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .in('id', wishlistIds);

        if (error) throw error;
        setWishlistCars(data || []);
      } catch (err) {
        console.error('Error fetching wishlist cars:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistCars();
  }, []);

  const removeFromWishlist = (carId: string) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const updated = wishlist.filter((id: string) => id !== carId);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    setWishlistCars(wishlistCars.filter((car) => car.id !== carId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Link href="/cars" className="text-indigo-600 hover:text-indigo-700 font-medium text-xs md:text-sm mb-4 inline-block">
            ← Back to Cars
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Saved Vehicles</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">{wishlistCars.length} vehicle(s) saved</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : wishlistCars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {wishlistCars.map((car) => (
              <div
                key={car.id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden"
              >
                {car.images && car.images.length > 0 && (
                  <div className="relative h-40 sm:h-48 bg-gray-200">
                    <img
                      src={car.images[car.primary_image_index || 0]}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-3 md:p-4">
                  <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2">
                    {car.year} {car.make} {car.model}
                  </h3>
                  <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2">{car.description}</p>
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <span className="text-lg md:text-2xl font-bold text-indigo-600">
                      ${car.price.toLocaleString()}
                    </span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                      {car.condition}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs text-gray-600 border-t pt-3 md:pt-4 mb-3 md:mb-4">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-xs md:text-sm">{(car.mileage / 1000).toFixed(0)}k</div>
                      <div className="text-xs">Miles</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-xs md:text-sm">{car.fuelType}</div>
                      <div className="text-xs">Fuel</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 text-xs md:text-sm">{car.transmission[0].toUpperCase()}</div>
                      <div className="text-xs">Trans.</div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href={`/cars/${car.id}`}
                      className="flex-1 bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition text-center text-xs md:text-sm"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => removeFromWishlist(car.id)}
                      className="px-3 md:px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition text-xs md:text-sm whitespace-nowrap"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
            <p className="text-gray-600 text-base md:text-lg mb-4">No saved vehicles yet</p>
            <Link
              href="/cars"
              className="inline-block bg-indigo-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm md:text-base"
            >
              Browse Vehicles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
