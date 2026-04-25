'use client';

import { useEffect, useState } from 'react';
import { normalizeCarsFromDb } from '@/lib/carTransform';
import { getSupabaseClient } from '@/lib/supabase';
import type { Car } from '@/types';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    availableProperties: 0,
    totalValue: 0,
    recentProperties: [] as Car[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = getSupabaseClient();

        // Get all cars
        const { data: cars, error } = await supabase
          .from('cars')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        const allCars = normalizeCarsFromDb(cars);
        const available = allCars.filter((c) => c.is_available).length;
        const totalValue = allCars.reduce((sum, c) => sum + (c.price || 0), 0);

        setStats({
          totalProperties: allCars.length,
          availableProperties: available,
          totalValue,
          recentProperties: allCars,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to Vehicle Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Vehicles</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.totalProperties}
              </p>
            </div>
            <div className="text-4xl">🚗</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Available</p>
              <p className="text-3xl font-bold text-green-600 mt-1">
                {stats.availableProperties}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Value</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">
                Rs. {(stats.totalValue / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>
      </div>

      {/* Recent Vehicles */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Vehicles</h2>
        {stats.recentProperties.length === 0 ? (
          <p className="text-gray-600">No Vehicles yet</p>
        ) : (
          <div className="space-y-3">
            {stats.recentProperties.map((property) => (
              <div
                key={property.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{property.title}</h3>
                  <p className="text-sm text-gray-600">
                    {property.year} {property.make} {property.model}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">Rs. {property.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">
                    {property.is_available ? '✅ Available' : '❌ Sold'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
