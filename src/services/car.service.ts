// src/services/car.service.ts
import pool from '../config/db';
import { Car } from '../interfaces/car.interface';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

class CarService {
  async findOrCreateCar(carData: Car): Promise<number> {
    try {
      // La consulta busca ÚNICAMENTE por 'plate' como deseas
      const [rows] = await pool.execute<Array<{car_id: number} & RowDataPacket>>(
        'SELECT car_id FROM cars WHERE plate = ?', // Solo busca por plate
        [carData.plate]
      );

      if (rows.length > 0) {
        const existingCarId = rows[0].car_id;
        if (existingCarId) {
            console.log(`[CarService] Carro existente encontrado: ID ${existingCarId} (por placa).`);
            return existingCarId;
        } else {
            // Este caso es poco probable si la consulta es SELECT car_id y rows.length > 0
            throw new Error('Existing car found but car_id is missing from the query result.');
        }
      } else {
        // Si no se encuentra por placa, se inserta un nuevo registro.
        // La columna carroceria_serial_number se inserta como cualquier otro campo,
        // sin que su unicidad sea verificada por la base de datos (ya que el INDEX UNIQUE será eliminado).
        const [result] = await pool.execute<ResultSetHeader>(
          `INSERT INTO cars (type_plate, plate, brand, model, version, year, color, gearbox, carroceria_serial_number, motor_serial_number, type_vehiculo, \`use\`, passenger_qty, driver, use_grua, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            carData.type_plate,
            carData.plate,
            carData.brand,
            carData.model,
            carData.version || null,
            carData.year,
            carData.color || null,
            carData.gearbox || null,
            carData.carroceria_serial_number, // El campo se envía a la BD
            carData.motor_serial_number,
            carData.type_vehiculo,
            carData.use,
            carData.passenger_qty,
            carData.driver,
            carData.use_grua,
          ]
        );
        console.log(`[CarService] Nuevo carro creado con ID: ${result.insertId} (placa: ${carData.plate}).`);
        return result.insertId;
      }
    } catch (error) {
      console.error('[CarService] Error en findOrCreateCar:', error);
      // Después de eliminar el índice UNIQUE, este error no debería ser 'Duplicate entry' para carroceria_serial_number.
      throw new Error('Error en el servicio de carro: no se pudo encontrar o crear.');
    }
  }
}

export default new CarService();