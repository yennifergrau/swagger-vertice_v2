export interface Car {
  id?: number;
  type_plate: string;
  plate: string;
  brand: string;
  model: string;
  version?: string;
  year: number;
  color?: string;
  gearbox?: string;
  carroceria_serial_number: string;
  motor_serial_number: string;
  type_vehiculo?: string;
  use_type?: string; // Cambiado de 'use' a 'use_type'
  passenger_qty?: number;
  driver?: string;
  use_grua?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}