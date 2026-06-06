'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { bookInspection } from '@/app/actions/inspections';
import { confirmMockPayment } from '@/app/actions/payments';
import Link from 'next/link';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processPaymentAndBooking = async () => {
      try {
        const paymentId = searchParams.get('payment_id');
        const listingId = searchParams.get('listing_id');
        const dateStr = searchParams.get('date');
        const timeStr = searchParams.get('time');

        if (!paymentId || !listingId || !dateStr || !timeStr) {
          throw new Error('Missing required booking parameters.');
        }

        // 1. Confirm the mock payment in the DB
        const paymentResult = await confirmMockPayment(paymentId);
        if (!paymentResult.success) throw new Error('Payment confirmation failed.');

        // 2. Finalize the inspection booking
        const bookingResult = await bookInspection(listingId, dateStr, timeStr);
        if (!bookingResult.success) throw new Error(bookingResult.message);

        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'An unknown error occurred.');
      }
    };

    processPaymentAndBooking();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl text-center">
        
        {status === 'processing' && (
          <div>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-500">Please do not close this window. We are finalizing your appointment.</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-500 mb-8">
              Your inspection fee has been paid and your appointment is officially booked. 
              Our inspector will contact you shortly to confirm the exact location.
            </p>
            <Link href="/dashboard" className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Return to My Garage
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h2>
            <p className="text-gray-500 mb-8">{errorMessage}</p>
            <Link href="/dashboard" className="text-indigo-600 hover:underline font-medium">
              Return to Dashboard
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
