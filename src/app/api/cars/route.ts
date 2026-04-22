import { NextRequest, NextResponse } from 'next/server';
import { normalizeCarsFromDb, normalizeCarFromDb, parseAndValidateCarPrice, toCarDbPayload } from '@/lib/carTransform';
import { supabaseServer } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(normalizeCarsFromDb(data));
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const body = await request.json();

    // Validate required fields
    if (!body.title || body.price === undefined || body.price === null || !body.seller_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    body.price = parseAndValidateCarPrice(body.price);

    const dbPayload = toCarDbPayload(body) as Database['public']['Tables']['cars']['Insert'];

    const { data, error } = await supabase
      .from('cars')
      .insert([dbPayload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(normalizeCarFromDb(data), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
