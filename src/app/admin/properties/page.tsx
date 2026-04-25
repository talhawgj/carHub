'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { normalizeCarsFromDb } from '@/lib/carTransform';
import { getSupabaseClient } from '@/lib/supabase';
import PropertyFilter from '@/components/PropertyFilter';
import type { Car, FilterOptions } from '@/types';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Car[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Car[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const router = useRouter();

  // Load properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        const normalized = normalizeCarsFromDb(data);
        setProperties(normalized);
        setFilteredProperties(normalized);
      } catch (error) {
        console.error('Failed to fetch properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...properties];

    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(search) ||
          p.make?.toLowerCase().includes(search) ||
          p.model?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }

    if (filters.minPrice) {
      filtered = filtered.filter((p) => p.price >= filters.minPrice!);
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
    }

    if (filters.year) {
      filtered = filtered.filter((p) => p.year === filters.year);
    }

    if (filters.make) {
      filtered = filtered.filter(
        (p) => p.make?.toLowerCase() === filters.make?.toLowerCase()
      );
    }

    if (filters.condition) {
      filtered = filtered.filter((p) => p.condition === filters.condition);
    }

    if (filters.fuelType) {
      filtered = filtered.filter((p) => p.fuelType === filters.fuelType);
    }

    // Sort
    if (filters.sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (filters.sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredProperties(filtered);
  }, [filters, properties]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;

    setDeleteLoading(id);
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('cars').delete().eq('id', id);

      if (error) throw error;

      setProperties(properties.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Failed to delete property:', error);
      alert('Failed to delete property');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-gray-600 mt-1">
            {filteredProperties.length} of {properties.length} vehicles
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        >
          ➕ Add Vehicle
        </Link>
      </div>

      {/* Filter */}
      <PropertyFilter onFilterChange={setFilters} />

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 text-lg">No properties found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
            >
              {/* Image */}
              {property.images && property.images.length > 0 && (
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-white rounded-full px-3 py-1 text-sm font-semibold">
                    {property.is_available ? '✅ Available' : '❌ Sold'}
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {property.year} {property.make} {property.model}
                  </h3>
                  <p className="text-sm text-gray-600">{property.title}</p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-indigo-600">
                    Rs. {property.price.toLocaleString()}
                  </span>
                  {property.mileage && (
                    <span className="text-sm text-gray-600">
                      {property.mileage.toLocaleString()} miles
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {property.condition && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {property.condition}
                    </span>
                  )}
                  {property.fuelType && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {property.fuelType}
                    </span>
                  )}
                  {property.transmission && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {property.transmission}
                    </span>
                  )}
                </div>

                {property.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {property.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <Link
                    href={`/admin/properties/${property.id}/edit`}
                    className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-2 px-3 rounded text-center text-sm transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(property.id)}
                    disabled={deleteLoading === property.id}
                    className="flex-1 bg-red-100 hover:bg-red-200 disabled:bg-red-50 text-red-700 font-semibold py-2 px-3 rounded text-sm transition"
                  >
                    {deleteLoading === property.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
