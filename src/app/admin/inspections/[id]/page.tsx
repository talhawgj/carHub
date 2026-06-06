'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { publishAuction } from '@/app/actions/admin';
import { uploadImage } from '@/app/actions/upload';

export default function ReviewInspectionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [score, setScore] = useState<number>(90);
  const [durationDays, setDurationDays] = useState<number>(3);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>(''); // For uploaded state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('inspections')
          .select(`
            *,
            listings (
              *,
              makes ( name ),
              models ( name )
            )
          `)
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setInspection(data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [params.id]);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let finalPhotoUrls = [
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop'
      ];

      // Handle real file upload if provided
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await uploadImage(formData);
        if (uploadRes.success) {
          finalPhotoUrls = [uploadRes.url]; // Replace mock with real
          setPhotoUrl(uploadRes.url);
        } else {
          throw new Error(uploadRes.message || 'Image upload failed');
        }
      }
      
      const result = await publishAuction(
        inspection.id,
        inspection.listings.id,
        score,
        durationDays,
        finalPhotoUrls
      );

      if (result.success) {
        alert('Auction published successfully!');
        router.push('/admin/inspections');
      } else {
        setError(result.message || 'Failed to publish');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!inspection || !inspection.listings) {
    return <div className="text-center py-12 text-gray-500">Inspection not found.</div>;
  }

  const listing = inspection.listings;
  const carName = `${listing.year} ${listing.makes?.name} ${listing.models?.name} ${listing.variant || ''}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-900 text-sm font-bold">
          ← Back to List
        </button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review & Publish</h1>
        <p className="text-gray-600 mt-1">Finalize the Autofy inspection for <strong className="text-gray-900">{carName}</strong>.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg font-semibold text-sm border border-red-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">Listing Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Seller ID</span>
                <span className="font-mono text-gray-900 truncate block">{listing.seller_id}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">City</span>
                <span className="font-medium text-gray-900">{listing.city}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Demand Price</span>
                <span className="font-bold text-indigo-600">PKR {listing.demand_price?.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Reserve Price (Hidden)</span>
                <span className="font-bold text-red-500">PKR {listing.reserve_price?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Action Form */}
        <div className="md:col-span-2">
          <form onSubmit={handlePublish} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="font-bold text-gray-900 border-b border-gray-100 pb-3">Inspection Report & Auction Settings</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Autofy Score (out of 100)</label>
                <input 
                  type="number" 
                  min="0" max="100"
                  value={score}
                  onChange={e => setScore(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Auction Duration</label>
                <select 
                  value={durationDays}
                  onChange={e => setDurationDays(parseInt(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                >
                  <option value={3}>3 Days (Express)</option>
                  <option value={7}>7 Days (Standard)</option>
                  <option value={14}>14 Days (Extended)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Upload Hero Image (Real Supabase Storage)</label>
              <input 
                type="file"
                accept="image/*"
                onChange={e => e.target.files && setPhotoFile(e.target.files[0])}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to use the default stock image.</p>
              {photoUrl && (
                <div className="mt-2 text-xs text-green-600 font-semibold truncate">Uploaded: {photoUrl}</div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100">
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-[#e8612c] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#d05322] transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Publishing...
                  </>
                ) : (
                  'Approve & Publish Auction'
                )}
              </button>
              <p className="text-center text-xs text-gray-500 mt-3">
                This will immediately push the car live to the public `/auctions` page and start the countdown timer.
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
