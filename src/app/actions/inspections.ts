'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function bookInspection(listingId: string, scheduledDate: string, timeSlot: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Combine date and time slot for scheduled_at
    const [time, period] = timeSlot.split(' ');
    const [hours, minutes] = time.split(':');
    let h = parseInt(hours);
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    
    const scheduledAt = new Date(scheduledDate);
    scheduledAt.setHours(h, parseInt(minutes), 0, 0);

    // Insert inspection record
    const { error: inspectionError } = await supabase
      .from('inspections')
      .insert({
        listing_id: listingId,
        scheduled_at: scheduledAt.toISOString(),
        status: 'scheduled',
      });

    if (inspectionError) throw new Error(inspectionError.message);

    // Update listing status to 'pending_inspection'
    const { error: listingError } = await supabase
      .from('listings')
      .update({ status: 'pending_inspection' })
      .eq('id', listingId);

    if (listingError) throw new Error(listingError.message);

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Book inspection error:', error);
    return { success: false, message: error.message || 'Failed to book inspection' };
  }
}
