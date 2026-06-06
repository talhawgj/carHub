'use server';

import { createClient } from '@supabase/supabase-js';

// In a real production app, this would use the `stripe` npm package
// e.g. const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createInspectionCheckoutSession(userId: string, listingId: string, scheduledDate: string, timeSlot: string, amount: number = 5000) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Log the pending payment intention in our DB
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount: amount,
        type: 'inspection_fee',
        reference_id: listingId,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) throw error;

    // 2. MOCK: Instead of generating a real Stripe session URL, 
    // we will simulate a successful payment URL that hits a success page.
    const encodedDate = encodeURIComponent(scheduledDate);
    const encodedTime = encodeURIComponent(timeSlot);
    const mockCheckoutUrl = `/car-inspection/success?payment_id=${data.id}&listing_id=${listingId}&date=${encodedDate}&time=${encodedTime}`;

    return { success: true, url: mockCheckoutUrl };
  } catch (error: any) {
    console.error('Payment creation failed:', error);
    return { success: false, message: error.message };
  }
}

export async function confirmMockPayment(paymentId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update payment to completed
    const { error } = await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('id', paymentId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Payment confirmation failed:', error);
    return { success: false, message: error.message };
  }
}
