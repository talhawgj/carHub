'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { createListing } from '@/app/actions/listings';

const MAKES = ['Toyota', 'Honda', 'Suzuki', 'KIA', 'Hyundai', 'MG', 'Changan'];
const YEARS = Array.from({ length: 25 }, (_, i) => new Date().getFullYear() - i);
const CITIES = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Peshawar', 'Multan'];

export default function SellYourCarPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    variant: '',
    city: '',
    description: '',
    demandPrice: '',
    reservePrice: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step === 1 && (!formData.make || !formData.model || !formData.year || !formData.city)) {
      setError('Please fill all required fields');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to list a car');
      router.push('/login');
      return;
    }

    if (!formData.demandPrice || !formData.reservePrice) {
      setError('Please enter your pricing details');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await createListing(formData, user.id);
      
      if (result.success) {
        // Redirect to inspection booking
        router.push(`/car-inspection/book/${result.listingId}`);
      } else {
        setError(result.message || 'Failed to create listing');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100vh', padding: '48px 0' }}>
      <div className="container" style={{ maxWidth: 800 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{ fontWeight: 800, fontSize: '2rem', color: '#111827' }}>Sell Your Car with CarMandi</h1>
          <p style={{ color: '#6b7280', fontSize: '1.05rem', marginTop: 8 }}>Get the best price through our transparent bidding platform</p>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: step >= 1 ? '#1b3a6b' : '#e5e7eb', color: step >= 1 ? '#fff' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>1</div>
            <div style={{ width: 100, height: 4, background: step >= 2 ? '#1b3a6b' : '#e5e7eb' }} />
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: step >= 2 ? '#1b3a6b' : '#e5e7eb', color: step >= 2 ? '#fff' : '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>2</div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '16px', borderRadius: 8, marginBottom: 24, fontWeight: 600 }}>
              {error}
            </div>
          )}

          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.25rem', borderBottom: '1px solid #f3f4f6', paddingBottom: 16 }}>Vehicle Details</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Make <span style={{ color: '#dc2626' }}>*</span></label>
                  <select name="make" value={formData.make} onChange={handleChange} className="form-select" required>
                    <option value="">Select Make</option>
                    {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Model <span style={{ color: '#dc2626' }}>*</span></label>
                  <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="e.g. Civic" className="form-input" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Year <span style={{ color: '#dc2626' }}>*</span></label>
                  <select name="year" value={formData.year} onChange={handleChange} className="form-select" required>
                    <option value="">Select Year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Variant</label>
                  <input type="text" name="variant" value={formData.variant} onChange={handleChange} placeholder="e.g. RS Turbo" className="form-input" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>City <span style={{ color: '#dc2626' }}>*</span></label>
                <select name="city" value={formData.city} onChange={handleChange} className="form-select" required>
                  <option value="">Select City</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Tell us about the condition of your car..." className="form-input" rows={4} />
              </div>

              <button type="button" onClick={handleNext} className="btn-primary" style={{ marginTop: 16 }}>Next Step →</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.25rem', borderBottom: '1px solid #f3f4f6', paddingBottom: 16 }}>Pricing & Valuation</h2>
              
              <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '.9rem', color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>
                  <strong>Reserve Price:</strong> The minimum amount you are willing to accept. If bidding does not reach this amount, you are not obligated to sell. This is hidden from buyers.
                </p>
                <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Reserve Price (PKR) <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="number" name="reservePrice" value={formData.reservePrice} onChange={handleChange} placeholder="e.g. 5000000" className="form-input" required />
              </div>

              <div style={{ background: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '.9rem', color: '#475569', marginBottom: 16, lineHeight: 1.6 }}>
                  <strong>Demand Price:</strong> The asking price shown to buyers on your listing before the auction begins.
                </p>
                <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 8 }}>Demand Price (PKR) <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="number" name="demandPrice" value={formData.demandPrice} onChange={handleChange} placeholder="e.g. 5200000" className="form-input" required />
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                <button type="button" onClick={() => setStep(1)} className="btn-outline" style={{ flex: 1 }}>← Back</button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Submitting...' : 'Submit & Book Inspection'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
