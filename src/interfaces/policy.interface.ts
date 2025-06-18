export interface Policy {
  id?: number;
  order_id: number;
  car_id: number;
  policy_number: string;
  issue_date: string;
  start_date: string;
  end_date: string;
  policy_status: string;   // Estado de la póliza (APPROVED, PENDING, ERROR)
  transaction_id?: string; // ID de la transacción de pago de SyPago
  payment_status?: string; // Estado final del pago (ACCP, RJCT)
  pdf_url?: string;        // URL del PDF de la póliza generado
  createdAt?: string;
  updatedAt?: string;
}