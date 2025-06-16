import pool from '../config/db';

export interface PaymentData {
  order_id: number;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
}

export async function savePayment(payment: PaymentData) {
  const { order_id, payment_amount, payment_date, payment_method, transaction_id } = payment;
  const [result]: any = await pool.query(
    `INSERT INTO payments (order_id, payment_amount, payment_date, payment_method, transaction_id, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [order_id, payment_amount, payment_date, payment_method, transaction_id]
  );
  return result.insertId;
}
