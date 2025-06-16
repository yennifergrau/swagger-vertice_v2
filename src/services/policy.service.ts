import pool from '../config/db';

export async function getOrderAndCarData(orderId: number) {
  // Busca la orden y el auto asociado
  const [orders]: any = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (!Array.isArray(orders) || orders.length === 0) {
    throw new Error('Orden no encontrada');
  }
  const order = orders[0];
  const [cars]: any = await pool.query('SELECT * FROM cars WHERE id = ?', [order.car_id]);
  if (!Array.isArray(cars) || cars.length === 0) {
    throw new Error('Auto no encontrado');
  }
  const car = cars[0];
  return { order, car };
}

export async function insertPolicy({ order_id, car_id, policy_number, issue_date, start_date, end_date, policy_status }: {
  order_id: number,
  car_id: number,
  policy_number: string,
  issue_date?: string,
  start_date?: string,
  end_date?: string,
  policy_status?: string
}) {
  // Asegura que las fechas estén en formato YYYY-MM-DD
  const today = new Date();
  const defaultDate = today.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const _issue_date = issue_date ? issue_date.slice(0, 10) : defaultDate;
  const _start_date = start_date ? start_date.slice(0, 10) : defaultDate;
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);
  const _end_date = end_date ? end_date.slice(0, 10) : nextYear.toISOString().slice(0, 10);

  const [result]: any = await pool.query(
    `INSERT INTO policies (order_id, car_id, policy_number, issue_date, start_date, end_date, policy_status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [order_id, car_id, policy_number, _issue_date, _start_date, _end_date, policy_status || 'APPROVED']
  );
  return result.insertId;
}

// Servicio para confirmar póliza y actualizar estado
export async function confirmPolicyStatus(reference: string, status: string) {
  // Validaciones
  if (!reference || typeof reference !== 'string' || reference.length > 100) {
    throw new Error('reference es requerido y debe ser un string válido.');
  }
  if (!status || typeof status !== 'string' || status.length > 20) {
    throw new Error('status es requerido y debe ser un string válido.');
  }
  const validStatuses = ['APPROVED', 'ERROR', 'PENDING'];
  if (!validStatuses.includes(status)) {
    throw new Error(`status debe ser uno de: ${validStatuses.join(', ')}`);
  }
  // Actualizar en la base de datos
  const [result]: any = await pool.query(
    'UPDATE policies SET policy_status = ? WHERE policy_number = ?',
    [status, reference]
  );
  if (result.affectedRows === 0) {
    throw new Error('No se encontró la póliza con ese reference.');
  }
  return { status, reference };
}
