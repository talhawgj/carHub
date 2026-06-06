'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { normalizeCarsFromDb } from '@/lib/carTransform';
import { getSupabaseClient } from '@/lib/supabase';
import type { Car } from '@/types';

const CATEGORIES = ['hatchback', 'sedan', 'suv', 'crossover', 'van', 'coupe', 'convertible', 'truck', 'wagon'];
const CONDITIONS = ['new', 'used', 'refurbished'];
const FUEL_TYPES = ['gasoline', 'diesel', 'hybrid', 'electric'];
const TRANSMISSIONS = ['automatic', 'manual'];
const YEARS = Array.from({ length: 20 }, (_, i) => 2024 - i);

function CarCard({ car }: { car: Car }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    const wl = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setSaved(wl.includes(car.id));
  }, [car.id]);
  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const wl: string[] = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const updated = saved ? wl.filter(id => id !== car.id) : [...wl, car.id];
    localStorage.setItem('wishlist', JSON.stringify(updated));
    setSaved(!saved);
  };
  const img = car.images?.[car.primary_image_index || 0];
  return (
    <Link href={`/cars/${car.id}`} style={{ display: 'block' }}>
      <div className="car-card" style={{ height: '100%' }}>
        <div style={{ position: 'relative', height: 185, background: '#e5e7eb', overflow: 'hidden' }}>
          {img ? (
            <img src={img} alt={`${car.year} ${car.make} ${car.model}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#9ca3af' }}>🚗</div>
          )}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 5 }}>
            {car.tags?.includes('Featured') && <span className="badge badge-orange">Featured</span>}
            {car.condition === 'new' && <span className="badge badge-navy">New</span>}
          </div>
          <button onClick={toggleSave} style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', boxShadow: '0 2px 6px rgba(0,0,0,.15)' }}>
            {saved ? '❤️' : '🤍'}
          </button>
        </div>
        <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontWeight: 700, fontSize: '.95rem', color: '#111827', marginBottom: 6 }}>{car.year} {car.make} {car.model}</h3>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10, padding: '6px 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '.72rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>📏 {car.mileage ? `${(car.mileage/1000).toFixed(0)}k km` : '—'}</div>
            <div style={{ fontSize: '.72rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>⛽ {car.fuelType || '—'}</div>
            <div style={{ fontSize: '.72rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 3 }}>⚙️ {car.transmission?.charAt(0).toUpperCase()}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1b3a6b' }}>Rs. {car.price.toLocaleString()}</span>
            <span style={{ fontSize: '.72rem', background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 999, fontWeight: 600, textTransform: 'capitalize' }}>{car.condition}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function CarsPageContent() {
  const searchParams = useSearchParams();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [condition, setCondition] = useState(searchParams.get('condition') || '');
  const [transmission, setTransmission] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from('cars').select('*').eq('is_available', true).order('created_at', { ascending: false });
        if (error) throw error;
        setCars(normalizeCarsFromDb(data));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  useEffect(() => {
    let f = [...cars];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      f = f.filter(c => c.title?.toLowerCase().includes(t) || c.make.toLowerCase().includes(t) || c.model.toLowerCase().includes(t) || c.description.toLowerCase().includes(t));
    }
    if (category) f = f.filter(c => c.category === category);
    if (condition) f = f.filter(c => c.condition === condition);
    if (transmission) f = f.filter(c => c.transmission === transmission);
    if (fuelType) f = f.filter(c => c.fuelType === fuelType);
    if (minPrice) f = f.filter(c => c.price >= parseFloat(minPrice));
    if (maxPrice) f = f.filter(c => c.price <= parseFloat(maxPrice));
    if (minYear) f = f.filter(c => c.year >= parseInt(minYear));
    if (maxYear) f = f.filter(c => c.year <= parseInt(maxYear));
    if (sortBy === 'price-low') f.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-high') f.sort((a, b) => b.price - a.price);
    else if (sortBy === 'year-new') f.sort((a, b) => b.year - a.year);
    else if (sortBy === 'year-old') f.sort((a, b) => a.year - b.year);
    else f.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setFilteredCars(f);
  }, [cars, searchTerm, category, condition, transmission, fuelType, minPrice, maxPrice, minYear, maxYear, sortBy]);

  const clearAll = () => {
    setSearchTerm(''); setCategory(''); setCondition(''); setTransmission('');
    setFuelType(''); setMinPrice(''); setMaxPrice(''); setMinYear(''); setMaxYear(''); setSortBy('newest');
  };

  const FilterSidebar = () => (
    <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827' }}>Filters</h2>
        <button onClick={clearAll} style={{ color: '#e8612c', fontSize: '.8rem', fontWeight: 600 }}>Clear All</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Search</label>
        <input className="form-input" type="text" placeholder="Make, model, keyword..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {/* Category */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Body Type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(category === c ? '' : c)}
              className={`toggle-btn ${category === c ? 'active' : ''}`}
              style={{ fontSize: '.75rem', padding: '4px 10px' }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Condition</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {CONDITIONS.map(c => (
            <button key={c} onClick={() => setCondition(condition === c ? '' : c)}
              className={`toggle-btn ${condition === c ? 'active' : ''}`}
              style={{ fontSize: '.75rem', padding: '4px 10px', flex: 1 }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Transmission</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {TRANSMISSIONS.map(t => (
            <button key={t} onClick={() => setTransmission(transmission === t ? '' : t)}
              className={`toggle-btn ${transmission === t ? 'active' : ''}`}
              style={{ fontSize: '.75rem', padding: '4px 10px', flex: 1 }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Fuel Type */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Fuel Type</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FUEL_TYPES.map(f => (
            <button key={f} onClick={() => setFuelType(fuelType === f ? '' : f)}
              className={`toggle-btn ${fuelType === f ? 'active' : ''}`}
              style={{ fontSize: '.75rem', padding: '4px 10px' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Price Range (Rs.)</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <input className="form-input" type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
          <input className="form-input" type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        </div>
      </div>

      {/* Year Range */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Year Range</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <select className="form-select" value={minYear} onChange={e => setMinYear(e.target.value)}>
            <option value="">From</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="form-select" value={maxYear} onChange={e => setMaxYear(e.target.value)}>
            <option value="">To</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', paddingBottom: 48 }}>
      {/* Page Header */}
      <div style={{ background: '#1b3a6b', color: '#fff', padding: '28px 0' }}>
        <div className="container">
          <h1 style={{ fontWeight: 800, fontSize: '1.6rem' }}>Browse All Vehicles</h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.875rem', marginTop: 4 }}>
            {loading ? 'Loading...' : `${filteredCars.length} vehicles found`}
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24 }}>
        {/* Mobile filter toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={() => setShowFilters(!showFilters)} style={{ background: '#1b3a6b', color: '#fff', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: '.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
            className="mobile-filter-btn">
            🔧 {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: '.85rem', color: '#374151', fontWeight: 600 }}>Sort:</label>
            <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="year-new">Year: Newest First</option>
              <option value="year-old">Year: Oldest First</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }} className="cars-layout">
          {/* Sidebar */}
          <div className="filters-sidebar">
            <FilterSidebar />
          </div>

          {/* Mobile overlay */}
          {showFilters && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'flex-start' }} onClick={() => setShowFilters(false)} className="mobile-filter-overlay">
              <div style={{ background: '#fff', width: '85%', maxWidth: 360, height: '100vh', overflowY: 'auto', padding: 20 }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontWeight: 700 }}>Filters</h2>
                  <button onClick={() => setShowFilters(false)} style={{ color: '#374151', fontSize: '1.2rem' }}>✕</button>
                </div>
                <FilterSidebar />
              </div>
            </div>
          )}

          {/* Grid */}
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ color: '#6b7280', marginTop: 16 }}>Loading vehicles...</p>
              </div>
            ) : filteredCars.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {filteredCars.map(car => <CarCard key={car.id} car={car} />)}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔍</div>
                <p style={{ color: '#374151', fontWeight: 600, marginBottom: 8 }}>No vehicles match your filters</p>
                <button onClick={clearAll} style={{ color: '#e8612c', fontWeight: 600, fontSize: '.875rem' }}>Clear all filters</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .cars-layout { grid-template-columns: 260px 1fr !important; }
        .filters-sidebar { display: block !important; }
        .mobile-filter-btn { display: none !important; }
        .mobile-filter-overlay { display: none !important; }
        @media (max-width: 900px) {
          .cars-layout { grid-template-columns: 1fr !important; }
          .filters-sidebar { display: none !important; }
          .mobile-filter-btn { display: flex !important; }
          .mobile-filter-overlay { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
