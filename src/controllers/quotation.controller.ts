// src/controllers/quotation.controller.ts
import { Request, Response } from 'express';
import quotationService from '../services/quotation.service';
import { QuotationRequest } from '../interfaces/quotation.interface';

class QuotationController {
  async quoteRCV(req: Request, res: Response) {
    try {
      const quotationRequest: QuotationRequest = req.body;

      if (!quotationRequest.data || !quotationRequest.data.generalData || !quotationRequest.data.carData) {
        return res.status(400).json({ message: 'Request Body incompleto. Faltan generalData o carData.' });
      }

      // Inyectar el user_id del usuario autenticado
      // Ahora ambos (req.user.id y quotationRequest.data.generalData.user_id) son string
      // if (req.user && req.user.id) {
      //   quotationRequest.data.generalData.user_id = req.user.id; // ¡Esto ahora debería funcionar sin errores!
      // }

      const result = await quotationService.processQuotation(quotationRequest);
      res.status(200).json(result);

    } catch (error) {
      console.error('Error al cotizar RCV:', error);
      res.status(500).json({ message: 'Error interno del servidor al cotizar', error: (error as Error).message });
    }
  }
}

export default new QuotationController();