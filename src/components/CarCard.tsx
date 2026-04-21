'use client';

import { Car } from '@/types';
import Image from 'next/image';

interface CarCardProps {
  car: Car;
}

export function CarCard({ car }: CarCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Container */}
      <div className="relative h-48 bg-gray-200">
        {car.images && car.images.length > 0 ? (
          <Image
            src={car.images[0]}
            alt={car.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {car.year} {car.make} {car.model}
        </h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {car.description}
        </p>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
          <div>Mileage: {car.mileage?.toLocaleString()} km</div>
          <div>Fuel: {car.fuelType}</div>
          <div>Transmission: {car.transmission}</div>
          <div>Condition: {car.condition}</div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between pt-4 border-t">
          <span className="text-2xl font-bold text-blue-600">
            ${car.price.toLocaleString()}
          </span>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
