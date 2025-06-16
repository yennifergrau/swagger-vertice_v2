import pool from '../config/db';

export interface PaymentData {
  policy_id: number;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
}

export async function savePayment(payment: PaymentData) {
  const { policy_id, payment_amount, payment_date, payment_method, transaction_id } = payment;
  const [result]: any = await pool.query(
    `INSERT INTO payments (policy_id, payment_amount, payment_date, payment_method, transaction_id, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [policy_id, payment_amount, payment_date, payment_method, transaction_id]
  );
  return result.insertId;
}
