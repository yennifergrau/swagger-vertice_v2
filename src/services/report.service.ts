import { PDFDocument } from 'pdf-lib';
import * as fs from 'fs';
import * as path from 'path';
import pool from '../db';

export async function generatePolicyReport({ order_id, numero_poliza }: { order_id?: number, numero_poliza?: string }): Promise<string> {
  let order: any, car: any, policy: any;
  if (order_id) {
    const [orders]: any = await pool.query('SELECT * FROM orders WHERE id = ?', [order_id]);
    if (!orders.length) throw new Error(`El order_id ${order_id} no existe en la tabla orders.`);
    order = orders[0];
    const [cars]: any = await pool.query('SELECT * FROM cars WHERE id = ?', [order.car_id]);
    if (!cars.length) throw new Error('Vehículo no encontrado');
    car = cars[0];
    const [policies]: any = await pool.query('SELECT * FROM policies WHERE order_id = ?', [order_id]);
    policy = policies.length ? policies[0] : {};
  } else if (numero_poliza) {
    const [policies]: any = await pool.query('SELECT * FROM policies WHERE policy_number = ?', [numero_poliza]);
    if (!policies.length) throw new Error('Póliza no encontrada');
    policy = policies[0];
    if (!policy.order_id) throw new Error('La póliza no tiene un order_id asociado');
    const [orders]: any = await pool.query('SELECT * FROM orders WHERE id = ?', [policy.order_id]);
    if (!orders.length) throw new Error(`No existe la orden asociada a la póliza (${policy.order_id})`);
    order = orders[0];
    const [cars]: any = await pool.query('SELECT * FROM cars WHERE id = ?', [order.car_id]);
    if (!cars.length) throw new Error('Vehículo no encontrado');
    car = cars[0];
  } else {
    throw new Error('Debe proporcionar order_id o numero_poliza');
  }

  const templatePath = path.join(__dirname, '..', 'generatePDF', 'plantilla_rcv.pdf');
  const outputDir = path.join(__dirname, '..', '..', 'public', 'poliza');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const fileName = `poliza_${policy?.policy_number || numero_poliza || Date.now()}.pdf`;
  const outputPath = path.join(outputDir, fileName);

  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // Obtener todos los campos del PDF y llenarlos dinámicamente
  const fields = form.getFields();
  const allData = { ...order, ...car, ...policy };
  fields.forEach(field => {
    const name = field.getName();
    let value = allData[name];
    if (value === undefined && name in allData === false) {
      value = allData[name.toLowerCase()] || allData[name.toUpperCase()] || allData[name.replace(/_/g, '')];
    }
    if (value !== undefined) {
      // Solo setText si es un campo de texto
      if (typeof (field as any).setText === 'function') {
        try {
          (field as any).setText(String(value));
        } catch (e) {
          // Si falla, ignorar
        }
      }
    }
  });
  form.flatten();
  const finalPdf = await pdfDoc.save();
  fs.writeFileSync(outputPath, finalPdf);
  return `/poliza/${fileName}`;
}
