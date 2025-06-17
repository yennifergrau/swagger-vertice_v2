import { Request, Response } from 'express';
import quotationService from '../services/quotation.service';
import { QuotationRequest, QuotationResult } from '../interfaces/quotation.interface';

class QuotationController {
  async quoteRCV(req: Request, res: Response): Promise<void> {
    try {
      const quotationRequest: QuotationRequest = req.body;

      if (!quotationRequest.data || !quotationRequest.data.generalData || !quotationRequest.data.carData) {
        res.status(400).json({ message: 'Request Body incompleto. Faltan generalData o carData.' });
        return;
      }

      const { carData } = quotationRequest.data;
      if (carData.type_plate.toLowerCase() !== 'nacional' && carData.type_plate.toLowerCase() !== 'extranjera') {
        res.status(400).json({ message: "Tipo de placa debe ser 'nacional' o 'extranjera'." });
        return;
      }
      if (!carData.type_vehiculo || !carData.use) {
          res.status(400).json({ message: 'Datos del vehículo (type_vehiculo o use) incompletos para la cotización.' });
          return;
      }

      // Delega la lógica de negocio al servicio
      const result: QuotationResult = await quotationService.processQuotation(quotationRequest);

      res.status(200).json(result);

    } catch (error: any) {
      console.error('Error al cotizar RCV:', error);
      // ** Manejo de errores específicos **
      if (error.message.includes('Error de validación: Ya existe un vehículo con la placa')) {
        res.status(409).json({ message: error.message });
      } else if (error.message.includes('No se encontró tarifa')) {
        res.status(404).json({ message: error.message });
      } else if (error.message.includes('tasa de cambio')) {
        res.status(503).json({ message: 'Error al obtener la tasa de cambio: ' + error.message });
      } else if (error.message.includes('servicio de coche') || error.message.includes('registro de cotización')) {
        res.status(500).json({ message: 'Error al procesar datos del vehículo o guardar la cotización: ' + error.message });
      } else {
        // Otros errores inesperados
        res.status(500).json({ message: 'Error interno del servidor al cotizar.', error: error.message });
      }
    }
  }
}

export default new QuotationController();