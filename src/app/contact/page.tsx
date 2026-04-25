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
      const { error } = await supabase.from('contact_inquiries').insert([
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject,
          message: formData.message,
        },
      ]);

      if (error) throw error;
      setStatus('success');
      setMessage('Thank you for contacting us! We\'ll get back to you soon.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setStatus('error');
      setMessage('Error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 font-medium text-xs md:text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Contact Us</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Have questions? We'd love to hear from you.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">📞 Call Us</h3>
            <p className="text-gray-600 text-xs md:text-sm mb-1">Monday - Friday: 9am - 6pm</p>
            <p className="text-gray-600 text-xs md:text-sm mb-1">Saturday: 10am - 4pm</p>
            <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4">Sunday: Closed</p>
            <p className="text-indigo-600 font-bold text-base md:text-lg">(555) 123-4567</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">📍 Visit Us</h3>
            <p className="text-gray-600 text-xs md:text-sm">Chaudhary Motors Dealership</p>
            <p className="text-gray-600 text-xs md:text-sm">123 Main Street</p>
            <p className="text-gray-600 text-xs md:text-sm">New York, NY 10001</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">✉️ Email Us</h3>
            <p className="text-gray-600 text-xs md:text-sm mb-1">General inquiries:</p>
            <p className="text-indigo-600 font-semibold text-xs md:text-sm mb-2 md:mb-4">info@chaudharymotors.pk</p>
            <p className="text-gray-600 text-xs md:text-sm mb-1">Sales:</p>
            <p className="text-indigo-600 font-semibold text-xs md:text-sm">sales@chaudharymotors.pk</p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg shadow p-4 md:p-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Send us a Message</h2>

          {status === 'success' && (
            <div className="mb-6 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-semibold text-sm md:text-base">{message}</p>
            </div>
          )}

          {status === 'error' && (
            <div className="mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-semibold text-sm md:text-base">{message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  placeholder="How can we help?"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                placeholder="Tell us more about your inquiry..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white px-6 py-2 md:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 text-sm md:text-base"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>

          <p className="text-xs text-gray-600 mt-4 text-center">
            We typically respond within 24 hours during business days.
          </p>
        </div>
      </div>
    </div>
  );
}
