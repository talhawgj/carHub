'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import Link from 'next/link';

export default function UserDashboard() {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      if (!user) return;
      
      try {
        const supabase = getSupabaseClient();
        
        // Fetch seller's listings along with make and model names
        const { data, error } = await supabase
          .from('listings')
          .select(`
            *,
            makes ( name ),
            models ( name )
          `)
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setListings(data || []);
      } catch (error) {
        console.error('Failed to fetch listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const activeCount = listings.filter(l => l.status === 'active').length;
  const pendingCount = listings.filter(l => l.status === 'pending_inspection').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Garage</h1>
        <p className="text-gray-600 mt-1">Manage your vehicles and track their auction status.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Listings</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{listings.length}</p>
            </div>
            <div className="text-4xl">🚗</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Auctions</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{activeCount}</p>
            </div>
            <div className="text-4xl">🟢</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Inspection</p>
              <p className="text-3xl font-bold text-orange-500 mt-1">{pendingCount}</p>
            </div>
            <div className="text-4xl">⏱️</div>
          </div>
        </div>
      </div>

      {/* Listings List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Your Vehicles</h2>
          <Link href="/sell-your-car" className="bg-[#e8612c] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#d05322] transition">
            + List New Car
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🚘</div>
            <h3 className="text-lg font-bold text-gray-900">No cars in your garage yet</h3>
            <p className="text-gray-500 mt-2 mb-6">List your first car to get started with CarMandi auctions.</p>
            <Link href="/sell-your-car" className="bg-[#1b3a6b] text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-800 transition">
              List Your Car
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const makeName = listing.makes?.name || 'Unknown Make';
              const modelName = listing.models?.name || 'Unknown Model';
              
              let statusColor = 'bg-gray-100 text-gray-800';
              let statusText = listing.status.replace('_', ' ').toUpperCase();
              
              if (listing.status === 'active') statusColor = 'bg-green-100 text-green-800';
              if (listing.status === 'pending_inspection') statusColor = 'bg-orange-100 text-orange-800';
              if (listing.status === 'draft') statusColor = 'bg-gray-100 text-gray-600';

              return (
                <div key={listing.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-300 transition gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
                      🚗
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">
                        {listing.year} {makeName} {modelName} {listing.variant}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        City: {listing.city} • Demand: PKR {listing.demand_price?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor} self-start md:self-end`}>
                      {statusText}
                    </span>
                    
                    {listing.status === 'draft' && (
                      <Link href={`/car-inspection/book/${listing.id}`} className="text-sm text-[#e8612c] font-bold hover:underline">
                        Book Inspection Now →
                      </Link>
                    )}
                    {listing.status === 'active' && (
                      <Link href={`/auctions/${listing.slug}`} className="text-sm text-[#1b3a6b] font-bold hover:underline">
                        View Live Auction →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
