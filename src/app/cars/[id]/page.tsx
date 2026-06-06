'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { normalizeCarFromDb, normalizeCarsFromDb } from '@/lib/carTransform';
import { getSupabaseClient } from '@/lib/supabase';
import type { Car } from '@/types';

const SpecItem = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 12px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
    <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: '.72rem', color: '#6b7280', marginBottom: 2 }}>{label}</div>
    <div style={{ fontWeight: 700, fontSize: '.9rem', color: '#111827', textTransform: 'capitalize' }}>{value}</div>
  </div>
);

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params.id as string;
  const [car, setCar] = useState<Car | null>(null);
  const [similarCars, setSimilarCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error: fetchError } = await supabase.from('cars').select('*').eq('id', carId).single();
        if (fetchError) throw fetchError;
        const carData = normalizeCarFromDb(data);
        setCar(carData);
        setCurrentImageIndex(carData.primary_image_index || 0);
        // Fetch similar
        const { data: similar } = await supabase.from('cars').select('*').eq('make', carData.make).neq('id', carId).limit(3);
        if (similar) setSimilarCars(normalizeCarsFromDb(similar));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsInWishlist(wishlist.includes(carId));
  }, [carId]);

  const toggleWishlist = () => {
    const wl: string[] = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const updated = isInWishlist ? wl.filter(id => id !== carId) : [...wl, carId];
    localStorage.setItem('wishlist', JSON.stringify(updated));
    setIsInWishlist(!isInWishlist);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMessage(true);
    try {
      const supabase = getSupabaseClient();
      const subject = car ? `Inquiry about ${car.year} ${car.make} ${car.model}` : 'Vehicle inquiry';
      const { error } = await supabase.from('contact_inquiries').insert([{ car_id: carId, name: contactForm.name, email: contactForm.email, phone: contactForm.phone, subject, message: contactForm.message }]);
      if (error) throw error;
      setMessageStatus('success');
      setContactForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setShowContactForm(false), 2000);
    } catch (err) {
      setMessageStatus('error');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div className="spinner" />
        <p style={{ color: '#6b7280' }}>Loading vehicle details...</p>
      </div>
    );
  }

  if (!car) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: '3rem' }}>🚫</div>
        <p style={{ color: '#374151', fontWeight: 600 }}>Vehicle not found</p>
        <Link href="/cars" style={{ color: '#e8612c', fontWeight: 600 }}>← Back to Cars</Link>
      </div>
    );
  }

  const images = car.images || [];
  const currentImage = images[currentImageIndex] || '';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#1b3a6b', padding: '12px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '.82rem', color: 'rgba(255,255,255,.7)' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,.7)' }}>Home</Link>
          <span>›</span>
          <Link href="/cars" style={{ color: 'rgba(255,255,255,.7)' }}>Cars</Link>
          <span>›</span>
          <span style={{ color: '#e8612c' }}>{car.year} {car.make} {car.model}</span>
        </div>
      </div>

      <div className="container" style={{ padding: '24px 1.5rem 48px' }}>
        <div style={{ display: 'grid', gap: 24 }} className="detail-layout">

          {/* LEFT — Gallery + Details */}
          <div style={{ minWidth: 0 }}>
            {/* Main image */}
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.08)', marginBottom: 8 }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', background: '#e5e7eb', overflow: 'hidden' }}>
                {currentImage ? (
                  <img src={currentImage} alt={`${car.year} ${car.make} ${car.model}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem', color: '#9ca3af' }}>🚗</div>
                )}
                {/* Badges */}
                <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
                  {car.tags?.includes('Featured') && <span className="badge badge-orange">Featured</span>}
                  {car.condition === 'new' && <span className="badge badge-navy">New</span>}
                </div>
                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImageIndex(i => (i - 1 + images.length) % images.length)}
                      style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>‹</button>
                    <button onClick={() => setCurrentImageIndex(i => (i + 1) % images.length)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }}>›</button>
                  </>
                )}
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 8, padding: '10px 12px', overflowX: 'auto' }}>
                  {images.map((img, idx) => (
                    <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                      style={{ flexShrink: 0, width: 72, height: 54, borderRadius: 8, overflow: 'hidden', border: `2.5px solid ${idx === currentImageIndex ? '#1b3a6b' : '#e5e7eb'}`, transition: 'border-color .2s' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Key Specs Grid */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827', marginBottom: 14 }}>Key Specifications</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                <SpecItem icon="📅" label="Year" value={String(car.year)} />
                <SpecItem icon="📏" label="Mileage" value={car.mileage ? `${car.mileage.toLocaleString()} km` : 'N/A'} />
                <SpecItem icon="⛽" label="Fuel" value={car.fuelType || 'N/A'} />
                <SpecItem icon="⚙️" label="Transmission" value={car.transmission || 'N/A'} />
                <SpecItem icon="🎨" label="Color" value={car.color || 'N/A'} />
                <SpecItem icon="🚗" label="Condition" value={car.condition || 'N/A'} />
                {car.specs?.engine_size && <SpecItem icon="🔧" label="Engine" value={car.specs.engine_size} />}
                {car.specs?.seats && <SpecItem icon="💺" label="Seats" value={String(car.specs.seats)} />}
              </div>
            </div>

            {/* Description */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827', marginBottom: 12 }}>About This Vehicle</h2>
              <p style={{ color: '#4b5563', lineHeight: 1.8, fontSize: '.9rem' }}>{car.description}</p>
            </div>

            {/* Additional Specs */}
            {car.specs && Object.keys(car.specs).length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.06)', marginBottom: 20 }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827', marginBottom: 14 }}>Technical Specifications</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid #f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
                  {[
                    { k: 'Horsepower', v: car.specs.horsepower ? `${car.specs.horsepower} hp` : null },
                    { k: 'Engine Size', v: car.specs.engine_size },
                    { k: 'Doors', v: car.specs.doors },
                    { k: 'Seats', v: car.specs.seats },
                    { k: 'Top Speed', v: car.specs.top_speed ? `${car.specs.top_speed} km/h` : null },
                    { k: 'Fuel Efficiency', v: car.specs.mpg ? `${car.specs.mpg} km/l` : null },
                    { k: 'Acceleration', v: car.specs.acceleration },
                    { k: 'Trunk Capacity', v: car.specs.trunk_capacity },
                  ].filter(item => item.v).map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <span style={{ fontSize: '.85rem', color: '#6b7280' }}>{item.k}</span>
                      <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#111827' }}>{String(item.v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Similar Cars */}
            {similarCars.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111827', marginBottom: 14 }}>Similar {car.make} Vehicles</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  {similarCars.map(sc => (
                    <Link key={sc.id} href={`/cars/${sc.id}`} style={{ display: 'block', background: '#f9fafb', borderRadius: 10, overflow: 'hidden', border: '1px solid #f3f4f6', textDecoration: 'none', transition: 'box-shadow .2s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,.1)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}>
                      <div style={{ height: 110, background: '#e5e7eb', overflow: 'hidden' }}>
                        {sc.images?.[0] && <img src={sc.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <div style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 700, fontSize: '.82rem', color: '#111827' }}>{sc.year} {sc.make} {sc.model}</div>
                        <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#1b3a6b', marginTop: 4 }}>Rs. {sc.price.toLocaleString()}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Sticky Sidebar */}
          <div>
            <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,.08)', position: 'sticky', top: 80 }}>
              {/* Title + Price */}
              <h1 style={{ fontWeight: 800, fontSize: '1.25rem', color: '#111827', marginBottom: 6 }}>
                {car.year} {car.make} {car.model}
              </h1>
              {car.category && (
                <span style={{ display: 'inline-block', background: '#f3f4f6', color: '#374151', fontSize: '.75rem', fontWeight: 600, padding: '3px 10px', borderRadius: 999, textTransform: 'capitalize', marginBottom: 14 }}>
                  {car.category}
                </span>
              )}
              <div style={{ fontWeight: 900, fontSize: '1.8rem', color: '#e8612c', marginBottom: 20 }}>
                Rs. {car.price.toLocaleString()}
              </div>

              {/* Quick specs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f3f4f6' }}>
                {[
                  { icon: '📅', label: 'Year', val: car.year },
                  { icon: '📏', label: 'Km', val: car.mileage ? `${(car.mileage/1000).toFixed(0)}k` : '—' },
                  { icon: '⛽', label: 'Fuel', val: car.fuelType || '—' },
                  { icon: '⚙️', label: 'Trans.', val: car.transmission?.[0]?.toUpperCase() || '—' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: 8, padding: '10px', textAlign: 'center', border: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: '1rem' }}>{s.icon}</div>
                    <div style={{ fontSize: '.7rem', color: '#6b7280' }}>{s.label}</div>
                    <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#111827' }}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => setShowContactForm(true)}
                  style={{ background: '#1b3a6b', color: '#fff', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: '.95rem', transition: 'background .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#112649')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#1b3a6b')}>
                  📞 Contact Seller
                </button>
                <a href={`https://wa.me/923001234567?text=I'm interested in the ${car.year} ${car.make} ${car.model} listed at Rs. ${car.price.toLocaleString()}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', background: '#25d366', color: '#fff', padding: '14px', borderRadius: 10, fontWeight: 700, fontSize: '.95rem', textAlign: 'center', textDecoration: 'none' }}>
                  💬 WhatsApp
                </a>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button onClick={toggleWishlist}
                    style={{ padding: '10px', borderRadius: 10, fontWeight: 600, fontSize: '.85rem', border: `2px solid ${isInWishlist ? '#e8612c' : '#e5e7eb'}`, background: isInWishlist ? '#fff5f0' : '#fff', color: isInWishlist ? '#e8612c' : '#374151', transition: 'all .2s' }}>
                    {isInWishlist ? '❤️ Saved' : '🤍 Save'}
                  </button>
                  <button onClick={() => router.push(`/compare?cars=${carId}`)}
                    style={{ padding: '10px', borderRadius: 10, fontWeight: 600, fontSize: '.85rem', border: '2px solid #e5e7eb', background: '#fff', color: '#374151', transition: 'all .2s' }}
                    onMouseEnter={e => { (e.currentTarget.style.borderColor = '#1b3a6b'); (e.currentTarget.style.color = '#1b3a6b'); }}
                    onMouseLeave={e => { (e.currentTarget.style.borderColor = '#e5e7eb'); (e.currentTarget.style.color = '#374151'); }}>
                    ⚖️ Compare
                  </button>
                </div>
              </div>

              {/* Location */}
              <div style={{ marginTop: 18, padding: '12px', background: '#f9fafb', borderRadius: 10, fontSize: '.82rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                📍 <span>Lahore, Punjab, Pakistan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ background: 'linear-gradient(135deg, #1b3a6b, #2a5298)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>Contact Seller</h3>
                <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.82rem', marginTop: 2 }}>We'll respond as soon as possible</p>
              </div>
              <button onClick={() => setShowContactForm(false)} style={{ color: 'rgba(255,255,255,.8)', fontSize: '1.3rem', width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <form onSubmit={handleContactSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Your Name', key: 'name', type: 'text', placeholder: 'John Doe', required: true },
                { label: 'Email Address', key: 'email', type: 'email', placeholder: 'john@example.com', required: true },
                { label: 'Phone Number (Optional)', key: 'phone', type: 'tel', placeholder: '+92 300 1234567', required: false },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>{f.label}</label>
                  <input className="form-input" type={f.type} placeholder={f.placeholder} required={f.required}
                    value={contactForm[f.key as keyof typeof contactForm]}
                    onChange={e => setContactForm({ ...contactForm, [f.key]: e.target.value })} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Message</label>
                <textarea className="form-input" rows={3} required placeholder={`I'm interested in this ${car.year} ${car.make} ${car.model}...`}
                  value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                  style={{ resize: 'none' }} />
              </div>
              {messageStatus === 'success' && <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: '.85rem', fontWeight: 600 }}>✅ Message sent successfully!</div>}
              {messageStatus === 'error' && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: '.85rem', fontWeight: 600 }}>❌ Error sending. Please try again.</div>}
              <button type="submit" disabled={sendingMessage}
                style={{ background: '#1b3a6b', color: '#fff', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: '.95rem', opacity: sendingMessage ? .7 : 1 }}>
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .detail-layout { grid-template-columns: 1fr 340px !important; }
        @media (max-width: 900px) {
          .detail-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
