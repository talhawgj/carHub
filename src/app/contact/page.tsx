'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'contact' | 'sell'>('contact');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      const supabase = getSupabaseClient();
      const subject = activeTab === 'sell' ? `[Sell Car] ${formData.subject}` : formData.subject;
      const { error } = await supabase.from('contact_inquiries').insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: subject,
          message: formData.message,
        },
      ]);

      if (error) throw error;
      setStatus('success');
      setMessage(activeTab === 'sell' ? 'Thank you! Our team will contact you shortly to evaluate your car.' : 'Thank you for contacting us! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      console.error('Error sending message:', err);
      setStatus('error');
      setMessage('Error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', paddingBottom: 64 }}>
      {/* Header */}
      <div style={{ background: '#1b3a6b', color: '#fff', padding: '40px 0', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: 8 }}>
            Get in Touch
          </h1>
          <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
            Whether you want to buy, sell, or just ask a question, our team is here to help.
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, maxWidth: 900 }}>
        
        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 32 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,.06)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>📞</div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 8 }}>Call Us</h3>
            <p style={{ color: '#6b7280', fontSize: '.85rem', marginBottom: 12 }}>Mon-Sat: 9am - 6pm</p>
            <p style={{ color: '#e8612c', fontWeight: 800, fontSize: '1.2rem' }}>+92 300 1234567</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,.06)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>📍</div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 8 }}>Visit Us</h3>
            <p style={{ color: '#6b7280', fontSize: '.85rem', lineHeight: 1.6 }}>Chaudhary Motors Dealership<br/>Gulberg III, Lahore<br/>Pakistan</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,.06)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 12 }}>✉️</div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 8 }}>Email Us</h3>
            <p style={{ color: '#6b7280', fontSize: '.85rem', marginBottom: 4 }}>General Inquiries</p>
            <p style={{ color: '#1b3a6b', fontWeight: 700, fontSize: '.95rem' }}>info@chaudharymotors.pk</p>
          </div>
        </div>

        {/* Main Form */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb' }}>
            <button 
              onClick={() => setActiveTab('contact')}
              style={{ flex: 1, padding: 16, fontWeight: 700, fontSize: '1rem', color: activeTab === 'contact' ? '#1b3a6b' : '#6b7280', background: activeTab === 'contact' ? '#fff' : '#f9fafb', borderBottom: activeTab === 'contact' ? '3px solid #e8612c' : '3px solid transparent' }}>
              General Inquiry
            </button>
            <button 
              onClick={() => setActiveTab('sell')}
              style={{ flex: 1, padding: 16, fontWeight: 700, fontSize: '1rem', color: activeTab === 'sell' ? '#1b3a6b' : '#6b7280', background: activeTab === 'sell' ? '#fff' : '#f9fafb', borderBottom: activeTab === 'sell' ? '3px solid #e8612c' : '3px solid transparent' }}>
              Sell Your Car
            </button>
          </div>

          <div style={{ padding: '32px 24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: 6 }}>
              {activeTab === 'sell' ? 'Tell us about your car' : 'Send us a message'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '.9rem', marginBottom: 24 }}>
              {activeTab === 'sell' ? 'Provide some basic details and we will evaluate your vehicle for the best price.' : 'Fill out the form below and our team will get back to you shortly.'}
            </p>

            {status === 'success' && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: 16, borderRadius: 10, fontWeight: 600, marginBottom: 20 }}>
                ✅ {message}
              </div>
            )}
            {status === 'error' && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: 16, borderRadius: 10, fontWeight: 600, marginBottom: 20 }}>
                ❌ {message}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Full Name *</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleChange} className="form-input" placeholder="John Doe" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="form-input" placeholder="john@example.com" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Phone *</label>
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="form-input" placeholder="0300 1234567" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>Subject *</label>
                  <input type="text" name="subject" required value={formData.subject} onChange={handleChange} className="form-input" placeholder={activeTab === 'sell' ? 'e.g. 2019 Toyota Corolla' : 'How can we help?'} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  {activeTab === 'sell' ? 'Car Details (Mileage, Condition, etc.) *' : 'Message *'}
                </label>
                <textarea name="message" required rows={5} value={formData.message} onChange={handleChange} className="form-input" style={{ resize: 'vertical' }} placeholder={activeTab === 'sell' ? 'Provide more details about the car you want to sell...' : 'Write your message here...'} />
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8, padding: 14, fontSize: '1rem', width: '100%', background: '#1b3a6b' }}>
                {loading ? 'Sending...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
