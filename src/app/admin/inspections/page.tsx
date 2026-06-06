'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminInspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInspections = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // Fetch inspections that are scheduled, along with their related listings
        const { data, error } = await supabase
          .from('inspections')
          .select(`
            *,
            listings (
              id,
              year,
              variant,
              city,
              makes ( name ),
              models ( name )
            )
          `)
          .eq('status', 'scheduled')
          .order('scheduled_at', { ascending: true });

        if (error) throw error;
        setInspections(data || []);
      } catch (error) {
        console.error('Failed to fetch inspections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInspections();
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
        <h1 className="text-3xl font-bold text-gray-900">Pending Inspections</h1>
        <p className="text-gray-600 mt-1">Review cars booked for Autofy evaluation and publish them to the auction block.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {inspections.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-gray-900">No Pending Inspections</h3>
            <p className="text-gray-500 mt-2">All scheduled inspections have been completed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <th className="px-6 py-4 font-medium">Vehicle</th>
                  <th className="px-6 py-4 font-medium">City</th>
                  <th className="px-6 py-4 font-medium">Scheduled For</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inspections.map((inspection) => {
                  const listing = inspection.listings;
                  if (!listing) return null;
                  
                  const makeName = listing.makes?.name || 'Unknown';
                  const modelName = listing.models?.name || 'Unknown';
                  
                  return (
                    <tr key={inspection.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{listing.year} {makeName} {modelName}</div>
                        <div className="text-xs text-gray-500">{listing.variant || 'Standard'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{listing.city}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(inspection.scheduled_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(inspection.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {inspection.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/admin/inspections/${inspection.id}`}
                          className="text-sm font-bold text-[#e8612c] hover:text-[#d05322] hover:underline"
                        >
                          Review & Publish →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
