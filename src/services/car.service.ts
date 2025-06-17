// src/services/car.service.ts
import pool from '../config/db';
import { Car } from '../interfaces/car.interface';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DuplicatePlateError } from '../errors/custom.errors'; // <<-- IMPORTAR EL NUEVO ERROR

class CarService {
  /**
   * Crea un nuevo coche si la placa no existe. Si la placa ya existe, lanza un error.
   * La validación se realiza ÚNICAMENTE por la placa.
   * @param carData Los datos del coche a crear.
   * @returns El ID del coche recién creado.
   * @throws {DuplicatePlateError} Si ya existe un coche con la misma placa.
   * @throws {Error} Si ocurre un error inesperado al intentar crear el coche.
   */
  async createCarAndValidatePlate(carData: Car): Promise<number> { // <<-- CAMBIO DE NOMBRE DE FUNCIÓN
    try {
      // **** LÓGICA DE BÚSQUEDA SOLO POR 'plate' Y SELECCIONANDO 'car_id' ****
      const [rows] = await pool.execute<Array<{car_id: number} & RowDataPacket>>(
        'SELECT car_id FROM cars WHERE plate = ?', // <<-- Aquí se busca por 'plate' y se selecciona 'car_id'
        [carData.plate]
      );

      if (rows.length > 0) {
        // Si se encuentra un coche con la misma placa, se lanza el error
        const existingCarId = rows[0].car_id; // <<-- Accediendo a 'car_id'
        console.log(`[CarService] Intento de crear coche con placa duplicada: ${carData.plate}, ID existente: ${existingCarId}`);
        throw new DuplicatePlateError(`Ya existe un vehículo con la placa "${carData.plate}" registrada en el sistema.`);
      } else {
        // Si la placa no existe, se procede con la inserción del nuevo coche.
        // `carroceria_serial_number` se incluye como un campo de datos más, sin validación de unicidad de la BD aquí.
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
            carData.carroceria_serial_number, // <<-- El campo se mantiene para insertar
            carData.motor_serial_number,
            carData.type_vehiculo,
            carData.use,
            carData.passenger_qty,
            carData.driver,
            carData.use_grua,
          ]
        );
        console.log(`[CarService] Nuevo coche creado con ID: ${result.insertId} (placa: ${carData.plate}).`);
        return result.insertId;
      }
    } catch (error) {
      // Re-lanzar DuplicatePlateError si es de ese tipo
      if (error instanceof DuplicatePlateError) {
        throw error;
      }
      console.error('[CarService] Error en createCarAndValidatePlate:', error);
      throw new Error('Error en el servicio de coche: no se pudo crear o validar.');
    }
  }
}

export default new CarService();