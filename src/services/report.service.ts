import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import pool from '../db';

export async function generatePolicyReport({ order_id, numero_poliza }: { order_id?: number, numero_poliza?: string }): Promise<string> {
  // Buscar datos en la base de datos
  let order: any, car: any;
  if (order_id) {
    // Validar que el order_id exista en la tabla orders
    const [orders]: any = await pool.query('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (!orders.length) throw new Error(`El order_id ${order_id} no existe en la tabla orders.`);
    order = orders[0];
    const [cars]: any = await pool.query('SELECT * FROM cars WHERE id = ?', [order.car_id]);
    if (!cars.length) throw new Error('Vehículo no encontrado');
    car = cars[0];
  } else if (numero_poliza) {
    // Buscar por número de póliza
    const [policies]: any = await pool.query('SELECT * FROM policies WHERE policy_number = ?', [numero_poliza]);
    if (!policies.length) throw new Error('Póliza no encontrada');
    const policy = policies[0];
    if (!policy.order_id) throw new Error('La póliza no tiene un order_id asociado');
    // Validar que el order_id exista en la tabla orders
    const [orders]: any = await pool.query('SELECT * FROM orders WHERE id = ?', [policy.order_id]);
    if (!orders.length) throw new Error(`No existe la orden asociada a la póliza (${policy.order_id})`);
    order = orders[0];
    const [cars]: any = await pool.query('SELECT * FROM cars WHERE id = ?', [order.car_id]);
    if (!cars.length) throw new Error('Vehículo no encontrado');
    car = cars[0];
  } else {
    throw new Error('Debe proporcionar order_id o numero_poliza');
  }

  // Ruta de la plantilla
  const templatePath = path.join(__dirname, '..', 'generatePDF', 'plantilla_rcv.pdf');
  const outputDir = path.join(__dirname, '..', '..', 'public', 'poliza');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  // Nombre único para el PDF
  const fileName = `poliza_${order.numero_poliza || numero_poliza || Date.now()}.pdf`;
  const outputPath = path.join(outputDir, fileName);

  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // Rellenar campos según la plantilla
  const toUpper = (value: any) => String(value ?? '').toUpperCase();
  try {
    form.getTextField('policy_holder').setText(toUpper(order.policy_holder));
    form.getTextField('full_document').setText(toUpper(order.policy_holder_type_document + ' ' + order.policy_holder_document_number));
    form.getTextField('policy_holder_address').setText(toUpper(order.policy_holder_address));
    form.getTextField('policy_holder_state').setText(toUpper(order.policy_holder_state));
    form.getTextField('policy_holder_city').setText(toUpper(order.policy_holder_city));
    form.getTextField('policy_holder_municipality').setText(toUpper(order.policy_holder_municipality));
    form.getTextField('issuer_store').setText(toUpper(order.issuer_store));
    form.getTextField('orden_id').setText(toUpper(order.id));
    form.getTextField('numero_poliza').setText(toUpper(order.numero_poliza || numero_poliza));
    form.getTextField('fecha_creacion').setText(toUpper(order.createdAt ? order.createdAt.toISOString().slice(0,10) : ''));
    form.getTextField('hora_creacion').setText('');
    form.getTextField('fecha_expiracion').setText('');
    form.getTextField('hora_expiracion').setText('');
    form.getTextField('plate').setText(toUpper(car.plate));
    form.getTextField('brand').setText(toUpper(car.brand));
    form.getTextField('model').setText(toUpper(car.model));
    form.getTextField('version').setText(toUpper(car.version));
    form.getTextField('year').setText(toUpper(car.year?.toString()));
    form.getTextField('color').setText(toUpper(car.color));
    form.getTextField('gearbox').setText(toUpper(car.gearbox));
    form.getTextField('carroceria_serial_number').setText(toUpper(car.carroceria_serial_number));
    form.getTextField('motor_serial_number').setText(toUpper(car.motor_serial_number));
    form.getTextField('type_vehiculo').setText(toUpper(car.type_vehiculo));
    form.getTextField('use').setText(toUpper(car.use_type));
    form.getTextField('passenger_qty').setText(toUpper(car.passenger_qty?.toString()));
    form.getTextField('driver').setText(toUpper(car.driver));
    // form.getTextField('use_grua').setText(car.use_grua ? 'SÍ' : 'NO');
    form.flatten();
  } catch (e) {
    // Si algún campo no existe, ignorar el error
  }
  const finalPdf = await pdfDoc.save();
  fs.writeFileSync(outputPath, finalPdf);

  // Retornar la URL pública
  return `/poliza/${fileName}`;
}
