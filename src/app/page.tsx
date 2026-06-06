'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';
import type { Car } from '@/types';

// Mock data for UI development before hooking up to DB
const BRANDS = [
  { name: 'Toyota', logo: 'https://cdn.worldvectorlogo.com/logos/toyota-2.svg' },
  { name: 'Honda', logo: 'https://cdn.worldvectorlogo.com/logos/honda-5.svg' },
  { name: 'Suzuki', logo: 'https://cdn.worldvectorlogo.com/logos/suzuki.svg' },
  { name: 'Hyundai', logo: 'https://cdn.worldvectorlogo.com/logos/hyundai-1.svg' },
  { name: 'KIA', logo: 'https://cdn.worldvectorlogo.com/logos/kia-motors-1.svg' },
  { name: 'Changan', logo: 'https://cdn.worldvectorlogo.com/logos/changan.svg' },
  { name: 'Haval', logo: 'https://cdn.worldvectorlogo.com/logos/haval.svg' },
  { name: 'MG', logo: 'https://cdn.worldvectorlogo.com/logos/mg-motor-1.svg' },
  { name: 'Mercedes-Benz', logo: 'https://cdn.worldvectorlogo.com/logos/mercedes-benz-9.svg' },
  { name: 'Audi', logo: 'https://cdn.worldvectorlogo.com/logos/audi-13.svg' },
];

const PRICE_RANGES = [
  { label: 'Under 10 Lacs', min: 0, max: 1000000 },
  { label: '10 - 20 Lacs', min: 1000000, max: 2000000 },
  { label: '20 - 40 Lacs', min: 2000000, max: 4000000 },
  { label: '40 - 80 Lacs', min: 4000000, max: 8000000 },
  { label: '80+ Lacs', min: 8000000, max: 999999999 },
];

const STATS = [
  { value: '14-Day', label: 'Live Auctions' },
  { value: '200+', label: 'Point Inspections' },
  { value: '10+', label: 'Top Brands' },
  { value: '100%', label: 'Verified Bidders' },
];

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

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [liveAuctions, setLiveAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          .eq('status', 'active')
          .order('ends_at', { ascending: true })
          .limit(4);

        if (error) throw error;
        
        // Transform data for the AuctionCard
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
          isInspected: true, // If it's active, it was inspected
          image: null // We'll hook up real images later
        }));
        
        setLiveAuctions(formatted);
      } catch (err) {
        console.error('Failed to fetch active auctions', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuctions();
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ===== HERO ===== */}
      <section style={{ background: 'linear-gradient(135deg, #1b3a6b 0%, #112649 60%, #0d1f3c 100%)', color: '#fff', padding: '64px 0 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(232,97,44,.08)', pointerEvents: 'none' }} />
        
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-block', background: 'rgba(232,97,44,.2)', color: '#e8612c', fontWeight: 700, fontSize: '.78rem', padding: '5px 14px', borderRadius: 999, marginBottom: 16, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Pakistan's First Online Car Auction Marketplace
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 16 }}>
              Transparent Bidding.<br /> <span style={{ color: '#e8612c' }}>Verified Cars.</span>
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,.75)', maxWidth: 600, margin: '0 auto' }}>
              Replace unreliable classified ads with our 14-day live auction platform, fully backed by Autofy's 200+ point inspection.
            </p>
          </div>

          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 10, background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(10px)', borderRadius: 14, padding: 8 }}>
              <input
                type="text"
                placeholder="Search by make, model, or keyword..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 1, background: '#fff', border: 'none', borderRadius: 9, padding: '16px 20px', fontSize: '1rem', color: '#111827', outline: 'none' }}
              />
              <Link href={`/auctions?search=${encodeURIComponent(searchTerm)}`} className="btn-orange" style={{ padding: '16px 32px', borderRadius: 9, fontSize: '1rem', fontWeight: 700 }}>
                Search Auctions
              </Link>
            </div>
            
            <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '.85rem', alignSelf: 'center' }}>Popular:</span>
              {['Civic', 'Corolla', 'Sportage', 'Alto'].map(q => (
                <Link key={q} href={`/auctions?search=${encodeURIComponent(q)}`} style={{ background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.9)', fontSize: '.85rem', padding: '4px 12px', borderRadius: 999, transition: 'background .2s', textDecoration: 'none' }}>
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section style={{ background: '#e8612c' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', padding: '24px 1.5rem' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', color: '#fff', borderRight: i < 3 ? '1px solid rgba(255,255,255,.3)' : 'none' }}>
              <div style={{ fontWeight: 800, fontSize: 'clamp(1.2rem, 3vw, 1.8rem)' }}>{s.value}</div>
              <div style={{ fontSize: '.8rem', opacity: .9, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURED LIVE AUCTIONS ===== */}
      <section style={{ padding: '64px 0', background: '#f9fafb' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', background: '#e8612c', animation: 'pulse 2s infinite' }} />
                <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#111827' }}>Live Auctions</h2>
              </div>
              <p style={{ color: '#6b7280', fontSize: '.9rem' }}>Bid on verified vehicles before time runs out</p>
            </div>
            <Link href="/auctions" className="btn-outline">View All Auctions</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {loading ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading live auctions...</div>
            ) : liveAuctions.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: '#6b7280', background: '#fff', borderRadius: 16 }}>
                No active auctions at the moment. Check back soon!
              </div>
            ) : (
              liveAuctions.map(auction => (
                <AuctionCard key={auction.id} auction={auction} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* ===== BRAND GRID ===== */}
      <section style={{ padding: '64px 0', background: '#fff' }}>
        <div className="container">
          <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#111827', marginBottom: 32, textAlign: 'center' }}>Browse by Make</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 16 }}>
            {BRANDS.map(b => (
              <Link key={b.name} href={`/auctions/${b.name.toLowerCase()}-cars-for-sale`} style={{
                background: '#fff', borderRadius: 16, padding: '24px 12px', textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,.04)', border: '1px solid #e5e7eb',
                transition: 'all .2s', display: 'block', textDecoration: 'none',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1b3a6b'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 25px rgba(0,0,0,.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(0,0,0,.04)'; }}
              >
                <div style={{ height: 48, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={b.logo} alt={`${b.name} logo`} style={{ maxHeight: '100%', maxWidth: '80%', objectFit: 'contain' }} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#374151' }}>{b.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICE RANGES ===== */}
      <section style={{ padding: '64px 0', background: '#f9fafb' }}>
        <div className="container">
          <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#111827', marginBottom: 32, textAlign: 'center' }}>Browse by Price</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {PRICE_RANGES.map((range, i) => (
              <Link key={i} href={`/auctions?min_price=${range.min}&max_price=${range.max}`} style={{
                background: '#fff', borderRadius: 12, padding: '24px', textAlign: 'center',
                border: '1px solid #e5e7eb', textDecoration: 'none', transition: 'border-color .2s'
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = '#e8612c'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'}
              >
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1b3a6b' }}>{range.label}</div>
                <div style={{ fontSize: '.8rem', color: '#6b7280', marginTop: 8 }}>View Auctions →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(232, 97, 44, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(232, 97, 44, 0); }
          100% { box-shadow: 0 0 0 0 rgba(232, 97, 44, 0); }
        }
      `}} />
    </div>
  );
}
