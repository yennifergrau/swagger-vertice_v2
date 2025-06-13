import { Request, Response } from 'express';
import axios from 'axios';

export const getNotificationResult = async (req: Request, res: Response) => {
  try {
    const { id_transaction } = req.body;
    if (!id_transaction) {
      return res.status(400).json({ error: 'id_transaction es requerido' });
    }
    const response = await axios.get(
      `https://pruebas.sypago.net:8086/api/v1/transaction/${id_transaction}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    // Se espera que el status esté en response.data.status
    return res.status(200).json({ status: response.data.status });
  } catch (err: any) {
    console.error('Error al consultar el resultado de la transacción:', err.message);
    if (err.response) {
      console.error('Detalles del error:', err.response.data);
    }
    return res.status(err.response ? err.response.status : 500).json({
      error: 'Error al consultar el resultado de la transacción',
      message: err.message
    });
  }
};
