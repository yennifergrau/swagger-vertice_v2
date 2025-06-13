import { Request, Response } from 'express';
import pool from '../db';

export const verifyPlateCtrl = async (req: Request, res: Response) => {
  try {
    const {
      policy_holder_type_document,
      policy_holder_document_number,
      plate,
    } = req.body;

    // Asegura que ningún valor sea undefined
    if (
      policy_holder_type_document === undefined ||
      policy_holder_document_number === undefined ||
      plate === undefined
    ) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    // Consulta si la placa existe en la tabla orders
    const [rows]: any = await pool.query(
      `SELECT id FROM orders WHERE plate = ? AND policy_holder_type_document = ? AND policy_holder_document_number = ?`,
      [
        plate ?? null,
        policy_holder_type_document ?? null,
        policy_holder_document_number ?? null,
      ]
    );

    if (rows.length === 0) {
      return res.json({ message: 'La placa no existe' });
    } else {
      return res.json({ message: 'La placa ya existe' });
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Error interno del servidor al verificar placa',
      error: (error as Error).message,
    });
  }
};
