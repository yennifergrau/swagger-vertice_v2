import { Request, Response } from 'express';
import pool from '../config/db';

export const verifyPlateCtrl = async (req: Request, res: Response) => {
  try {
    const {
      // policy_holder_type_document,
      // policy_holder_document_number,
      plate,
    } = req.body;

    if (
      // !policy_holder_type_document ||
      // !policy_holder_document_number ||
      !plate
    ) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const [policies]: any = await pool.query(
      `
      SELECT
        p.policy_id
      FROM
        policies p
      JOIN
        cars c ON p.car_id = c.car_id
      WHERE
        c.plate = ?
      `,
      [plate]
    );

    if (Array.isArray(policies) && policies.length > 0) {
      return res.json({ message: 'El Vehículo tiene póliza' });
    } else {
      return res.json({ message: 'El Vehículo no tiene póliza' });
    }
  } catch (error) {
    return res.status(500).json({
      message: 'Error interno del servidor al verificar placa',
      error: (error as Error).message,
    });
  }
};