import { Request, Response } from 'express';
import pool from '../db';

// Trae todos los asegurados (policy holders) con sus órdenes, pólizas, autos y pagos en formato plano (una fila por combinación)
export const getUsersReport = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT o.policy_holder_document_number, o.policy_holder, o.policy_holder_type_document,
             o.id as order_id, o.*, p.policy_id, p.policy_number, p.car_id as policy_car_id, p.*,
             c.*, pay.*
      FROM orders o
      LEFT JOIN policies p ON o.id = p.order_id
      LEFT JOIN cars c ON p.car_id = c.id
      LEFT JOIN payments pay ON p.policy_id = pay.policy_id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener el reporte de asegurados:', error);
    res.status(500).json({ error: 'Error interno al obtener el reporte de asegurados' });
  }
};
