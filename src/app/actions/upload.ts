'use server';

import { createClient } from '@supabase/supabase-js';

export async function uploadImage(formData: FormData) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; 
    const supabase = createClient(supabaseUrl, supabaseKey);

    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `cars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('vehicle-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('vehicle-images')
      .getPublicUrl(filePath);

    return { success: true, url: data.publicUrl };
  } catch (error: any) {
    console.error('Upload failed:', error);
    return { success: false, message: error.message };
  }
}
