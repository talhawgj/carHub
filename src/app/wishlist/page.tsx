'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { normalizeCarsFromDb } from '@/lib/carTransform';
import { getSupabaseClient } from '@/lib/supabase';
import type { Car } from '@/types';

function CarCard({ car, onRemove }: { car: Car, onRemove: (id: string) => void }) {
  const img = car.images?.[car.primary_image_index || 0];
  
  return (
    <Link href={`/cars/${car.id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div className="car-card" style={{ height: '100%' }}>
        {/* Image */}
        <div style={{ position: 'relative', height: 185, background: '#e5e7eb', overflow: 'hidden' }}>
          {img ? (
            <img src={img} alt={`${car.year} ${car.make} ${car.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#9ca3af' }}>🚗</div>
          )}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5 }}>
            {car.tags?.includes('Featured') && <span className="badge badge-orange">Featured</span>}
          </div>
          <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(car.id); }} style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', boxShadow: '0 2px 6px rgba(0,0,0,.15)', color: '#dc2626' }}>
            🗑️
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 700, fontSize: '.95rem', color: '#111827', marginBottom: 6 }}>
            {car.year} {car.make} {car.model}
          </h3>
          {/* Specs row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, padding: '6px 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '.72rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>
              📏 {car.mileage ? `${(car.mileage/1000).toFixed(0)}k km` : '—'}
            </div>
            <div style={{ fontSize: '.72rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>
              ⛽ {car.fuelType || '—'}
            </div>
            <div style={{ fontSize: '.72rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>
              ⚙️ {car.transmission?.charAt(0).toUpperCase()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1b3a6b' }}>
              Rs. {car.price.toLocaleString()}
            </span>
            <span style={{ fontSize: '.72rem', background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 999, fontWeight: 600, textTransform: 'capitalize' }}>
              {car.condition}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function WishlistPage() {
  const [wishlistCars, setWishlistCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistCars = async () => {
      try {
        const wishlistIds = JSON.parse(localStorage.getItem('wishlist') || '[]');

        if (wishlistIds.length === 0) {
          setWishlistCars([]);
          setLoading(false);
          return;
        }

        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('cars')
          .select('*')
          .in('id', wishlistIds);

        if (error) throw error;
        setWishlistCars(normalizeCarsFromDb(data));
      } catch (err) {
        console.error('Error fetching wishlist cars:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistCars();
  }, []);

  const removeFromWishlist = (carId: string) => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const updated = wishlist.filter((id: string) => id !== carId);
    localStorage.setItem('wishlist', JSON.stringify(updated));
    setWishlistCars(wishlistCars.filter((car) => car.id !== carId));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ background: '#1b3a6b', color: '#fff', padding: '28px 0' }}>
        <div className="container">
          <Link href="/cars" style={{ color: 'rgba(255,255,255,.7)', fontSize: '.85rem', display: 'inline-block', marginBottom: 12 }}>
            ← Back to Cars
          </Link>
          <h1 style={{ fontWeight: 800, fontSize: '1.6rem' }}>Saved Vehicles</h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.875rem', marginTop: 4 }}>
            {loading ? 'Loading...' : `${wishlistCars.length} vehicle(s) saved`}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : wishlistCars.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {wishlistCars.map((car) => (
              <CarCard key={car.id} car={car} onRemove={removeFromWishlist} />
            ))}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, padding: '48px 24px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)', maxWidth: 500, margin: '0 auto' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>❤️</div>
            <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', marginBottom: 8 }}>No Saved Vehicles</h2>
            <p style={{ color: '#6b7280', fontSize: '.9rem', marginBottom: 24 }}>You haven't added any vehicles to your wishlist yet.</p>
            <Link href="/cars" className="btn-orange">
              Browse Vehicles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
