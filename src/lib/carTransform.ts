import type { Car } from '@/types';

type DbCar = Omit<Car, 'fuelType'> & {
  fuelType?: Car['fuelType'];
  fuel_type?: Car['fuelType'];
};

export function normalizeCarFromDb(car: DbCar): Car {
  return {
    ...car,
    fuelType: car.fuelType ?? car.fuel_type ?? 'gasoline',
  } as Car;
}

export function normalizeCarsFromDb(cars: DbCar[] | null | undefined): Car[] {
  return (cars || []).map(normalizeCarFromDb);
}

export function toCarDbPayload(car: Partial<Car>) {
  const { fuelType, ...rest } = car;

  if (typeof fuelType === 'undefined') {
    return rest;
  }

  return {
    ...rest,
    fuel_type: fuelType,
  };
}