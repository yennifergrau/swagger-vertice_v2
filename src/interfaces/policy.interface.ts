export interface Policy {
  id?: number;
  order_id: number;
  car_id: number;
  policy_number: string;
  issue_date: string;
  start_date: string;
  end_date: string;
  policy_status: string; // Estado de la póliza (APPROVED, PENDING, ERROR)
  // Nuevos campos sugeridos:
  transaction_id?: string; // ID de la transacción de pago de SyPago
  payment_status?: string; // Estado final del pago (ACCP, RJCT) - crucial para la lógica de tu jefa
  pdf_url?: string;       // URL del PDF de la póliza generado
  // Campos de auditoría (ya los tienes)
  createdAt?: string;
  updatedAt?: string;
}