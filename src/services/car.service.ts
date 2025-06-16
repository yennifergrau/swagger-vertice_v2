// src/services/car.service.ts
import pool from '../config/db'; // Ruta a tu db.ts
import { Car } from '../interfaces/car.interface'; // Ruta a tu interfaz de coche
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise'; // Import RowDataPacket

class CarService {
  async findOrCreateCar(carData: Car): Promise<number> {
    try {
      // Intenta encontrar el coche por número de serie del chasis (debe ser UNIQUE)
      // Use RowDataPacket[] or specify Car as a RowDataPacket
      const [rows] = await pool.execute<RowDataPacket[]>( // Corrected type here
        'SELECT id FROM cars WHERE carroceria_serial_number = ?',
        [carData.carroceria_serial_number]
      );

      // Cast the rows to Car[] if you need full Car objects, or access properties directly
      // In this specific case, we only need the 'id', so accessing rows[0].id is fine.
      if (rows.length > 0) {
        // Ensure that rows[0] actually contains an 'id' property
        const existingCarId = (rows[0] as Car).id; // Cast to Car to access 'id' property with type safety
        if (existingCarId) {
            console.log(`[CarService] Coche existente encontrado: ID ${existingCarId}`);
            return existingCarId;
        } else {
            // Fallback if 'id' is unexpectedly missing from the result
            throw new Error('Existing car found but ID is missing from the query result.');
        }
      } else {
        // Si no existe, inserta un nuevo coche
        const [result] = await pool.execute<ResultSetHeader>(
          `INSERT INTO cars (plate, brand, model, version, year, color, gearbox, carroceria_serial_number, motor_serial_number, type_vehiculo, \`use\`, passenger_qty, driver, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            carData.plate,
            carData.brand,
            carData.model,
            carData.version || null, // Usar null para opcionales si no se proporcionan
            carData.color || null,
            carData.gearbox || null,
            carData.carroceria_serial_number,
            carData.motor_serial_number,
            carData.type_vehiculo,
            carData.use,
            carData.passenger_qty,
            carData.driver
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