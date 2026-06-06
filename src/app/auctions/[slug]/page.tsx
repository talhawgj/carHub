'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { getSupabaseClient } from '@/lib/supabase';
import { placeBid } from '@/app/actions/bid';
import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// DYNAMIC METADATA FOR SEO
// ==========================================
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { data } = await supabase
    .from('auctions')
    .select(`
      listings!inner (
        year, variant,
        makes (name), models (name)
      )
    `)
    .eq('listings.slug', params.slug)
    .single();

  if (!data) {
    return { title: 'Auction Not Found | CarMandi' };
  }

  const listing: any = data.listings;
  const makeName = listing.makes?.name || '';
  const modelName = listing.models?.name || '';
  const title = `${listing.year} ${makeName} ${modelName} ${listing.variant} | CarMandi Auctions`;
  const image = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1000&auto=format&fit=crop';

  return {
    title,
    description: `Bid on this live ${title} auction on CarMandi. Get certified used cars with 200+ point inspection reports.`,
    openGraph: {
      title,
      description: `Bid on this live ${title} auction on CarMandi.`,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: `Bid on this live ${title} auction on CarMandi.`,
      images: [image],
    }
  };
}

export default function AuctionDetailPage({ params }: { params: { slug: string } }) {
  const [auction, setAuction] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState('');
  const [isBidding, setIsBidding] = useState(false);

  // Fetch auction data
  useEffect(() => {
    const fetchAuctionData = async () => {
      try {
        const supabase = getSupabaseClient();
        
        // 1. Fetch Auction + Listing
        const { data: aucData, error: aucError } = await supabase
          .from('auctions')
          .select(`
            *,
            listings!inner (
              id, year, variant, city, description, slug, mileage, engine_cc, transmission,
              makes ( name ),
              models ( name )
            )
          `)
          .eq('listings.slug', params.slug)
          .single();

        if (aucError) throw aucError;
        
        // Transform
        const formattedAuction = {
          id: aucData.id,
          listing_id: aucData.listings.id,
          slug: aucData.listings.slug,
          make: aucData.listings.makes?.name,
          model: aucData.listings.models?.name,
          year: aucData.listings.year,
          variant: aucData.listings.variant,
          city: aucData.listings.city,
          registration: aucData.listings.city, // fallback for MVP
          color: 'Standard', // fallback for MVP
          mileage: aucData.listings.mileage || 0,
          engine: `${aucData.listings.engine_cc || 0}cc`,
          transmission: aucData.listings.transmission || 'Auto',
          currentBid: aucData.current_highest_bid || 0,
          minBidIncrement: 50000,
          endsAt: aucData.ends_at,
          isInspected: true,
          inspectionScore: 9.0, // Mock for MVP
          images: [
            'https://images.unsplash.com/photo-1606611013016-969c19ba27bb?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=1200',
            'https://images.unsplash.com/photo-1550529599-73fbcc4ec436?auto=format&fit=crop&q=80&w=1200'
          ],
          description: aucData.listings.description || 'No description provided.',
        };
        
        setAuction(formattedAuction);
        setBidAmount(formattedAuction.currentBid + formattedAuction.minBidIncrement);

        // 2. Fetch Initial Bids
        const { data: bidsData } = await supabase
          .from('bids')
          .select('*')
          .eq('auction_id', aucData.id)
          .order('amount', { ascending: false });
          
        if (bidsData) {
          const formattedBids = bidsData.map(b => ({
            id: b.id,
            bidder: `Bidder ${b.bidder_id.substring(0, 4).toUpperCase()}`,
            amount: b.amount,
            time: new Date(b.placed_at).toLocaleString()
          }));
          setBids(formattedBids);
        }

      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuctionData();
  }, [params.slug]);

  // Set up Supabase Realtime for live bids
  useEffect(() => {
    const supabase = getSupabaseClient();
    
    // Subscribe to INSERT events on the 'bids' table for this specific auction
      const channel = supabase.channel(`auction-${auction.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'bids',
            filter: `auction_id=eq.${auction.id}`,
          },
        (payload) => {
          // Received a new bid!
          const newBid = payload.new;
          setAuction(prev => ({
            ...prev,
            currentBid: newBid.amount,
          }));
          setBids(prev => [
            { id: newBid.id, bidder: 'Anonymous User', amount: newBid.amount, time: 'Just now' },
            ...prev
          ]);
          setBidAmount(newBid.amount + auction.minBidIncrement);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [auction?.id]);

  useEffect(() => {
    if (!auction) return;
    const target = new Date(auction.endsAt).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('Auction Ended');
        clearInterval(interval);
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [auction?.endsAt]);

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in to place a bid.');
      return;
    }
    if (bidAmount < auction.currentBid + auction.minBidIncrement) {
      alert(`Minimum bid is PKR ${(auction.currentBid + auction.minBidIncrement).toLocaleString()}`);
      return;
    }

    setIsBidding(true);
    
    // Call our Server Action
    const result = await placeBid(auction.id.toString(), user.id, bidAmount);
    
    if (result.success) {
      // The Supabase Realtime channel will automatically pick up the new bid and update the UI!
      // But for the mock UI to feel responsive if DB isn't hooked up:
      setAuction(prev => ({ ...prev, currentBid: bidAmount }));
      setBids(prev => [{ id: Date.now(), bidder: user.user_metadata?.full_name || 'You', amount: bidAmount, time: 'Just now' }, ...prev]);
      setBidAmount(bidAmount + auction.minBidIncrement);
    } else {
      alert(result.message);
    }
    
    setIsBidding(false);
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>Loading auction details...</div>;
  }

  if (!auction) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>Auction not found</div>;
  }

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '32px 0 64px' }}>
      <div className="container">
        {/* Header Breadcrumbs */}
        <div style={{ marginBottom: 24, fontSize: '.85rem', color: '#6b7280', display: 'flex', gap: 8 }}>
          <span style={{ cursor: 'pointer' }}>Home</span> / <span style={{ cursor: 'pointer' }}>Auctions</span> / <span style={{ color: '#111827', fontWeight: 600 }}>{auction.year} {auction.make} {auction.model}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
          
          {/* Left Column - Gallery & Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Gallery */}
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
              <div style={{ position: 'relative', height: 480, background: '#000' }}>
                <img src={auction.images[activeImage]} alt={auction.model} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
                  <span className="badge badge-orange">Live Auction</span>
                  <span className="badge badge-green">Autofy Inspected</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, padding: 16, overflowX: 'auto' }}>
                {auction.images.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveImage(i)}
                    style={{ width: 80, height: 60, flexShrink: 0, borderRadius: 8, overflow: 'hidden', border: activeImage === i ? '2px solid #e8612c' : '2px solid transparent', padding: 0 }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Key Specs */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
              <h1 style={{ fontWeight: 800, fontSize: '2rem', color: '#111827', marginBottom: 8 }}>
                {auction.year} {auction.make} {auction.model} {auction.variant}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '1rem', marginBottom: 24 }}>Registered in {auction.registration} • {auction.city}</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, borderTop: '1px solid #f3f4f6', paddingTop: 24 }}>
                <div>
                  <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: 4 }}>Mileage</p>
                  <p style={{ fontWeight: 700, color: '#111827' }}>{(auction.mileage).toLocaleString()} km</p>
                </div>
                <div>
                  <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: 4 }}>Engine</p>
                  <p style={{ fontWeight: 700, color: '#111827' }}>{auction.engine}</p>
                </div>
                <div>
                  <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: 4 }}>Transmission</p>
                  <p style={{ fontWeight: 700, color: '#111827' }}>{auction.transmission}</p>
                </div>
                <div>
                  <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: 4 }}>Color</p>
                  <p style={{ fontWeight: 700, color: '#111827' }}>{auction.color}</p>
                </div>
              </div>
            </div>

            {/* Inspection Summary */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111827' }}>Autofy Inspection Report</h2>
                <div style={{ background: '#ecfdf5', color: '#059669', padding: '6px 12px', borderRadius: 999, fontWeight: 700, fontSize: '.9rem' }}>
                  Score: {auction.inspectionScore}/10
                </div>
              </div>
              <p style={{ fontSize: '.95rem', color: '#4b5563', lineHeight: 1.6, marginBottom: 20 }}>
                This vehicle has passed our rigorous 200+ point inspection. The engine, transmission, and suspension are in excellent condition. Minor scratches on the rear bumper.
              </p>
              <button className="btn-outline" style={{ width: '100%' }}>View Full Inspection Report</button>
            </div>

            {/* Description */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111827', marginBottom: 16 }}>Seller's Description</h2>
              <p style={{ fontSize: '.95rem', color: '#4b5563', lineHeight: 1.6 }}>{auction.description}</p>
            </div>

          </div>

          {/* Right Column - Bidding Box */}
          <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Bid Box */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 10px 25px rgba(0,0,0,.08)', border: '2px solid #1b3a6b' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: '.85rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700, marginBottom: 4 }}>Current Highest Bid</p>
                <div style={{ fontWeight: 800, fontSize: '2.5rem', color: '#1b3a6b' }}>
                  PKR {(auction.currentBid).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                <div style={{ background: '#fef2f2', color: '#dc2626', padding: '8px 16px', borderRadius: 8, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>⏳ Ends In:</span>
                  <span>{timeLeft}</span>
                </div>
              </div>

              <form onSubmit={handleBid}>
                <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Your Max Bid (PKR)</label>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    min={auction.currentBid + auction.minBidIncrement}
                    step={10000}
                    style={{ fontSize: '1.1rem', fontWeight: 700, padding: '16px', paddingLeft: 48 }}
                  />
                  <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#9ca3af' }}>Rs</span>
                </div>
                
                <button type="submit" disabled={isBidding} className="btn-orange" style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 800, opacity: isBidding ? 0.7 : 1 }}>
                  {isBidding ? 'Placing Bid...' : 'Place Bid'}
                </button>
                <p style={{ textAlign: 'center', fontSize: '.75rem', color: '#6b7280', marginTop: 12 }}>
                  By bidding, you agree to the CarMandi Auction Terms. Minimum increment: PKR {(auction.minBidIncrement).toLocaleString()}
                </p>
              </form>
            </div>

            {/* Bid History */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827', marginBottom: 16 }}>Bid History ({bids.length})</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {bids.map((bid, i) => (
                  <div key={bid.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, borderBottom: i < bids.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#374151', fontSize: '.9rem' }}>{bid.bidder}</div>
                      <div style={{ color: '#9ca3af', fontSize: '.75rem' }}>{bid.time}</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#1b3a6b' }}>PKR {bid.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
