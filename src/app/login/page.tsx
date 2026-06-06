'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authContext';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { user, sendPhoneOtp, verifyPhoneOtp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (mounted && user) {
      router.push('/dashboard');
    }
  }, [user, router, mounted]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // In a real implementation with Supabase + Twilio:
      await sendPhoneOtp(phone);
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please check the phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyPhoneOtp(phone, otp);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa', padding: '2rem 1rem' }}>
      <div style={{ background: '#fff', width: '100%', maxWidth: 420, borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,.08)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#1b3a6b', padding: '24px', textAlign: 'center' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: '#e8612c', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="12" viewBox="0 0 22 16" fill="none">
                <path d="M3 10L5.5 4H16.5L19 10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
                <rect x="1" y="10" width="20" height="4" rx="2" fill="#fff"/>
                <circle cx="5" cy="14" r="1.5" fill="#e8612c"/>
                <circle cx="17" cy="14" r="1.5" fill="#e8612c"/>
              </svg>
            </div>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem' }}>CarMandi</span>
          </Link>
          <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '.85rem', marginTop: 8 }}>Sign in to buy or sell your car</p>
        </div>

        {/* Form */}
        <div style={{ padding: '32px 24px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 8, fontSize: '.85rem', fontWeight: 600, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="form-input"
                  placeholder="+92 300 1234567"
                />
                <p style={{ fontSize: '.75rem', color: '#6b7280', marginTop: 6 }}>Format: +92 followed by your 10-digit number</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', marginTop: 8, padding: 12, background: '#1b3a6b', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: '.9rem', color: '#4b5563' }}>Enter the 6-digit code sent to</p>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{phone}</p>
                <button type="button" onClick={() => setStep('phone')} style={{ color: '#e8612c', fontSize: '.85rem', fontWeight: 600, marginTop: 4, textDecoration: 'underline' }}>
                  Change phone number
                </button>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>OTP Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="form-input"
                  placeholder="123456"
                  style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.2rem', fontWeight: 700 }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', marginTop: 8, padding: 12, background: '#1b3a6b', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '.9rem', color: '#4b5563' }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: '#e8612c', fontWeight: 600, textDecoration: 'none' }}>
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
