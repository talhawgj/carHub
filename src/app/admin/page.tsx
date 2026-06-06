'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    pendingInspections: 0,
    activeAuctions: 0,
    totalBids: 0,
    completedAuctions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const supabase = getSupabaseClient();

        // Pending Inspections
        const { count: pendingInspections } = await supabase
          .from('inspections')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'scheduled');

        // Active Auctions
        const { count: activeAuctions } = await supabase
          .from('auctions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Total Bids
        const { count: totalBids } = await supabase
          .from('bids')
          .select('*', { count: 'exact', head: true });

        // Completed Auctions
        const { count: completedAuctions } = await supabase
          .from('auctions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'closed');

        setStats({
          pendingInspections: pendingInspections || 0,
          activeAuctions: activeAuctions || 0,
          totalBids: totalBids || 0,
          completedAuctions: completedAuctions || 0,
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
        <h1 className="text-3xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-600 mt-1">CarMandi high-level metrics and health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Inspections</p>
              <p className="text-3xl font-black text-orange-500 mt-1">
                {stats.pendingInspections}
              </p>
            </div>
            <div className="text-4xl opacity-80">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Active Auctions</p>
              <p className="text-3xl font-black text-green-500 mt-1">
                {stats.activeAuctions}
              </p>
            </div>
            <div className="text-4xl opacity-80">🟢</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Bids Placed</p>
              <p className="text-3xl font-black text-indigo-600 mt-1">
                {stats.totalBids}
              </p>
            </div>
            <div className="text-4xl opacity-80">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Completed Auctions</p>
              <p className="text-3xl font-black text-gray-900 mt-1">
                {stats.completedAuctions}
              </p>
            </div>
            <div className="text-4xl opacity-80">🏁</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex gap-4">
          <a href="/admin/inspections" className="px-6 py-3 bg-[#1b3a6b] text-white rounded-lg font-bold hover:bg-indigo-800 transition shadow-sm">
            Review Pending Inspections
          </a>
        </div>
      </div>
    </div>
  );
}
