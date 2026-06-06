'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import Link from 'next/link';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBids = async () => {
      if (!user) return;
      
      try {
        const supabase = getSupabaseClient();
        
        // Fetch user's bids joined with auction and listing details
        const { data, error } = await supabase
          .from('bids')
          .select(`
            id,
            amount,
            created_at,
            auction:auctions (
              id,
              slug,
              status,
              winner_id,
              ends_at,
              listing:listings (
                id,
                year,
                variant,
                makes ( name ),
                models ( name )
              )
            )
          `)
          .eq('bidder_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Group bids by auction so we only show the user's highest bid per auction
        const uniqueAuctionsMap = new Map();
        
        data?.forEach((bid: any) => {
          const auctionId = bid.auction.id;
          if (!uniqueAuctionsMap.has(auctionId)) {
            uniqueAuctionsMap.set(auctionId, bid);
          } else {
            // Keep the higher bid if we somehow fetched an older one first
            const existingBid = uniqueAuctionsMap.get(auctionId);
            if (bid.amount > existingBid.amount) {
              uniqueAuctionsMap.set(auctionId, bid);
            }
          }
        });

        // For each auction, find out if the user is currently the highest bidder
        const uniqueBids = Array.from(uniqueAuctionsMap.values());
        
        // Fetch current highest bid for these auctions
        const enrichedBids = await Promise.all(uniqueBids.map(async (bid: any) => {
          const { data: highestBidData } = await supabase
            .from('bids')
            .select('amount, bidder_id')
            .eq('auction_id', bid.auction.id)
            .order('amount', { ascending: false })
            .limit(1)
            .single();
            
          return {
            ...bid,
            isHighestBidder: highestBidData?.bidder_id === user.id,
            currentAuctionPrice: highestBidData?.amount || bid.amount
          };
        }));

        setBids(enrichedBids);
      } catch (error) {
        console.error('Failed to fetch bids:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const activeBids = bids.filter(b => b.auction.status === 'active');
  const wonAuctions = bids.filter(b => b.auction.status === 'completed' && b.auction.winner_id === user?.id);
  const lostAuctions = bids.filter(b => b.auction.status === 'completed' && b.auction.winner_id !== user?.id);

  return (
    <div className="container py-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your active bids, monitor auctions, and view cars you've won.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Active Bids</p>
              <p className="text-3xl font-bold text-indigo-600 mt-1">{activeBids.length}</p>
            </div>
            <div className="text-4xl">🔥</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Auctions Won</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{wonAuctions.length}</p>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Total Participated</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{bids.length}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Bids */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Active Auctions</h2>
          
          {activeBids.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">You have no active bids.</p>
              <Link href="/auctions" className="text-indigo-600 font-bold hover:underline">
                Browse Live Auctions →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBids.map((bid) => {
                const listing = bid.auction.listing;
                const makeName = listing?.makes?.name || '';
                const modelName = listing?.models?.name || '';
                
                return (
                  <div key={bid.id} className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition">
                    <div className="flex justify-between items-start mb-2">
                      <Link href={`/auctions/${bid.auction.slug}`} className="font-bold text-gray-900 hover:text-indigo-600">
                        {listing.year} {makeName} {modelName} {listing.variant}
                      </Link>
                      {bid.isHighestBidder ? (
                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">Winning</span>
                      ) : (
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded">Outbid</span>
                      )}
                    </div>
                    
                    <div className="flex justify-between text-sm mt-3">
                      <div>
                        <p className="text-gray-500">Your Bid</p>
                        <p className="font-bold text-gray-900">PKR {bid.amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-500">Current Price</p>
                        <p className="font-bold text-indigo-600">PKR {bid.currentAuctionPrice.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Won Auctions */}
        <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Won Auctions</h2>
          
          {wonAuctions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">You haven't won any auctions yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {wonAuctions.map((bid) => {
                const listing = bid.auction.listing;
                const makeName = listing?.makes?.name || '';
                const modelName = listing?.models?.name || '';
                
                return (
                  <div key={bid.id} className="p-4 rounded-lg bg-green-50 border border-green-100">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-green-900">
                        {listing.year} {makeName} {modelName} {listing.variant}
                      </h3>
                      <span className="text-xl">🏆</span>
                    </div>
                    
                    <div className="flex justify-between text-sm mt-3">
                      <div>
                        <p className="text-green-700">Winning Bid</p>
                        <p className="font-bold text-green-900">PKR {bid.amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <Link href={`/auctions/${bid.auction.slug}`} className="text-green-700 font-bold hover:underline">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
