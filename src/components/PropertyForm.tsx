'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import { MAX_CAR_PRICE, parseAndValidateCarPrice, toCarDbPayload } from '@/lib/carTransform';
import GalleryManager from './GalleryManager';
import type { Car, CarSpecs } from '@/types';
import type { Database } from '@/types/supabase';

interface PropertyFormProps {
  initialData?: Car;
  isEditing?: boolean;
}

const AVAILABLE_TAGS = ['Featured', 'On Sale', 'New Arrival', 'Best Deal', 'Recently Listed'];
const CATEGORIES = ['sedan', 'suv', 'truck', 'coupe', 'convertible', 'van', 'hatchback', 'wagon'];

export default function PropertyForm({
  initialData,
  isEditing = false,
}: PropertyFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    price: initialData?.price || 0,
    year: initialData?.year || new Date().getFullYear(),
    make: initialData?.make || '',
    model: initialData?.model || '',
    mileage: initialData?.mileage || 0,
    category: initialData?.category || 'sedan',
    condition: initialData?.condition || 'used',
    fuelType: initialData?.fuelType || initialData?.fuel_type || 'gasoline',
    transmission: initialData?.transmission || 'automatic',
    color: initialData?.color || '',
    tags: initialData?.tags || [],
    is_available: initialData?.is_available !== false,
  });

  const [specs, setSpecs] = useState<CarSpecs>(initialData?.specs || {});
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(initialData?.primary_image_index || 0);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target;
    const { name, value } = target;
    const isCheckbox = target instanceof HTMLInputElement && target.type === 'checkbox';

    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? target.checked : value,
    }));
  };

  const handleSpecChange = (key: keyof CarSpecs, value: CarSpecs[keyof CarSpecs]) => {
    setSpecs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleTagToggle = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      const newImageUrls: string[] = [];

      // Upload new images if provided
      if (imageFiles.length > 0) {
        const carId = initialData?.id || 'temp';
        for (const file of imageFiles) {
          const fileName = `${Date.now()}-${file.name}`;
          const filePath = `${carId}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('car-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: publicUrl } = supabase.storage
            .from('car-images')
            .getPublicUrl(filePath);

          newImageUrls.push(publicUrl.publicUrl);
        }
      }

      // Combine existing and new images
      const allImages = [...images, ...newImageUrls];
      const validatedPrice = parseAndValidateCarPrice(formData.price);

      const payload = {
        ...formData,
        images: allImages,
        specs: specs,
        primary_image_index: primaryImageIndex,
        price: validatedPrice,
        year: parseInt(String(formData.year)),
        mileage: parseInt(String(formData.mileage)),
      };
      const dbPayload = toCarDbPayload(payload);

      if (isEditing && initialData?.id) {
        const updatePayload = dbPayload as Database['public']['Tables']['cars']['Update'];

        // Update existing
        const { error: updateError } = await supabase
          .from('cars')
          .update(updatePayload)
          .eq('id', initialData.id);

        if (updateError) throw updateError;
        router.push('/admin/properties');
      } else {
        if (!user?.id) {
          throw new Error('You must be logged in to create a car listing');
        }

        const insertPayload = {
          ...dbPayload,
          seller_id: user.id,
        } as Database['public']['Tables']['cars']['Insert'];

        // Create new
        const { error: insertError } = await supabase
          .from('cars')
          .insert([insertPayload]);

        if (insertError) throw insertError;
        router.push('/admin/properties');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save property';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Title & Description */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
            placeholder="e.g., Luxury SUV in Great Condition"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
            placeholder="Describe the property in detail..."
          />
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Vehicle Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year *
            </label>
            <input
              type="number"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Make *
            </label>
            <input
              type="text"
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="e.g., Toyota"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model *
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="e.g., Camry"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="e.g., Black"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mileage
            </label>
            <input
              type="number"
              name="mileage"
              value={formData.mileage}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              step="0.01"
              min="0"
              max={MAX_CAR_PRICE}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition *
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
            >
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Type *
            </label>
            <select
              name="fuelType"
              value={formData.fuelType}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
            >
              <option value="gasoline">Gasoline</option>
              <option value="diesel">Diesel</option>
              <option value="hybrid">Hybrid</option>
              <option value="electric">Electric</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transmission *
            </label>
            <select
              name="transmission"
              value={formData.transmission}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
            >
              <option value="manual">Manual</option>
              <option value="automatic">Automatic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category & Tags */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Category & Tags</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition ${formData.tags.includes(tag)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Specs */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Vehicle Specifications</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Horsepower
            </label>
            <input
              type="number"
              value={specs.horsepower || ''}
              onChange={(e) => handleSpecChange('horsepower', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="e.g., 200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Engine Size
            </label>
            <input
              type="text"
              value={specs.engine_size || ''}
              onChange={(e) => handleSpecChange('engine_size', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="e.g., 2.0L"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Doors
            </label>
            <input
              type="number"
              value={specs.doors || ''}
              onChange={(e) => handleSpecChange('doors', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="e.g., 4"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seats
            </label>
            <input
              type="number"
              value={specs.seats || ''}
              onChange={(e) => handleSpecChange('seats', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="e.g., 5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trunk Capacity
            </label>
            <input
              type="text"
              value={specs.trunk_capacity || ''}
              onChange={(e) => handleSpecChange('trunk_capacity', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="e.g., 450L"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MPG (Fuel Efficiency)
            </label>
            <input
              type="number"
              step="0.1"
              value={specs.mpg || ''}
              onChange={(e) => handleSpecChange('mpg', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="e.g., 25.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acceleration (0-60)
            </label>
            <input
              type="text"
              value={specs.acceleration || ''}
              onChange={(e) => handleSpecChange('acceleration', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="e.g., 8.5s"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Top Speed (mph)
            </label>
            <input
              type="number"
              value={specs.top_speed || ''}
              onChange={(e) => handleSpecChange('top_speed', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
              placeholder="e.g., 140"
            />
          </div>
        </div>
      </div>

      {/* Gallery Manager */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Gallery</h2>
        <GalleryManager
          images={images}
          onImagesChange={setImages}
          primaryImageIndex={primaryImageIndex}
          onPrimaryImageChange={setPrimaryImageIndex}
        />
      </div>

      {/* Image Upload */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Upload Images</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Add New Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-gray-900 bg-white"
          />
          <p className="text-xs text-gray-600 mt-1">
            {imageFiles.length} new image(s) selected
          </p>
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="is_available"
            id="is_available"
            checked={formData.is_available}
            onChange={handleChange}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
            Property is available for sale
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition"
        >
          {loading
            ? 'Saving...'
            : isEditing
              ? 'Update Property'
              : 'Create Property'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
