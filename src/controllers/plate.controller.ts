
import { Request, Response } from 'express';
import pool from '../db';

export const verifyPlateCtrl = async (req: Request, res: Response) => {
  try {
    const {
      policy_holder_type_document,
      policy_holder_document_number,
      plate,
    } = req.body;

    if (
      policy_holder_type_document === undefined ||
      policy_holder_document_number === undefined ||
      plate === undefined
    ) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const [cars]: any = await pool.query('SELECT id FROM cars WHERE plate = ?', [plate]);
    if (!Array.isArray(cars) || cars.length === 0) {
      return res.json({ message: 'La placa no existe' });
    }
    const carId = cars[0].id;

    const [orders]: any = await pool.query(
      'SELECT id FROM orders WHERE car_id = ? AND policy_holder_type_document = ? AND policy_holder_document_number = ?',
      [carId, policy_holder_type_document, policy_holder_document_number]
    );
    if (Array.isArray(orders) && orders.length > 0) {
      return res.json({ message: 'La placa ya existe' });
    }
    return res.json({ message: 'La placa no existe' });
  } catch (error) {
    return res.status(500).json({
      message: 'Error interno del servidor al verificar placa',
      error: (error as Error).message,
    });
  }
};

