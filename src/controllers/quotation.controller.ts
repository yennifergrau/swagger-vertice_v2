// src/controllers/quotation.controller.ts
import { Request, Response } from 'express';
import quotationService from '../services/quotation.service';
import { QuotationRequest } from '../interfaces/quotation.interface';

class QuotationController {
  async quoteRCV(req: Request, res: Response) {
    try {
      const quotationRequest: QuotationRequest = req.body;

      // Validación básica del Request Body (considera usar un validador como Joi o Zod)
      if (!quotationRequest.data || !quotationRequest.data.generalData || !quotationRequest.data.carData) {
        return res.status(400).json({ message: 'Request Body incompleto. Faltan generalData o carData.' });
      }
      // Podrías añadir más validaciones específicas aquí

      const result = await quotationService.processQuotation(quotationRequest);
      res.status(200).json(result);

    } catch (error) {
      console.error('Error al cotizar RCV:', error);
      res.status(500).json({ message: 'Error interno del servidor al cotizar', error: (error as Error).message });
    }
  }
}

export default new QuotationController();