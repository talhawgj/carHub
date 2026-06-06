'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Using a service role key for the server action if we need to bypass some RLS or do complex validation,
// but for MVP we will use the standard client setup or just pass the user token if needed.
// Actually, since this is a server action, it runs on the server.
// For now, we'll implement a basic validation wrapper.
export async function placeBid(auctionId: string, bidderId: string, amount: number) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Ideally use service role for trusted server actions
    
    // In a real app with nextjs SSR auth, we'd use createServerClient from @supabase/ssr
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get the current auction state
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('current_highest_bid, status, ends_at')
      .eq('id', auctionId)
      .single();

    if (auctionError) throw new Error('Auction not found');
    if (auction.status !== 'active') throw new Error('Auction is not active');
    if (new Date(auction.ends_at).getTime() < Date.now()) throw new Error('Auction has ended');

    // 2. Validate amount (min increment is 50,000 for this example)
    const minIncrement = 50000;
    if (amount < auction.current_highest_bid + minIncrement) {
      throw new Error(`Bid must be at least ${(auction.current_highest_bid + minIncrement).toLocaleString()}`);
    }

    // 3. Insert the bid
    const { error: bidError } = await supabase
      .from('bids')
      .insert({
        auction_id: auctionId,
        bidder_id: bidderId,
        amount: amount,
      });

    if (bidError) throw new Error(bidError.message);

    // 4. Update the auction's current_highest_bid and bid_count
    // Note: In a production app, this should ideally be an RPC call or a database trigger to prevent race conditions.
    const { error: updateError } = await supabase
      .rpc('increment_bid_count', { a_id: auctionId, new_bid: amount });
      
    // If we don't have the RPC, we can do a standard update for MVP:
    // await supabase.from('auctions').update({ current_highest_bid: amount, bid_count: current + 1 }).eq('id', auctionId);

    // 5. Revalidate the path so subsequent SSR renders have fresh data
    revalidatePath(`/auctions/[slug]`, 'page');

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message || 'Failed to place bid' };
  }
}
