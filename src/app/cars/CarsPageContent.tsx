'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { normalizeCarsFromDb } from '@/lib/carTransform';
import { getSupabaseClient } from '@/lib/supabase';
import type { Car } from '@/types';

const CATEGORIES = ['sedan', 'suv', 'truck', 'coupe', 'convertible', 'van', 'hatchback', 'wagon'];
const CONDITIONS = ['new', 'used', 'refurbished'];
const FUEL_TYPES = ['gasoline', 'diesel', 'hybrid', 'electric'];

export function CarsPageContent() {
  const searchParams = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [condition, setCondition] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

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
        setCars(normalizeCarsFromDb(data));
      } catch (err) {
        console.error('Error fetching cars:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...cars];

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((car) =>
        car.title.toLowerCase().includes(term) ||
        car.make.toLowerCase().includes(term) ||
        car.model.toLowerCase().includes(term) ||
        car.description.toLowerCase().includes(term)
      );
    }

    // Category
    if (category) {
      filtered = filtered.filter((car) => car.category === category);
    }

    // Price range
    if (minPrice) {
      filtered = filtered.filter((car) => car.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter((car) => car.price <= parseFloat(maxPrice));
    }

    // Year
    if (minYear) {
      filtered = filtered.filter((car) => car.year >= parseInt(minYear));
    }

    // Condition
    if (condition) {
      filtered = filtered.filter((car) => car.condition === condition);
    }

    // Fuel type
    if (fuelType) {
      filtered = filtered.filter((car) => car.fuelType === fuelType);
    }

    // Sort
    if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => a.year - b.year);
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredCars(filtered);
  }, [cars, searchTerm, category, minPrice, maxPrice, minYear, condition, fuelType, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 text-xs md:text-sm font-medium mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Browse All Vehicles</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Found {filteredCars.length} vehicles</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow p-4 md:p-6 space-y-4 md:space-y-6 sticky top-20">
              <div className="flex justify-between items-center">
                <h2 className="text-base md:text-lg font-bold text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-500"
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Make, model, or keyword"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <div className="space-y-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm"
                  />
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm"
                  />
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  value={minYear}
                  onChange={(e) => setMinYear(e.target.value)}
                  placeholder="Min year"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm"
                >
                  <option value="">All Conditions</option>
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond.charAt(0).toUpperCase() + cond.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fuel Type */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm"
                >
                  <option value="">All Fuel Types</option>
                  {FUEL_TYPES.map((fuel) => (
                    <option key={fuel} value={fuel}>
                      {fuel.charAt(0).toUpperCase() + fuel.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategory('');
                  setMinPrice('');
                  setMaxPrice('');
                  setMinYear('');
                  setCondition('');
                  setFuelType('');
                  setSortBy('newest');
                }}
                className="w-full px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 transition text-xs md:text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 bg-white p-3 md:p-4 rounded-lg shadow">
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm w-full sm:w-auto"
              >
                Show Filters
              </button>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm w-full sm:w-auto"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>

            {/* Cars Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredCars.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredCars.map((car) => (
                  <Link key={car.id} href={`/cars/${car.id}`}>
                    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden cursor-pointer h-full flex flex-col">
                      {car.images && car.images.length > 0 && (
                        <div className="relative h-40 sm:h-48 bg-gray-200">
                          <img
                            src={car.images[car.primary_image_index || 0]}
                            alt={`${car.year} ${car.make} ${car.model}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 md:top-4 md:left-4 flex gap-2 flex-wrap">
                            {car.tags && car.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="p-3 md:p-4 flex-1 flex flex-col">
                        <h3 className="text-sm md:text-lg font-bold text-gray-900 mb-1 md:mb-2">
                          {car.year} {car.make} {car.model}
                        </h3>
                        <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2 flex-1">{car.description}</p>
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                          <span className="text-lg md:text-2xl font-bold text-indigo-600">
                            Rs. {car.price.toLocaleString()}
                          </span>
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                            {car.condition}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs text-gray-600 border-t pt-3 md:pt-4">
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
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 text-base md:text-lg mb-4">No vehicles match your filters</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategory('');
                    setMinPrice('');
                    setMaxPrice('');
                    setMinYear('');
                    setCondition('');
                    setFuelType('');
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm md:text-base"
                >
                  Clear filters and try again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
