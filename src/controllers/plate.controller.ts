
import { Request, Response } from 'express';
import pool from '../config/db';

export const verifyPlateCtrl = async (req: Request, res: Response) => {
  try {
    const {
      policy_holder_type_document,
      policy_holder_document_number,
      plate,
    } = req.body;

    if (
      !policy_holder_type_document  ||
      !policy_holder_document_number ||
      !plate 
    ) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const [cars]: any = await pool.query('SELECT car_id FROM cars WHERE plate = ?', [plate]);
    if (!Array.isArray(cars) || cars.length === 0) {
      return res.json({ message: 'La placa no existe' });
    }
    const carId = cars[0].car_id;

    
    const [orders]: any = await pool.query(
      'SELECT car_id FROM orders WHERE car_id = ?',
      [carId]
    );
    if (Array.isArray(orders) && orders.length > 0) {
      return res.json({ message: 'Ya existe un registro con esta placa' });
    }
    return res.json({ message: 'La placa no existe' });
  } catch (error) {
    return res.status(500).json({
      message: 'Error interno del servidor al verificar placa',
      error: (error as Error).message,
    });
  }
};

