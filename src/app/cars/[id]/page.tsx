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
                Rs. {car.price.toLocaleString()}
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

            {/* Contact Form Modal */}
            {showContactForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm transition-all duration-300">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
                  <div className="relative px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-white">
                    <h3 className="text-xl font-bold text-gray-900">Contact Seller</h3>
                    <p className="text-sm text-gray-500 mt-1">We'll get back to you as soon as possible.</p>
                    <button 
                      onClick={() => setShowContactForm(false)}
                      className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 transition-colors bg-white rounded-full p-1.5 shadow-sm hover:shadow border border-gray-100"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="p-6">
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                        <input
                          type="text"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none"
                          placeholder="John Doe"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none"
                          placeholder="john@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                        <input
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                        <textarea
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          required
                          rows={4}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-900 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none resize-none"
                          placeholder="I'm interested in this vehicle..."
                        />
                      </div>

                      {messageStatus === 'success' && (
                        <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm font-medium flex items-center animate-in fade-in slide-in-from-bottom-2">
                          <svg className="w-5 h-5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Message sent successfully!
                        </div>
                      )}
                      
                      {messageStatus === 'error' && (
                        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium flex items-center animate-in fade-in slide-in-from-bottom-2">
                          <svg className="w-5 h-5 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Error sending message. Please try again.
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={sendingMessage}
                        className="w-full relative flex items-center justify-center bg-indigo-600 text-white px-4 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all duration-200 disabled:bg-indigo-400 shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-0.5 mt-4"
                      >
                        {sendingMessage ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </>
                        ) : 'Send Message'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
