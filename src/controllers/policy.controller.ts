import { Request, Response } from 'express';
const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
import { insertPolicy } from '../services/policy.service';
import pool from '../config/db';
import { fillPdfTemplate } from '../utils/fillPdfTemplate'

export const authorizePolicy = async (req: Request, res: Response) => {
  try {
    const { orden_id, carData, generalData, generalDataTomador, isTomador } = req.body;
    if (!orden_id || !carData || !generalData) {
      return res.status(400).json({
        error: 'Datos incompletos o inválidos'
      });
    }

    const [orders]: any = await pool.query('SELECT * FROM orders WHERE id = ?', [orden_id]);
    if (!orders || orders.length === 0) {
      return res.status(400).json({
        error: `El orden_id ${orden_id} no existe en la tabla orders.`
      });
    }
    const order = orders[0];
    const carId = order.car_id;
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

    const ahora = new Date();
    const expiracion = new Date();
    expiracion.setFullYear(expiracion.getFullYear() + 1);

      const formatDate = (fecha: Date) => {
      const dia = String(fecha.getDate()).padStart(2, '0');
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const año = fecha.getFullYear();
      const hora = String(fecha.getHours()).padStart(2, '0');
      const min = String(fecha.getMinutes()).padStart(2, '0');
      const sec = String(fecha.getSeconds()).padStart(2, '0');
      return {
        fecha: `${dia}/${mes}/${año}`,
        hora: `${hora}:${min}:${sec}`
      };
    };

    const { fecha: fecha_creacion, hora: hora_creacion } = formatDate(ahora);
    const { fecha: fecha_expiracion, hora: hora_expiracion } = formatDate(expiracion);

    const numeroPoliza = 'POL' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

    await insertPolicy({
      order_id: Number(orden_id),
      car_id: carId,
      policy_number: numeroPoliza,
      issue_date: `${ahora.getFullYear()}-${(ahora.getMonth()+1).toString().padStart(2,'0')}-${ahora.getDate().toString().padStart(2,'0')}`,
      start_date: `${ahora.getFullYear()}-${(ahora.getMonth()+1).toString().padStart(2,'0')}-${ahora.getDate().toString().padStart(2,'0')}`,
      end_date: `${expiracion.getFullYear()}-${(expiracion.getMonth()+1).toString().padStart(2,'0')}-${expiracion.getDate().toString().padStart(2,'0')}`,
      policy_status: 'APPROVED'
    });


    const datosPdf = {
      ...generalData,
      ...carData,
      policy_holder_type_document: generalData.policy_holder_type_document || 'V',
      numero_poliza: numeroPoliza,
      orden_id,
      car_id: carId,
      fecha_creacion,
      hora_creacion,
      fecha_expiracion,
      hora_expiracion
    };

     const outputPath = path.join(__dirname, '../../public/polizas', `${numeroPoliza}.pdf`);
    await fillPdfTemplate(datosPdf, outputPath);

    return res.status(201).json({
      estado: 'APPROVED',
      numero_poliza: numeroPoliza,
      url_pdf: `http://localhost:4500/public/polizas/${numeroPoliza}.pdf`
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
