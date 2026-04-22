'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { normalizeCarFromDb } from '@/lib/carTransform';
import { getSupabaseClient } from '@/lib/supabase';
import type { Car } from '@/types';

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const carId = params.id as string;

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Fetch car details
  useEffect(() => {
    const fetchCar = async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error: fetchError } = await supabase
          .from('cars')
          .select('*')
          .eq('id', carId)
          .single();

        if (fetchError) throw fetchError;
        setCar(normalizeCarFromDb(data));
      } catch (err) {
        console.error('Error fetching car:', err);
        setError('Car not found');
      } finally {
        setLoading(false);
      }
    };

    fetchCar();

    // Check wishlist
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsInWishlist(wishlist.includes(carId));
  }, [carId]);

  const toggleWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (isInWishlist) {
      const updated = wishlist.filter((id: string) => id !== carId);
      localStorage.setItem('wishlist', JSON.stringify(updated));
    } else {
      wishlist.push(carId);
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
    setIsInWishlist(!isInWishlist);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingMessage(true);
    setMessageStatus('idle');

    try {
      const supabase = getSupabaseClient();
      const subject = car
        ? `Inquiry about ${car.year} ${car.make} ${car.model}`
        : 'Vehicle inquiry';

      const { error } = await supabase.from('contact_inquiries').insert([
        {
          car_id: carId,
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone,
          subject,
          message: contactForm.message,
        },
      ]);

      if (error) throw error;
      setMessageStatus('success');
      setContactForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setShowContactForm(false), 2000);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessageStatus('error');
    } finally {
      setSendingMessage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="text-gray-600 mt-4">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">{error || 'Car not found'}</p>
          <Link href="/cars" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to Cars
          </Link>
        </div>
      </div>
    );
  }

  const images = car.images || [];
  const primaryImage = images[car.primary_image_index || 0] || '/placeholder-car.jpg';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
          <Link href="/cars" className="text-indigo-600 hover:text-indigo-700 font-medium text-xs md:text-sm">
            ← Back to Cars
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Gallery */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {/* Main Image */}
              <div className="relative bg-gray-200 aspect-video">
                <img
                  src={primaryImage}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  className="w-full h-full object-cover"
                />
                {car.tags && car.tags.length > 0 && (
                  <div className="absolute top-2 left-2 md:top-4 md:left-4 flex gap-2 flex-wrap">
                    {car.tags.map((tag) => (
                      <span key={tag} className="bg-indigo-600 text-white text-xs md:text-sm px-2 md:px-3 py-1 rounded-full font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="p-3 md:p-4 bg-white border-t">
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-16 md:h-20 rounded border-2 overflow-hidden transition ${
                          index === car.primary_image_index || 0
                            ? 'border-indigo-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-4 md:mt-6">
              <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">About This Vehicle</h2>
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">{car.description}</p>
            </div>

            {/* Specs */}
            {car.specs && Object.keys(car.specs).length > 0 && (
              <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-4 md:mt-6">
                <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6">Vehicle Specifications</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {car.specs.horsepower && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Horsepower</p>
                      <p className="text-base md:text-lg font-bold text-gray-900">{car.specs.horsepower} hp</p>
                    </div>
                  )}
                  {car.specs.engine_size && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Engine Size</p>
                      <p className="text-base md:text-lg font-bold text-gray-900">{car.specs.engine_size}</p>
                    </div>
                  )}
                  {car.specs.doors && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Doors</p>
                      <p className="text-base md:text-lg font-bold text-gray-900">{car.specs.doors}</p>
                    </div>
                  )}
                  {car.specs.seats && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Seats</p>
                      <p className="text-base md:text-lg font-bold text-gray-900">{car.specs.seats}</p>
                    </div>
                  )}
                  {car.specs.trunk_capacity && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Trunk Capacity</p>
                      <p className="text-base md:text-lg font-bold text-gray-900">{car.specs.trunk_capacity}</p>
                    </div>
                  )}
                  {car.specs.mpg && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">MPG</p>
                      <p className="text-base md:text-lg font-bold text-gray-900">{car.specs.mpg} mpg</p>
                    </div>
                  )}
                  {car.specs.acceleration && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Acceleration (0-60)</p>
                      <p className="text-base md:text-lg font-bold text-gray-900">{car.specs.acceleration}</p>
                    </div>
                  )}
                  {car.specs.top_speed && (
                    <div>
                      <p className="text-xs md:text-sm text-gray-600">Top Speed</p>
                      <p className="text-base md:text-lg font-bold text-gray-900">{car.specs.top_speed} mph</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Price & Details */}
            <div className="bg-white rounded-lg shadow p-4 md:p-6 sticky top-24">
              <p className="text-3xl md:text-4xl font-bold text-indigo-600 mb-4">
                ${car.price.toLocaleString()}
              </p>

              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 pb-4 md:pb-6 border-b">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm md:text-base">Year:</span>
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{car.year}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm md:text-base">Make:</span>
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{car.make}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm md:text-base">Model:</span>
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{car.model}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm md:text-base">Color:</span>
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{car.color}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm md:text-base">Mileage:</span>
                  <span className="font-semibold text-gray-900 text-sm md:text-base">{car.mileage.toLocaleString()} mi</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm md:text-base">Condition:</span>
                  <span className="font-semibold text-gray-900 text-sm md:text-base capitalize">{car.condition}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm md:text-base">Fuel Type:</span>
                  <span className="font-semibold text-gray-900 text-sm md:text-base capitalize">{car.fuelType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm md:text-base">Transmission:</span>
                  <span className="font-semibold text-gray-900 text-sm md:text-base capitalize">{car.transmission}</span>
                </div>
                {car.category && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm md:text-base">Category:</span>
                    <span className="font-semibold text-gray-900 text-sm md:text-base capitalize">{car.category}</span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="space-y-2 md:space-y-3">
                <button
                  onClick={() => setShowContactForm(!showContactForm)}
                  className="w-full bg-indigo-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm md:text-base"
                >
                  Contact Seller
                </button>
                <button
                  onClick={() => router.push(`/compare?cars=${carId}`)}
                  className="w-full bg-gray-200 text-gray-900 px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold hover:bg-gray-300 transition text-sm md:text-base"
                >
                  Compare
                </button>
                <button
                  onClick={toggleWishlist}
                  className={`w-full px-4 md:px-6 py-2 md:py-3 rounded-lg font-semibold transition border-2 text-sm md:text-base ${
                    isInWishlist
                      ? 'bg-red-50 border-red-600 text-red-600 hover:bg-red-100'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-red-600 hover:text-red-600'
                  }`}
                >
                  {isInWishlist ? '♥ Saved' : '♡ Save'}
                </button>
              </div>
            </div>

            {/* Contact Form */}
            {showContactForm && (
              <div className="bg-white rounded-lg shadow p-4 md:p-6 mt-4">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">Send Message</h3>
                <form onSubmit={handleContactSubmit} className="space-y-2 md:space-y-3">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Your Phone"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm"
                  />
                  <textarea
                    placeholder="Your Message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-xs md:text-sm"
                  />

                  {messageStatus === 'success' && (
                    <p className="text-green-600 text-xs md:text-sm font-medium">Message sent successfully!</p>
                  )}
                  {messageStatus === 'error' && (
                    <p className="text-red-600 text-xs md:text-sm font-medium">Error sending message. Please try again.</p>
                  )}

                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:bg-gray-400 text-sm md:text-base"
                  >
                    {sendingMessage ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
