'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { Car } from '@/types';

export function ComparePageContent() {
  const searchParams = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCars, setSelectedCars] = useState<string[]>(
    searchParams.get('cars')?.split(',') || []
  );
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all cars
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .eq('is_available', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAvailableCars(data || []);

        // Load selected cars
        if (selectedCars.length > 0) {
          const selected = data?.filter((car: Car) => selectedCars.includes(car.id)) || [];
          setCars(selected);
        }
      } catch (err) {
        console.error('Error fetching cars:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [selectedCars]);

  const toggleCarSelection = (carId: string) => {
    setSelectedCars((prev) => {
      if (prev.includes(carId)) {
        return prev.filter((id) => id !== carId);
      } else if (prev.length < 3) {
        return [...prev, carId];
      }
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Link href="/cars" className="text-indigo-600 hover:text-indigo-700 font-medium text-xs md:text-sm mb-4 inline-block">
            ← Back to Cars
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Compare Vehicles</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Select up to 3 cars to compare side by side</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Car Selection */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-6 md:mb-8">
          <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4">
            Add Cars to Compare ({selectedCars.length}/3)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {availableCars.map((car) => (
              <button
                key={car.id}
                onClick={() => toggleCarSelection(car.id)}
                className={`p-3 md:p-4 rounded-lg border-2 text-left transition text-sm md:text-base ${
                  selectedCars.includes(car.id)
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                disabled={!selectedCars.includes(car.id) && selectedCars.length >= 3}
              >
                <div className="flex items-start gap-3">
                  {car.images && car.images.length > 0 && (
                    <img
                      src={car.images[car.primary_image_index || 0]}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className="w-12 md:w-16 h-12 md:h-16 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-xs md:text-base">
                      {car.year} {car.make} {car.model}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600">${car.price.toLocaleString()}</p>
                    {selectedCars.includes(car.id) && (
                      <span className="text-xs text-indigo-600 font-semibold">✓ Selected</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        {cars.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <tbody>
                {/* Images */}
                <tr className="border-b">
                  <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50 w-20 md:w-32 flex-shrink-0">Images</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 md:p-4 min-w-48 md:min-w-64">
                      {car.images && car.images.length > 0 && (
                        <img
                          src={car.images[car.primary_image_index || 0]}
                          alt={`${car.year} ${car.make} ${car.model}`}
                          className="w-full h-32 md:h-48 object-cover rounded-lg"
                        />
                      )}
                    </td>
                  ))}
                </tr>

                {/* Title */}
                <tr className="border-b">
                  <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Title</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 md:p-4 font-semibold text-gray-900">
                      {car.year} {car.make} {car.model}
                    </td>
                  ))}
                </tr>

                {/* Price */}
                <tr className="border-b bg-indigo-50">
                  <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Price</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 md:p-4 text-lg md:text-2xl font-bold text-indigo-600">
                      ${car.price.toLocaleString()}
                    </td>
                  ))}
                </tr>

                {/* Year */}
                <tr className="border-b">
                  <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Year</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 md:p-4 text-gray-900">{car.year}</td>
                  ))}
                </tr>

                {/* Condition */}
                <tr className="border-b">
                  <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Condition</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 md:p-4 capitalize text-gray-900">{car.condition}</td>
                  ))}
                </tr>

                {/* Mileage */}
                <tr className="border-b">
                  <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Mileage</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 md:p-4 text-gray-900">{car.mileage.toLocaleString()} mi</td>
                  ))}
                </tr>

                {/* Fuel Type */}
                <tr className="border-b">
                  <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Fuel Type</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 md:p-4 capitalize text-gray-900">{car.fuelType}</td>
                  ))}
                </tr>

                {/* Transmission */}
                <tr className="border-b">
                  <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Transmission</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 md:p-4 capitalize text-gray-900">{car.transmission}</td>
                  ))}
                </tr>

                {/* Category */}
                <tr className="border-b">
                  <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Category</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 md:p-4 capitalize text-gray-900">{car.category || 'N/A'}</td>
                  ))}
                </tr>

                {/* Color */}
                <tr className="border-b">
                  <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Color</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 md:p-4 text-gray-900">{car.color}</td>
                  ))}
                </tr>

                {/* Specs Section */}
                {cars.some((car) => car.specs && Object.keys(car.specs).length > 0) && (
                  <>
                    {/* Horsepower */}
                    {cars.some((car) => car.specs?.horsepower) && (
                      <tr className="border-b">
                        <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Horsepower</td>
                        {cars.map((car) => (
                          <td key={car.id} className="p-3 md:p-4 text-gray-900">
                            {car.specs?.horsepower ? `${car.specs.horsepower} hp` : 'N/A'}
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* Engine Size */}
                    {cars.some((car) => car.specs?.engine_size) && (
                      <tr className="border-b">
                        <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Engine Size</td>
                        {cars.map((car) => (
                          <td key={car.id} className="p-3 md:p-4 text-gray-900">{car.specs?.engine_size || 'N/A'}</td>
                        ))}
                      </tr>
                    )}

                    {/* Doors */}
                    {cars.some((car) => car.specs?.doors) && (
                      <tr className="border-b">
                        <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Doors</td>
                        {cars.map((car) => (
                          <td key={car.id} className="p-3 md:p-4 text-gray-900">{car.specs?.doors || 'N/A'}</td>
                        ))}
                      </tr>
                    )}

                    {/* Seats */}
                    {cars.some((car) => car.specs?.seats) && (
                      <tr className="border-b">
                        <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Seats</td>
                        {cars.map((car) => (
                          <td key={car.id} className="p-3 md:p-4 text-gray-900">{car.specs?.seats || 'N/A'}</td>
                        ))}
                      </tr>
                    )}

                    {/* MPG */}
                    {cars.some((car) => car.specs?.mpg) && (
                      <tr className="border-b">
                        <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">MPG</td>
                        {cars.map((car) => (
                          <td key={car.id} className="p-3 md:p-4 text-gray-900">{car.specs?.mpg ? `${car.specs.mpg} mpg` : 'N/A'}</td>
                        ))}
                      </tr>
                    )}

                    {/* Acceleration */}
                    {cars.some((car) => car.specs?.acceleration) && (
                      <tr className="border-b">
                        <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Acceleration</td>
                        {cars.map((car) => (
                          <td key={car.id} className="p-3 md:p-4 text-gray-900">{car.specs?.acceleration || 'N/A'}</td>
                        ))}
                      </tr>
                    )}

                    {/* Top Speed */}
                    {cars.some((car) => car.specs?.top_speed) && (
                      <tr className="border-b">
                        <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">Top Speed</td>
                        {cars.map((car) => (
                          <td key={car.id} className="p-3 md:p-4 text-gray-900">
                            {car.specs?.top_speed ? `${car.specs.top_speed} mph` : 'N/A'}
                          </td>
                        ))}
                      </tr>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                <tr>
                  <td className="p-3 md:p-4 font-bold text-gray-900 bg-gray-50">View Details</td>
                  {cars.map((car) => (
                    <td key={car.id} className="p-3 md:p-4">
                      <Link
                        href={`/cars/${car.id}`}
                        className="inline-block bg-indigo-600 text-white px-3 md:px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition text-xs md:text-sm whitespace-nowrap"
                      >
                        View Full Details
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 md:p-12 text-center">
            <p className="text-gray-600 text-base md:text-lg">Select cars above to compare them</p>
          </div>
        )}
      </div>
    </div>
  );
}
