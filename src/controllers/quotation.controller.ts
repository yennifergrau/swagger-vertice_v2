// src/controllers/quotation.controller.ts
import { Request, Response } from 'express';
import quotationService from '../services/quotation.service'; // Import the service instance
import { QuotationRequest, QuotationResult } from '../interfaces/quotation.interface'; // Ensure QuotationResult is also imported for typing

class QuotationController {
  async quoteRCV(req: Request, res: Response): Promise<void> { // Specify Promise<void> for clarity
    try {
      const quotationRequest: QuotationRequest = req.body;

      // Basic validation of the Request Body
      // You should consider using a robust validator like Joi or Zod for production
      if (!quotationRequest.data || !quotationRequest.data.generalData || !quotationRequest.data.carData) {
        res.status(400).json({ message: 'Request Body incompleto. Faltan generalData o carData.' });
        return; // Important to return after sending response
      }

      // Add more specific validations here if needed, before calling the service
      const { carData } = quotationRequest.data;
      if (carData.type_plate.toLowerCase() !== 'nacional' && carData.type_plate.toLowerCase() !== 'extranjera') {
        res.status(400).json({ message: "Tipo de placa debe ser 'nacional' o 'extranjera'." });
        return;
      }
      if (!carData.type_vehiculo || !carData.use) {
          res.status(400).json({ message: 'Datos del vehículo (type_vehiculo o use) incompletos para la cotización.' });
          return;
      }


      // Delegate the business logic to the service
      const result: QuotationResult = await quotationService.processQuotation(quotationRequest); // Call processQuotation

      res.status(200).json(result);

    } catch (error: any) { // Use 'any' for the error type if you're not strictly typing custom errors
      console.error('Error al cotizar RCV:', error); // Log the full error
      // Provide more specific error messages based on the error thrown from the service
      if (error.message.includes('No se encontró tarifa')) {
        res.status(404).json({ message: error.message });
      } else if (error.message.includes('tasa de cambio')) {
        res.status(503).json({ message: 'Error al obtener la tasa de cambio: ' + error.message });
      } else if (error.message.includes('servicio de coche') || error.message.includes('registro de cotización')) {
        res.status(500).json({ message: 'Error al procesar datos del vehículo o guardar la cotización: ' + error.message });
      }
      else {
        res.status(500).json({ message: 'Error interno del servidor al cotizar', error: (error as Error).message });
      }
    }
  }
}

export default new QuotationController(); // Export an instance of the controller