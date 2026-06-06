'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function publishAuction(
  inspectionId: string, 
  listingId: string, 
  score: number, 
  durationDays: number,
  photoUrls: string[]
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Should ideally use service_role here since admins perform this
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Update Inspection Status
    const { error: inspError } = await supabase
      .from('inspections')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        // We'd normally save the score and photos here or in related tables,
        // but for MVP we will just save the photos to the inspection record if we had a field,
        // or we just assume they are attached to the listing.
      })
      .eq('id', inspectionId);
    
    if (inspError) throw new Error(`Inspection Error: ${inspError.message}`);

    // 2. Update Listing Status
    const { error: listError } = await supabase
      .from('listings')
      .update({ status: 'active' })
      .eq('id', listingId);
    
    if (listError) throw new Error(`Listing Error: ${listError.message}`);

    // 3. Create the Auction Record
    const startsAt = new Date();
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + durationDays);

    const { error: aucError } = await supabase
      .from('auctions')
      .insert({
        listing_id: listingId,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'active',
        current_highest_bid: 0, // Gets populated when bids are placed
        bid_count: 0
      });

    if (aucError) throw new Error(`Auction Error: ${aucError.message}`);

    revalidatePath('/admin/inspections');
    revalidatePath('/dashboard');
    revalidatePath('/auctions');

    return { success: true };
  } catch (error: any) {
    console.error('Failed to publish auction:', error);
    return { success: false, message: error.message };
  }
}
