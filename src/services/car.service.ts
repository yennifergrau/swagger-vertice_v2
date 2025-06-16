// src/services/car.service.ts
import pool from '../config/db';
import { Car } from '../interfaces/car.interface';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';

class CarService {
  async findOrCreateCar(carData: Car): Promise<number> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM cars WHERE carroceria_serial_number = ?',
        [carData.carroceria_serial_number]
      );

      if (rows.length > 0) {
        const existingCarId = (rows[0] as Car).id;
        if (existingCarId) {
            console.log(`[CarService] Coche existente encontrado: ID ${existingCarId}`);
            return existingCarId;
        } else {
            throw new Error('Existing car found but ID is missing from the query result.');
        }
      } else {
        const [result] = await pool.execute<ResultSetHeader>(
          // ¡CAMBIO AQUÍ! Añade comillas invertidas alrededor de `use`
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
            carData.carroceria_serial_number,
            carData.motor_serial_number,
            carData.type_vehiculo,
            carData.use, // Este valor no necesita comillas, solo el nombre de la columna en el SQL
            carData.passenger_qty,
            carData.driver,
            carData.use_grua,
          ]
        );
        console.log(`[CarService] Nuevo coche creado con ID: ${result.insertId}`);
        return result.insertId;
      }
    } catch (error) {
      console.error('[CarService] Error en findOrCreateCar:', error);
      throw new Error('Error en el servicio de coche: no se pudo encontrar o crear.');
    }
  }
}

export default new CarService();