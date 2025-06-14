import { Request, Response } from 'express';
import { generatePolicyReport } from '../services/report.service';

export const generateReport = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    // El servicio genera el PDF y devuelve la URL
    const url_pdf = await generatePolicyReport(data);
    res.status(200).json({
      status: 'APPROVED',
      url_pdf
    });
  } catch (error: any) {
    console.error('Error generando el reporte PDF:', error);
    res.status(500).json({
      status: 'ERROR',
      message: error.message
    });
  }
};
