'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { createInspectionCheckoutSession } from '@/app/actions/payments';

const DATES = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i + 1); // Start from tomorrow
  return d;
});

const TIME_SLOTS = [
  '09:00 AM', '10:30 AM', '12:00 PM', 
  '02:00 PM', '03:30 PM', '05:00 PM'
];

export default function BookInspectionPage({ params }: { params: { listingId: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both a date and a time slot.');
      return;
    }

    if (!user) {
      setError('You must be logged in.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await createInspectionCheckoutSession(
        user.id,
        params.listingId,
        selectedDate.toISOString(),
        selectedTime,
        5000 // PKR 5,000 fee
      );
      
      if (result.success && result.url) {
        router.push(result.url); // Redirect to mock checkout
      } else {
        setError(result.message || 'Failed to initiate checkout.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '48px 0' }}>
      <div className="container" style={{ maxWidth: 600 }}>
        
        <div style={{ background: '#fff', borderRadius: 16, padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
          <h1 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#111827', marginBottom: 8, textAlign: 'center' }}>Book Your Inspection</h1>
          <p style={{ color: '#6b7280', fontSize: '.95rem', textAlign: 'center', marginBottom: 32 }}>Select a suitable time for our Autofy inspector to evaluate your car.</p>

          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: 8, marginBottom: 24, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#374151', marginBottom: 16 }}>1. Select Date</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
              {DATES.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDate(d)}
                  style={{
                    padding: '16px 12px',
                    borderRadius: 12,
                    border: selectedDate?.toDateString() === d.toDateString() ? '2px solid #1b3a6b' : '1px solid #e5e7eb',
                    background: selectedDate?.toDateString() === d.toDateString() ? '#f0f4f8' : '#fff',
                    textAlign: 'center',
                    transition: 'all .2s'
                  }}
                >
                  <div style={{ fontSize: '.8rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>
                    {d.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', marginTop: 4 }}>
                    {d.getDate()}
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#6b7280' }}>
                    {d.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#374151', marginBottom: 16 }}>2. Select Time</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {TIME_SLOTS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTime(t)}
                  style={{
                    padding: '12px',
                    borderRadius: 8,
                    border: selectedTime === t ? '2px solid #1b3a6b' : '1px solid #e5e7eb',
                    background: selectedTime === t ? '#1b3a6b' : '#fff',
                    color: selectedTime === t ? '#fff' : '#374151',
                    fontWeight: 600,
                    fontSize: '.9rem',
                    transition: 'all .2s'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '24px', background: '#f8fafc', borderRadius: 12, marginBottom: 24, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Inspection Fee</span>
            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.25rem' }}>PKR 5,000</span>
          </div>

          <button 
            onClick={handleBook} 
            disabled={loading} 
            className="btn-primary" 
            style={{ width: '100%', padding: 16, fontSize: '1.1rem', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? 'Processing...' : 'Proceed to Payment 💳'}
          </button>
        </div>
      </div>
    </div>
  );
}
