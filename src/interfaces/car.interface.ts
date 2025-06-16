// src/interfaces/car.interface.ts

export interface Car {
  id?: number; // El ID podría ser opcional si es autoincremental en la DB
  plate: string;
  brand: string;
  model: string;
  // Cambia de '?: string | undefined' a '?: string | null | undefined'
  version?: string | null; // Acepta string, null o undefined
  year: number;
  // Cambia de '?: string | undefined' a '?: string | null | undefined'
  color?: string | null;   // Acepta string, null o undefined
  // Cambia de '?: string | undefined' a '?: string | null | undefined'
  gearbox?: string | null; // Acepta string, null o undefined
  carroceria_serial_number: string;
  motor_serial_number: string;
  type_vehiculo: string;
  use: string;
  passenger_qty: number;
  driver: string;
  createdAt?: Date; // Si son manejados por la DB, pueden ser opcionales
  updatedAt?: Date; // Si son manejados por la DB, pueden ser opcionales
}

// Interfaz para la solicitud de datos de coche (si difiere del Car completo)
export interface CarRequest {
  plate: string;
  brand: string;
  model: string;
  version?: string | null; // También aquí si esta interfaz se usa en el request body
  year: number;
  color?: string | null;
  gearbox?: string | null;
  carroceria_serial_number: string;
  motor_serial_number: string;
  type_vehiculo: string;
  use: string;
  passenger_qty: number;
  driver: string;
  use_grua?: boolean; // Este campo es específico del request, no del modelo de DB
}