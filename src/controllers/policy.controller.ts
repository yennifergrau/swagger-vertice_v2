import { Request, Response } from 'express';
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
import { insertPolicy } from '../services/policy.service';
import pool from '../db';

async function fillPdfTemplate(data: any, outputPath: string) {
  const templatePath = path.join(__dirname, '..', 'generatePDF', 'plantilla_rcv.pdf');
  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  fields.forEach((field: any) => {
    console.log('Field name:', field.getName());
  });
  const toUpper = (value: any) => String(value).toUpperCase();
  form.getTextField('policy_holder').setText(toUpper(data.policy_holder));
  form.getTextField('full_document').setText(toUpper(data.policy_holder_type_document + ' ' + data.policy_holder_document_number));
  form.getTextField('policy_holder_address').setText(toUpper(data.policy_holder_address));
  form.getTextField('policy_holder_state').setText(toUpper(data.policy_holder_state));
  form.getTextField('policy_holder_city').setText(toUpper(data.policy_holder_city));
  form.getTextField('policy_holder_municipality').setText(toUpper(data.policy_holder_municipality));
  form.getTextField('issuer_store').setText(toUpper(data.issuer_store));
  form.getTextField('orden_id').setText(toUpper(data.orden_id));
  form.getTextField('numero_poliza').setText(toUpper(data.numero_poliza));
  form.getTextField('fecha_creacion').setText(toUpper(data.fecha_creacion));
  form.getTextField('hora_creacion').setText(toUpper(data.hora_creacion));
  form.getTextField('fecha_expiracion').setText(toUpper(data.fecha_expiracion));
  form.getTextField('hora_expiracion').setText(toUpper(data.hora_expiracion));
  form.getTextField('plate').setText(toUpper(data.plate));
  form.getTextField('brand').setText(toUpper(data.brand));
  form.getTextField('model').setText(toUpper(data.model));
  form.getTextField('version').setText(toUpper(data.version));
  form.getTextField('year').setText(toUpper(data.year.toString()));
  form.getTextField('color').setText(toUpper(data.color));
  form.getTextField('gearbox').setText(toUpper(data.gearbox));
  form.getTextField('carroceria_serial_number').setText(toUpper(data.carroceria_serial_number));
  form.getTextField('motor_serial_number').setText(toUpper(data.motor_serial_number));
  form.getTextField('type_vehiculo').setText(toUpper(data.type_vehiculo));
  form.getTextField('use').setText(toUpper(data.use));
  form.getTextField('passenger_qty').setText(toUpper(data.passenger_qty.toString()));
  form.getTextField('driver').setText(toUpper(data.driver));
  // form.getTextField('use_grua').setText(data.use_grua ? 'SÍ' : 'NO');
  form.flatten();
  const finalPdf = await pdfDoc.save();
  fs.writeFileSync(outputPath, finalPdf);
}

export const authorizePolicy = async (req: Request, res: Response) => {
  try {
    const { orden_id, carData, generalData, generalDataTomador, isTomador } = req.body;
    if (!orden_id || !carData || !generalData) {
      return res.status(400).json({
        error: 'Datos incompletos o inválidos'
      });
    }
    // Verificar si ya existe una póliza vigente para este carro
    const carId = carData.car_id || 0;
    const hoy = new Date();
    const hoyStr = hoy.toISOString().slice(0, 10); // YYYY-MM-DD
    const [vigente]: any = await pool.query(
      'SELECT * FROM policies WHERE car_id = ? AND policy_status = ? AND end_date >= ?',
      [carId, 'APPROVED', hoyStr]
    );
    if (vigente && vigente.length > 0) {
      return res.status(409).json({
        error: 'Ya existe una póliza vigente para este vehículo.'
      });
    }
    // Fechas
    const ahora = new Date();
    const expiracion = new Date();
    expiracion.setFullYear(expiracion.getFullYear() + 1);
    // Generar número de póliza
    const numeroPoliza = 'POL' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    // Guardar en base de datos (tabla policies)
    await insertPolicy({
      order_id: Number(orden_id),
      car_id: carData.car_id || 0,
      policy_number: numeroPoliza,
      issue_date: `${ahora.getFullYear()}-${(ahora.getMonth()+1).toString().padStart(2,'0')}-${ahora.getDate().toString().padStart(2,'0')}`,
      start_date: `${ahora.getFullYear()}-${(ahora.getMonth()+1).toString().padStart(2,'0')}-${ahora.getDate().toString().padStart(2,'0')}`,
      end_date: `${expiracion.getFullYear()}-${(expiracion.getMonth()+1).toString().padStart(2,'0')}-${expiracion.getDate().toString().padStart(2,'0')}`,
      policy_status: 'APPROVED'
    });
    return res.status(201).json({
      estado: 'APPROVED',
      numero_poliza: numeroPoliza
    });
  } catch (error: any) {
    console.error('Error en authorizePolicy:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
};

export const confirmPolicy = async (req: Request, res: Response) => {
  try {
    const { reference, status } = req.body;
    try {
      await require('../services/policy.service').confirmPolicyStatus(reference, status);
    } catch (e: any) {
      return res.status(400).json({ message: e.message });
    }
    return res.status(200).json({
      message: 'Confirmación exitosa',
      status: true,
      estado: status
    });
  } catch (e: any) {
    console.error('Error al confirmar póliza:', e);
    return res.status(500).json({ message: 'Error interno del servidor.', error: e.message });
  }
};
