import axios from 'axios';
import { Request, Response } from 'express';

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

export const sypagoOtpCode = async (req: Request, res: Response) => {
  try {
    if (!sypagoAccessToken) {
      return res.status(401).json({ error: 'No SyPago token. Autentíquese primero en /sypago/auth.' });
    }
    const datos = req.body;
    const response = await axios.post(
      'https://pruebas.sypago.net:8086/api/v1/transaction/otp',
      datos,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sypagoAccessToken}`
        }
      }
    );
    console.log('Respuesta de OTP de Code:', response.data);
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
