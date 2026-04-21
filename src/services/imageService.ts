import { supabase } from '@/lib/supabase';

const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'car-images';

export const imageService = {
  // Upload image for a car
  async uploadCarImage(
    carId: string,
    file: File,
    filename?: string
  ): Promise<string> {
    const fileName = filename || `${Date.now()}-${file.name}`;
    const filePath = `${carId}/${fileName}`;

    const { error } = await supabase.instance.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data } = supabase.instance.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  // Upload multiple images
  async uploadCarImages(
    carId: string,
    files: File[]
  ): Promise<string[]> {
    const urls = await Promise.all(
      files.map((file) => this.uploadCarImage(carId, file))
    );
    return urls;
  },

  // Get signed URL for private images (if needed)
  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.instance.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  },

  // Delete image
  async deleteImage(filePath: string): Promise<void> {
    const { error } = await supabase.instance.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
  },

  // Delete all images for a car
  async deleteCarImages(carId: string): Promise<void> {
    const { data, error } = await supabase.instance.storage
      .from(BUCKET_NAME)
      .list(carId);

    if (error) throw error;

    if (data && data.length > 0) {
      const filePaths = data.map((file: any) => `${carId}/${file.name}`);
      await this.deleteImages(filePaths);
    }
  },

  // Delete multiple images
  async deleteImages(filePaths: string[]): Promise<void> {
    const { error } = await supabase.instance.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (error) throw error;
  },
};
