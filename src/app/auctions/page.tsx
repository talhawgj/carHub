'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { getSupabaseClient } from '@/lib/supabase';

export default function AuctionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [auctions, setAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters state
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState('ending_soon');

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('auctions')
          .select(`
            *,
            listings!inner (
              year,
              variant,
              city,
              slug,
              makes ( name ),
              models ( name )
            )
          `)
          .eq('status', 'active');

        if (error) throw error;
        
        const formatted = data.map(a => ({
          id: a.id,
          slug: a.listings.slug,
          make: a.listings.makes?.name,
          model: a.listings.models?.name,
          year: a.listings.year,
          variant: a.listings.variant,
          city: a.listings.city,
          currentBid: a.current_highest_bid,
          bidCount: a.bid_count,
          endsAt: a.ends_at,
          isInspected: true,
          image: null
        }));
        
        setAuctions(formatted);
      } catch (err) {
        console.error('Failed to fetch active auctions', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuctions();
  }, []);

  // Filter and sort logic
  const filteredAuctions = auctions.filter(a => {
    const matchesSearch = `${a.make} ${a.model} ${a.variant} ${a.year}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMake = selectedMake ? a.make?.toLowerCase() === selectedMake.toLowerCase() : true;
    const matchesCity = selectedCity ? a.city?.toLowerCase() === selectedCity.toLowerCase() : true;
    return matchesSearch && matchesMake && matchesCity;
  }).sort((a, b) => {
    if (sortBy === 'ending_soon') return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
    if (sortBy === 'newest') return new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime(); // Rough approx for MVP
    if (sortBy === 'price_asc') return a.currentBid - b.currentBid;
    if (sortBy === 'price_desc') return b.currentBid - a.currentBid;
    return 0;
  });

function AuctionTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const target = new Date(endsAt).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('Ended');
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
  }, [endsAt]);

  const isEndingSoon = timeLeft !== 'Ended' && timeLeft.includes('0d 0h');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isEndingSoon ? '#dc2626' : '#4b5563', fontWeight: 600, fontSize: '.85rem' }}>
      ⏱️ {timeLeft}
    </div>
  );
}

function AuctionCard({ auction }: { auction: any }) {
  return (
    <Link href={`/auctions/${auction.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div className="car-card" style={{ height: '100%', position: 'relative' }}>
        <div style={{ position: 'relative', height: 200, background: '#e5e7eb', overflow: 'hidden' }}>
          {auction.image ? (
            <img src={auction.image} alt={auction.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#9ca3af' }}>🚗</div>
          )}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
            <span className="badge badge-orange">Live Auction</span>
            {auction.isInspected && <span className="badge badge-green">Autofy Inspected</span>}
          </div>
        </div>
        <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 4 }}>
            {auction.year} {auction.make} {auction.model}
          </h3>
          <p style={{ fontSize: '.8rem', color: '#6b7280', marginBottom: 12 }}>{auction.city} • {auction.variant}</p>
          
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <div>
                <p style={{ fontSize: '.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>Current Bid</p>
                <p style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1b3a6b' }}>
                  PKR {(auction.currentBid || 0).toLocaleString()}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '.75rem', color: '#6b7280', fontWeight: 600 }}>{auction.bidCount || 0} Bids</p>
              </div>
            </div>
            <div style={{ background: '#f3f4f6', padding: '8px 12px', borderRadius: 8, marginTop: 8 }}>
              <AuctionTimer endsAt={auction.endsAt} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}


  return (
    <div style={{ background: '#f9fafb', minHeight: '100vh', padding: '32px 0 64px' }}>
      <div className="container" style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        
        {/* Sidebar Filters */}
        <aside style={{ width: 280, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,.04)', flexShrink: 0, position: 'sticky', top: 24 }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#111827', marginBottom: 20 }}>Filters</h2>
          
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Search Keyword</label>
            <input 
              type="text" 
              placeholder="e.g. Civic RS"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Make</label>
            <select className="form-select" value={selectedMake} onChange={e => setSelectedMake(e.target.value)}>
              <option value="">All Makes</option>
              {Array.from(new Set(auctions.map(a => a.make).filter(Boolean))).map((make: any) => (
                <option key={make} value={make}>{make}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>City</label>
            <select className="form-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
              <option value="">All Cities</option>
              {Array.from(new Set(auctions.map(a => a.city).filter(Boolean))).map((city: any) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <button className="btn-primary" style={{ width: '100%' }} onClick={() => {
            setSearchTerm('');
            setSelectedMake('');
            setSelectedCity('');
          }}>Reset Filters</button>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#111827' }}>Active Auctions</h1>
              <p style={{ color: '#6b7280', fontSize: '.95rem' }}>{filteredAuctions.length} vehicles currently available for bidding</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '.85rem', color: '#6b7280', fontWeight: 600 }}>Sort by:</span>
              <select className="form-select" style={{ width: 'auto', padding: '8px 16px', background: '#fff' }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="ending_soon">Ending Soonest</option>
                <option value="newest">Newly Listed</option>
                <option value="price_asc">Lowest Bid</option>
                <option value="price_desc">Highest Bid</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {loading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading live auctions...</div>
            ) : filteredAuctions.map(auction => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>

          {!loading && filteredAuctions.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '64px 24px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚗</div>
              <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', marginBottom: 8 }}>No auctions found</h3>
              <p style={{ color: '#6b7280', fontSize: '.95rem' }}>Try adjusting your filters or search terms.</p>
              <button className="btn-outline" onClick={() => setSearchTerm('')} style={{ marginTop: 24 }}>Clear Filters</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
