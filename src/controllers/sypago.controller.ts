import axios from 'axios';
import { Request, Response } from 'express';
import pool from '../db';
import { savePayment } from '../services/payment.service';

let sypagoAccessToken: string | null = null;

export const tasaBank = async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      'https://pruebas.sypago.net:8086/api/v1/bank/bcv/rate',
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error fetching BCV rate:', error);
    res.status(error.response?.status || 500).json({
      message: 'Error fetching BCV rate',
      error: error.message
    });
  }
};

export const bankOptions = async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      'https://pruebas.sypago.net:8086/api/v1/banks',
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error fetching bank options:', error);
    res.status(error.response?.status || 500).json({
      message: 'Error fetching bank options',
      error: error.message
    });
  }
};

export const sypagoAuth = async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      'https://pruebas.sypago.net:8086/api/v1/auth/token',
      {
        client_id: process.env.CLIENT_ID,
        secret: process.env.API_KEY
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    sypagoAccessToken = response.data.access_token;
    res.status(200).json(response.data);
  } catch (error: any) {
    console.error('Error al conectar con la API de SyPago:', error.message);
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    }
    res.status(error.response ? error.response.status : 500).json({
      error: 'Error al conectar con la API de SyPago',
      message: error.message
    });
  }
};

export const sypagoOtpRequest = async (req: Request, res: Response) => {
  try {
    if (!sypagoAccessToken) {
      return res.status(401).json({ error: 'No SyPago token. Autentíquese primero en /sypago/auth.' });
    }
    const datos = req.body;
    const response = await axios.post(
      'https://pruebas.sypago.net:8086/api/v1/request/otp',
      datos,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sypagoAccessToken}`
        }
      }
    );
    return res.status(200).json(response.data);
  } catch (err: any) {
    console.error('Error al conectar con la API de SyPago:', err.message);
    if (err.response) {
      console.error('Detalles del error:', err.response.data);
    }
    return res.status(err.response ? err.response.status : 500).json({
      error: 'Error al conectar con la API de SyPago',
      message: err.message
    });
  }
};


export const verifyPlateCtrl = async (req: Request, res: Response) => {
  try {
    const {
      policy_holder_type_document,
      policy_holder_document_number,
      plate,
    } = req.body;

    if (
      policy_holder_type_document === undefined ||
      policy_holder_document_number === undefined ||
      plate === undefined
    ) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const [cars]: any = await pool.query('SELECT id FROM cars WHERE plate = ?', [plate]);
    if (!Array.isArray(cars) || cars.length === 0) {
      return res.json({ message: 'La placa no existe' });
    }
    const carId = cars[0].id;

    const [orders]: any = await pool.query(
      'SELECT id FROM orders WHERE car_id = ? AND policy_holder_type_document = ? AND policy_holder_document_number = ?',
      [carId, policy_holder_type_document, policy_holder_document_number]
    );
    if (Array.isArray(orders) && orders.length > 0) {
      return res.json({ message: 'La placa ya existe' });
    }
    return res.json({ message: 'La placa no existe' });
  } catch (error) {
    return res.status(500).json({
      message: 'Error interno del servidor al verificar placa',
      error: (error as Error).message,
    });
  }
};


export const verifyCodeAndPay = async (req: Request, res: Response) => {
  try {
    const sypagoToken = req.headers['sypago-token'];
    if (!sypagoToken) {
      return res.status(401).json({ error: 'SyPago token no proporcionado. Acceso denegado.' });
    }
    const datos = req.body;
    const response = await axios.post(
      'https://pruebas.sypago.net:8086/api/v1/transaction/otp',
      datos,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sypagoToken}`
        }
      }
    );
    // Guardar el pago en la tabla payments
    // Se asume que policy_id, payment_amount, payment_method están en el body o se pueden obtener
    // const { policy_id, amount, payment_method } = datos;
    // const payment_amount = amount?.amt || 0;
    // const payment_date = new Date().toISOString().slice(0, 19).replace('T', ' ');
    // const transaction_id = response.data.transaction_id;
    // if (policy_id && payment_amount && payment_method && transaction_id) {
    //   await savePayment({
    //     policy_id,
    //     payment_amount,
    //     payment_date,
    //     payment_method,
    //     transaction_id
    //   });
    // }

    console.log(response);
    
    return res.status(200).json(response.data);
  } catch (err: any) {
    console.error('Error al validar OTP y ejecutar pago:', err.message);
    if (err.response) {
      console.error('Detalles del error:', err);
    }
    return res.status(err.response ? err.response.status : 500).json({
      error: 'Error al validar OTP y ejecutar pago',
      message: err.message
    });
  }
};


export const notificationSypago = async (req: Request, res: Response) => {
  try {
    const { id_transaction } = req.body;
    if (!id_transaction) {
      return res.status(400).json({ error: 'id_transaction es requerido' });
    }
    // Consultar a SyPago en tiempo real
    if (!sypagoAccessToken) {
      return res.status(401).json({ status: false, message: 'No SyPago token. Autentíquese primero en /sypago/auth.' });
    }
    const response = await axios.get(
      `https://pruebas.sypago.net:8086/api/v1/transaction/${id_transaction}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sypagoAccessToken}`
        }
      }
    );
    const status = response.data.status || 'PENDING';
    // // Actualizar el status en la base de datos si existe
    // await pool.query('UPDATE payments SET status = ? WHERE transaction_id = ?', [status, id_transaction]);
    return res.status(200).json( response.data );
  } catch (err: any) {
    console.error('Error en la notificación:', err);
    return res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
};
