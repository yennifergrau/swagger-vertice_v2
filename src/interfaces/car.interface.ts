// src/interfaces/car.interface.ts

export interface Car {
  card_id?: number;
  type_plate: string;
  plate: string;
  brand: string;
  model: string;
  version?: string | null;
  year: number;
  color?: string | null;
  gearbox?: string | null;
  carroceria_serial_number: string;
  motor_serial_number: string;
  type_vehiculo: string;
  use: string;
  passenger_qty: number;
  driver: string;
  use_grua?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CarRequest {
  type_plate: string;
  plate: string;
  brand: string;
  model: string;
  version?: string | null;
  year: number;
  color?: string | null;
  gearbox?: string | null;
  carroceria_serial_number: string;
  motor_serial_number: string;
  type_vehiculo: string;
  use: string;
  passenger_qty: number;
  driver: string;
  use_grua?: boolean;
}