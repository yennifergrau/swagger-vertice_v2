// src/services/car.service.ts
import pool from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

// Interfaz para los datos del vehiculo, similar a CarData del request
export interface CarDetails {
  type_plate: string;
  plate: string;
  brand: string;
  model: string;
  version: string | null;
  year: number;
  color: string | null;
  gearbox: string | null;
  carroceria_serial_number: string;
  motor_serial_number: string;
  type_vehiculo: string;
  use: string;
  passenger_qty: number;
  driver: string;
  use_grua: boolean;
}

class CarService {
  /**
   * Busca un vehiculo por su placa.
   * @param plate La placa del vehiculo a buscar.
   * @returns El ID del vehiculo si existe, o null si no se encuentra.
   */
  async findCarByPlate(plate: string): Promise<number | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT car_id FROM cars WHERE plate = ?',
      [plate]
    );
    if (rows.length > 0) {
      return rows[0].car_id;
    }
    return null;
  }

  /**
   * Crea un nuevo vehiculo en la base de datos o devuelve su ID si ya existe.
   * Permite N cotizaciones por el mismo vehículo.
   * @param carDetails Los detalles del vehiculo.
   * @returns El ID del vehiculo (existente o recién creado).
   */
  async createCar(carDetails: CarDetails): Promise<number> {
    // Primero, intenta encontrar el vehiculo por placa
    const existingCarId = await this.findCarByPlate(carDetails.plate);

    if (existingCarId) {
      console.log(`[Car Service] vehiculo con placa ${carDetails.plate} ya existe. Usando ID: ${existingCarId}`);
      return existingCarId; // Devuelve el ID del vehiculo existente
    }

    // Si no existe, inserta el nuevo vehiculo
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO cars (
        type_plate, plate, brand, model, version, year, color, gearbox,
        carroceria_serial_number, motor_serial_number, type_vehiculo, \`use\`,
        passenger_qty, driver, use_grua, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        carDetails.type_plate, carDetails.plate, carDetails.brand, carDetails.model, carDetails.version,
        carDetails.year, carDetails.color, carDetails.gearbox, carDetails.carroceria_serial_number,
        carDetails.motor_serial_number, carDetails.type_vehiculo, carDetails.use, carDetails.passenger_qty,
        carDetails.driver, carDetails.use_grua
      ]
    );

    if (result.insertId) {
      console.log(`[Car Service] Nuevo vehiculo creado con ID: ${result.insertId}`);
      return result.insertId;
    } else {
      throw new Error('Error al crear el vehiculo: no se obtuvo un ID de inserción.');
    }
  }
}

export default new CarService();