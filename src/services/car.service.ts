// src/services/car.service.ts
import pool from '../db';
import { Car } from '../interfaces/car.interface';
import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

class CarService {
  async findCarByPlate(plate: string): Promise<Car | null> {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM cars WHERE plate = ?', [plate]);
    if (rows.length === 0) {
      return null;
    }
    return rows[0] as Car;
  }

  async findCarBySerialNumbers(carroceria_serial_number: string, motor_serial_number: string): Promise<Car | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM cars WHERE carroceria_serial_number = ? OR motor_serial_number = ?',
      [carroceria_serial_number, motor_serial_number]
    );
    if (rows.length === 0) {
      return null;
    }
    return rows[0] as Car;
  }

  async createCar(carData: Omit<Car, 'id' | 'createdAt' | 'updatedAt'>): Promise<Car> {
    const {
      type_plate, plate, brand, model, version, year, color, gearbox,
      carroceria_serial_number, motor_serial_number, type_vehiculo,
      use_type, passenger_qty, driver, use_grua
    } = carData;

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO cars (type_plate, plate, brand, model, version, year, color, gearbox,
                        carroceria_serial_number, motor_serial_number, type_vehiculo,
                        use_type, passenger_qty, driver, use_grua)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type_plate, plate, brand, model, version || null, year, color || null, gearbox || null,
        carroceria_serial_number, motor_serial_number, type_vehiculo || null,
        use_type || null, passenger_qty || null, driver || null, use_grua !== undefined ? use_grua : null
      ]
    );
    const insertId = result.insertId;
    return { id: insertId, ...carData };
  }
}

export default new CarService();