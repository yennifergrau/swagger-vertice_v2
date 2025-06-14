import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

interface PdfData {
  policy_holder: string;
  policy_holder_type_document: string;
  policy_holder_document_number: string;
  policy_holder_address: string;
  policy_holder_state: string;
  policy_holder_city: string;
  policy_holder_municipality: string;
  isseur_store: string;
  orden_id: string;
  numero_poliza: string;
  fecha_creacion: string;
  hora_creacion: string;
  fecha_expiracion: string;
  hora_expiracion: string;
  plate: string;
  brand: string;
  model: string;
  version: string;
  year: string;
  color: string;
  gearbox: string;
  carroceria_serial_number: string;
  motor_serial_number: string;
  type_vehiculo: string;
  use: string;
  passenger_qty: string;
  driver: string;
  // use_grua?: boolean;
}

export const fillPdfTemplate = async (data: PdfData, outputPath: string) => {
  const templatePath = path.join(__dirname, './plantilla_rcv.pdf');
  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  const toUpper = (value: string) => String(value || '').toUpperCase();

  const fields = form.getFields();
  fields.forEach((field) => {
    console.log('Field name:', field.getName());
  });

  form.getTextField('policy_holder').setText(toUpper(data.policy_holder));
  form.getTextField('full_document').setText(toUpper(`${data.policy_holder_type_document} ${data.policy_holder_document_number}`));
  form.getTextField('policy_holder_address').setText(toUpper(data.policy_holder_address));
  form.getTextField('policy_holder_state').setText(toUpper(data.policy_holder_state));
  form.getTextField('policy_holder_city').setText(toUpper(data.policy_holder_city));
  form.getTextField('policy_holder_municipality').setText(toUpper(data.policy_holder_municipality));
  form.getTextField('isseur_store').setText(toUpper(data.isseur_store));
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
  form.getTextField('year').setText(toUpper(data.year));
  form.getTextField('color').setText(toUpper(data.color));
  form.getTextField('gearbox').setText(toUpper(data.gearbox));
  form.getTextField('carroceria_serial_number').setText(toUpper(data.carroceria_serial_number));
  form.getTextField('motor_serial_number').setText(toUpper(data.motor_serial_number));
  form.getTextField('type_vehiculo').setText(toUpper(data.type_vehiculo));
  form.getTextField('use').setText(toUpper(data.use));
  form.getTextField('passenger_qty').setText(toUpper(data.passenger_qty));
  form.getTextField('driver').setText(toUpper(data.driver));

  form.flatten();

  const finalPdf = await pdfDoc.save();
  fs.writeFileSync(outputPath, finalPdf);
};
