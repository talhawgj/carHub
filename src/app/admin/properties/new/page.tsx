'use client';

import PropertyForm from '@/components/PropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Add New Vehicle</h1>
        <p className="text-gray-600 mt-1">Fill in the form below to add a new vehicle</p>
      </div>
      <PropertyForm />
    </div>
  );
}
