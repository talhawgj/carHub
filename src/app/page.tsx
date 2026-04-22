'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { normalizeCarsFromDb } from '@/lib/carTransform';
import { getSupabaseClient } from '@/lib/supabase';
import type { Car } from '@/types';

export default function Home() {
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchFeaturedCars = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .contains('tags', ['Featured'])
          .limit(6)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFeaturedCars(normalizeCarsFromDb(data));
      } catch (err) {
        console.error('Error fetching featured cars:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCars();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-600 rounded-full"></div>
              <span className="text-lg md:text-xl font-bold text-gray-900">CarHub</span>
            </Link>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/cars" className="text-gray-700 hover:text-indigo-600 font-medium text-sm">
                Browse Cars
              </Link>
              <Link href="/compare" className="text-gray-700 hover:text-indigo-600 font-medium text-sm">
                Compare
              </Link>
              <Link href="/wishlist" className="text-gray-700 hover:text-indigo-600 font-medium text-sm">
                Saved
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-indigo-600 font-medium text-sm">
                Contact
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t space-y-2">
              <Link
                href="/cars"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              >
                Browse Cars
              </Link>
              <Link
                href="/compare"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              >
                Compare
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              >
                Saved
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
              >
                Contact
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4">
              Find Your Perfect Car
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-indigo-100">
              Browse our collection of quality vehicles and find exactly what you're looking for
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Search by make, model, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 bg-white text-sm md:text-base"
              />
              <Link
                href={searchTerm ? `/cars?search=${encodeURIComponent(searchTerm)}` : '/cars'}
                className="bg-white text-indigo-600 px-6 md:px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition whitespace-nowrap text-sm md:text-base"
              >
                Search
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cars */}
      <section className="py-12 md:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-4">Featured Vehicles</h2>
            <p className="text-gray-600 text-sm md:text-base">Our handpicked selection of premium cars</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : featuredCars.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {featuredCars.map((car) => (
                <Link key={car.id} href={`/cars/${car.id}`}>
                  <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition overflow-hidden cursor-pointer h-full">
                    {car.images && car.images.length > 0 && (
                      <div className="relative h-40 sm:h-48 bg-gray-200">
                        <img
                          src={car.images[car.primary_image_index || 0]}
                          alt={`${car.year} ${car.make} ${car.model}`}
                          className="w-full h-full object-cover"
                        />
                        {car.tags && car.tags.includes('On Sale') && (
                          <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded-full text-xs md:text-sm font-semibold">
                            On Sale
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-3 md:p-4">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 md:mb-2">
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
                      <div className="grid grid-cols-3 gap-1 md:gap-2 text-xs text-gray-600 border-t pt-3 md:pt-4">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900 text-xs md:text-sm">{car.mileage.toLocaleString()}</div>
                          <div className="text-xs">Miles</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900 text-xs md:text-sm">{car.fuelType}</div>
                          <div className="text-xs">Fuel</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900 text-xs md:text-sm">{car.transmission}</div>
                          <div className="text-xs">Trans.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              No featured cars available at the moment
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 md:mb-12 text-center">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 md:gap-4">
            {['Sedan', 'SUV', 'Truck', 'Coupe', 'Convertible', 'Van', 'Hatchback', 'Wagon'].map((category) => (
              <Link
                key={category}
                href={`/cars?category=${category.toLowerCase()}`}
                className="bg-indigo-50 hover:bg-indigo-100 rounded-lg p-4 md:p-6 text-center transition"
              >
                <div className="text-2xl md:text-3xl mb-2">🚗</div>
                <p className="font-semibold text-gray-900 text-xs md:text-sm">{category}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">Can't Find What You're Looking For?</h2>
          <p className="text-indigo-100 mb-6 md:mb-8 text-sm md:text-lg">
            Contact us and let our team help you find the perfect vehicle
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center flex-wrap">
            <Link
              href="/cars"
              className="bg-white text-indigo-600 px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold hover:bg-gray-100 transition text-sm md:text-base"
            >
              Browse All Vehicles
            </Link>
            <Link
              href="/contact"
              className="bg-indigo-700 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold hover:bg-indigo-800 transition border border-indigo-400 text-sm md:text-base"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            <div>
              <h3 className="text-white font-bold mb-3 md:mb-4">CarHub</h3>
              <p className="text-xs md:text-sm">Your trusted source for quality vehicles</p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3 md:mb-4">Browse</h3>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
                <li><Link href="/cars" className="hover:text-white">All Vehicles</Link></li>
                <li><Link href="/cars?category=sedan" className="hover:text-white">Sedans</Link></li>
                <li><Link href="/cars?category=suv" className="hover:text-white">SUVs</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3 md:mb-4">Company</h3>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3 md:mb-4">Legal</h3>
              <ul className="space-y-1 md:space-y-2 text-xs md:text-sm">
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 md:pt-8 text-center text-xs md:text-sm">
            <p>&copy; 2026 CarHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

