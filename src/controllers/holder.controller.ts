import { Request, Response } from 'express';
import pool from '../db';

// Trae todos los asegurados (policy holders) con sus órdenes, pólizas, autos y pagos (anidado)
export const getUsersReport = async (req: Request, res: Response) => {
  try {
    // 1. Obtener todos los policy holders únicos
    const [holders]: any = await pool.query('SELECT DISTINCT policy_holder_document_number, policy_holder, policy_holder_type_document FROM orders');
    for (const holder of holders) {
      // 2. Obtener todas las órdenes de este policy holder
      const [orders]: any = await pool.query('SELECT * FROM orders WHERE policy_holder_document_number = ?', [holder.policy_holder_document_number]);
      for (const order of orders) {
        // 3. Obtener pólizas asociadas a la orden
        const [policies]: any = await pool.query('SELECT * FROM policies WHERE order_id = ?', [order.id]);
        for (const policy of policies) {
          // 4. Auto asociado a la póliza
          const [cars]: any = await pool.query('SELECT * FROM cars WHERE id = ?', [policy.car_id]);
          policy.car = cars[0] || null;
          // 5. Pagos asociados a la póliza
          const [payments]: any = await pool.query('SELECT * FROM payments WHERE policy_id = ?', [policy.policy_id]);
          policy.payments = payments;
        }
        order.policies = policies;
      }
      holder.orders = orders;
    }
    res.json(holders);
  } catch (error) {
    console.error('Error al obtener el reporte de asegurados:', error);
    res.status(500).json({ error: 'Error interno al obtener el reporte de asegurados' });
  }
};
