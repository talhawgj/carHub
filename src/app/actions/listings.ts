'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Using server actions with a service role to bypass some RLS for simplicity in MVP,
// or we can pass the auth token. We'll use the anon key for now assuming standard setup.
export async function createListing(data: any, userId: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Because 'makes' and 'models' might not be fully seeded yet, 
    // we should fetch or create them to satisfy foreign keys.
    // In a real app with strict DB schema, we need actual UUIDs.
    // For MVP, if we don't have UUIDs, we'll try to find them or insert dummy ones if RLS permits.
    // To avoid FK errors on MVP, let's assume makes and models tables exist and we just use arbitrary hardcoded UUIDs for now,
    // or we fetch them if they exist.
    
    // Attempt to get Make ID
    let makeId = null;
    const { data: makeData } = await supabase.from('makes').select('id').ilike('name', data.make).single();
    if (makeData) {
      makeId = makeData.id;
    } else {
      // Insert Make if doesn't exist (assuming admin rights or open RLS for makes)
      const { data: newMake } = await supabase.from('makes').insert({ name: data.make, slug: data.make.toLowerCase() }).select('id').single();
      if (newMake) makeId = newMake.id;
    }

    // Attempt to get Model ID
    let modelId = null;
    if (makeId) {
      const { data: modelData } = await supabase.from('models').select('id').ilike('name', data.model).eq('make_id', makeId).single();
      if (modelData) {
        modelId = modelData.id;
      } else {
        const { data: newModel } = await supabase.from('models').insert({ name: data.model, slug: data.model.toLowerCase(), make_id: makeId }).select('id').single();
        if (newModel) modelId = newModel.id;
      }
    }

    // Generate a unique slug
    const slug = `${data.make.toLowerCase()}-${data.model.toLowerCase()}-${data.year}-${Date.now()}`;

    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        seller_id: userId,
        make_id: makeId,
        model_id: modelId,
        year: parseInt(data.year),
        variant: data.variant,
        city: data.city,
        description: data.description,
        demand_price: parseFloat(data.demandPrice),
        reserve_price: parseFloat(data.reservePrice),
        status: 'draft',
        slug: slug,
      })
      .select('id')
      .single();

    if (error) throw new Error(error.message);

    revalidatePath('/dashboard');
    return { success: true, listingId: listing.id };
  } catch (error: any) {
    console.error('Create listing error:', error);
    return { success: false, message: error.message || 'Failed to create listing' };
  }
}
