import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'car-images';

export async function POST(request: NextRequest) {
  try {
    const supabase = supabaseServer();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const carId = formData.get('carId') as string;

    if (!file || !carId) {
      return NextResponse.json(
        { error: 'Missing file or carId' },
        { status: 400 }
      );
    }

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${carId}/${fileName}`;
    const buffer = await file.arrayBuffer();

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get public URL
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json(
      { url: data.publicUrl, filePath },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
