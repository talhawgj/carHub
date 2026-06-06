'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { normalizeCarsFromDb } from '@/lib/carTransform';
import { getSupabaseClient } from '@/lib/supabase';
import type { Car } from '@/types';

export function ComparePageContent() {
  const searchParams = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCars, setSelectedCars] = useState<string[]>(
    searchParams.get('cars')?.split(',') || []
  );
  const [availableCars, setAvailableCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active auctions
  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('auctions')
          .select(`
            id,
            slug,
            current_highest_bid,
            listing:listings (
              id,
              year,
              condition,
              mileage,
              fuel_type,
              transmission,
              category,
              color,
              specs,
              photos,
              makes (name),
              models (name)
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform auction data into the "Car" interface expected by the UI
        const mappedAuctions = data.map((a: any) => {
          const l = a.listing;
          return {
            id: a.id,
            slug: a.slug,
            make: l.makes?.name || 'Unknown',
            model: l.models?.name || 'Unknown',
            year: l.year,
            price: a.current_highest_bid || 0,
            images: l.photos || [],
            condition: l.condition,
            mileage: l.mileage,
            fuelType: l.fuel_type,
            transmission: l.transmission,
            category: l.category,
            color: l.color,
            specs: typeof l.specs === 'string' ? JSON.parse(l.specs) : (l.specs || {})
          };
        });

        setAvailableCars(mappedAuctions);

        // Load selected cars
        if (selectedCars.length > 0) {
          const selected = mappedAuctions.filter((car: any) => selectedCars.includes(car.id));
          setCars(selected);
        } else {
          setCars([]);
        }
      } catch (err) {
        console.error('Error fetching auctions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, [selectedCars]);

  const toggleCarSelection = (carId: string) => {
    setSelectedCars((prev) => {
      if (prev.includes(carId)) {
        return prev.filter((id) => id !== carId);
      } else if (prev.length < 3) {
        return [...prev, carId];
      }
      return prev;
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', paddingBottom: 64 }}>
      {/* Header */}
      <div style={{ background: '#1b3a6b', color: '#fff', padding: '28px 0' }}>
        <div className="container">
          <Link href="/auctions" style={{ color: 'rgba(255,255,255,.7)', fontSize: '.85rem', display: 'inline-block', marginBottom: 12 }}>
            ← Back to Auctions
          </Link>
          <h1 style={{ fontWeight: 800, fontSize: '1.6rem' }}>Compare Vehicles</h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.875rem', marginTop: 4 }}>
            Select up to 3 cars to compare side by side
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32 }}>
        {/* Car Selection */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,.06)', marginBottom: 32 }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827', marginBottom: 16 }}>
            Add Cars to Compare ({selectedCars.length}/3)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
            {availableCars.map((car) => {
              const isSelected = selectedCars.includes(car.id);
              return (
                <button
                  key={car.id}
                  onClick={() => toggleCarSelection(car.id)}
                  disabled={!isSelected && selectedCars.length >= 3}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, textAlign: 'left',
                    border: isSelected ? '2px solid #e8612c' : '2px solid #e5e7eb',
                    background: isSelected ? '#fff5f0' : '#fff',
                    opacity: (!isSelected && selectedCars.length >= 3) ? 0.5 : 1,
                    cursor: (!isSelected && selectedCars.length >= 3) ? 'not-allowed' : 'pointer',
                    transition: 'all .2s'
                  }}
                >
                  <div style={{ width: 64, height: 64, borderRadius: 8, background: '#e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
                    {car.images?.[0] && <img src={car.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {car.year} {car.make} {car.model}
                    </h3>
                    <p style={{ fontSize: '.8rem', color: '#6b7280', marginTop: 2 }}>Rs. {car.price.toLocaleString()}</p>
                    {isSelected && <span style={{ fontSize: '.7rem', color: '#e8612c', fontWeight: 700, marginTop: 4, display: 'block' }}>✓ Selected</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison Table */}
        {cars.length > 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.06)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <tbody>
                  {/* Images */}
                  <tr>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: '#374151', background: '#f9fafb', width: 140, borderBottom: '1px solid #e5e7eb' }}>Vehicle</td>
                    {cars.map((car) => (
                      <td key={car.id} style={{ padding: 16, borderBottom: '1px solid #e5e7eb', minWidth: 250, verticalAlign: 'top' }}>
                        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 10, background: '#e5e7eb', overflow: 'hidden', marginBottom: 12 }}>
                          {car.images?.[0] && <img src={car.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                        </div>
                        <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#111827' }}>{car.year} {car.make} {car.model}</h3>
                        <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#e8612c', marginTop: 4 }}>Rs. {car.price.toLocaleString()}</div>
                      </td>
                    ))}
                  </tr>

                  {/* Specs Map */}
                  {[
                    { label: 'Condition', render: (c: Car) => c.condition, capitalize: true },
                    { label: 'Mileage', render: (c: Car) => c.mileage ? `${c.mileage.toLocaleString()} km` : '—' },
                    { label: 'Fuel Type', render: (c: Car) => c.fuelType || '—', capitalize: true },
                    { label: 'Transmission', render: (c: Car) => c.transmission || '—', capitalize: true },
                    { label: 'Body Type', render: (c: Car) => c.category || '—', capitalize: true },
                    { label: 'Color', render: (c: Car) => c.color || '—', capitalize: true },
                    { label: 'Horsepower', render: (c: Car) => c.specs?.horsepower ? `${c.specs.horsepower} hp` : '—' },
                    { label: 'Engine Size', render: (c: Car) => c.specs?.engine_size || '—' },
                    { label: 'Doors', render: (c: Car) => c.specs?.doors || '—' },
                    { label: 'Seats', render: (c: Car) => c.specs?.seats || '—' },
                    { label: 'Acceleration', render: (c: Car) => c.specs?.acceleration || '—' },
                    { label: 'Top Speed', render: (c: Car) => c.specs?.top_speed ? `${c.specs.top_speed} km/h` : '—' },
                  ].map((row, i) => {
                    const rowHasData = cars.some(c => row.render(c) !== '—');
                    if (!rowHasData) return null;
                    return (
                      <tr key={row.label} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 600, color: '#4b5563', fontSize: '.85rem', borderBottom: '1px solid #f3f4f6' }}>{row.label}</td>
                        {cars.map(c => (
                          <td key={c.id} style={{ padding: '16px', color: '#111827', fontSize: '.9rem', fontWeight: 500, borderBottom: '1px solid #f3f4f6', textTransform: row.capitalize ? 'capitalize' : 'none' }}>
                            {row.render(c)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}

                  {/* View Details Buttons */}
                  <tr>
                    <td style={{ padding: '20px', background: '#f9fafb' }}></td>
                    {cars.map((car: any) => (
                      <td key={car.id} style={{ padding: '20px' }}>
                        <Link href={`/auctions/${car.slug}`} className="btn-primary" style={{ display: 'block', textAlign: 'center', background: '#1b3a6b' }}>
                          View Live Auction
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, padding: '60px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚖️</div>
            <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', marginBottom: 8 }}>No Cars Selected</h2>
            <p style={{ color: '#6b7280' }}>Select cars from the list above to compare them side by side.</p>
          </div>
        )}
      </div>
    </div>
  );
}
