// src/services/quotation.service.ts
import pool from '../db';
import { QuotationRequest, QuotationResult, CarData, GeneralData, GeneralDataTomador, CotizacionRecord } from '../interfaces/quotation.interface';
import carService from './car.service';
import { Car } from '../interfaces/car.interface';
import { ResultSetHeader } from 'mysql2/promise';

class QuotationService {
  private async calculateQuotation(carData: CarData): Promise<QuotationResult> {
    // Lógica SIMULADA para calcular la prima y coberturas
    // En un caso real, esto sería mucho más complejo, usando tablas de tarifas,
    // reglas de negocio, etc., quizás incluso un servicio externo.
    let dolarPrima = 0;
    let bsPrima = 0;
    let danosPersonas = 0;
    let danosCosas = 0;

    // Simulación basada en el año y el uso_grua
    if (carData.year >= 2020 && carData.use_grua) {
      dolarPrima = 35.00;
      bsPrima = dolarPrima * 36.5; // Tasa de cambio simulada
      danosPersonas = 5000;
      danosCosas = 4000;
    } else if (carData.year >= 2010) {
      dolarPrima = 20.50;
      bsPrima = dolarPrima * 36.35;
      danosPersonas = 2505;
      danosCosas = 2000;
    } else {
      dolarPrima = 15.00;
      bsPrima = dolarPrima * 36.20;
      danosPersonas = 1500;
      danosCosas = 1000;
    }

    return {
      primaTotal: { dolar: parseFloat(dolarPrima.toFixed(2)), bs: parseFloat(bsPrima.toFixed(2)) },
      coberturas: { danosPersonas, danosCosas }
    };
  }

  async processQuotation(quotationRequest: QuotationRequest): Promise<QuotationResult> {
    const { generalData, carData, generalDataTomador } = quotationRequest.data;

    // 1. Guardar o encontrar el vehículo
    let carRecord: Car | null = await carService.findCarByPlate(carData.plate);
    if (!carRecord) {
      // Si el vehículo no existe, crearlo
      const newCarData: Omit<Car, 'id' | 'createdAt' | 'updatedAt'> = {
        ...carData,
        use_type: carData.use // Mapear 'use' del request a 'use_type' para la DB
      };
      carRecord = await carService.createCar(newCarData);
    } else {
      // Opcional: Actualizar datos del vehículo si es necesario
      // Por simplicidad, aquí no se actualiza, pero podrías añadir lógica de actualización
    }

    if (!carRecord || !carRecord.id) {
        throw new Error('No se pudo obtener o crear el registro del vehículo.');
    }

    // 2. Calcular la cotización
    const quotationResult = await this.calculateQuotation(carData);

    // 3. Guardar la cotización en la base de datos
    const cotizacionRecord: Omit<CotizacionRecord, 'id' | 'createdAt' | 'updatedAt'> = {
      car_id: carRecord.id,
      policy_holder_type_document: generalData.policy_holder_type_document,
      policy_holder_document_number: generalData.policy_holder_document_number.toString(),
      policy_holder_phone: generalData.policy_holder_phone,
      policy_holder_email: generalData.policy_holder_email,
      policy_holder: generalData.policy_holder,
      policy_holder_address: generalData.policy_holder_address,
      policy_holder_state: generalData.policy_holder_state,
      policy_holder_city: generalData.policy_holder_city,
      policy_holder_municipality: generalData.policy_holder_municipality,
      isseur_store: generalData.isseur_store,
      prima_total_dolar: quotationResult.primaTotal.dolar,
      prima_total_bs: quotationResult.primaTotal.bs,
      danos_personas: quotationResult.coberturas.danosPersonas,
      danos_cosas: quotationResult.coberturas.danosCosas,
      ...(generalDataTomador && { // Incluir datos del tomador solo si existen
        insured_type_document: generalDataTomador.type_document,
        insured_document_number: generalDataTomador.insured_document.toString(),
        insured_phone: generalDataTomador.insured_phone,
        insured_email: generalDataTomador.insured_email,
        insured: generalDataTomador.insured,
        insured_address: generalDataTomador.insured_address,
        insured_state: generalDataTomador.insured_state,
        insured_city: generalDataTomador.insured_city,
        insured_municipality: generalDataTomador.insured_municipality,
        insured_isseur_store: generalDataTomador.isseur_store,
      })
    };

    // Validación y log para depuración
    const insertValues = [
      cotizacionRecord.car_id,
      cotizacionRecord.policy_holder_type_document,
      cotizacionRecord.policy_holder_document_number,
      cotizacionRecord.policy_holder_phone ?? null,
      cotizacionRecord.policy_holder_email ?? null,
      cotizacionRecord.policy_holder,
      cotizacionRecord.policy_holder_address ?? null,
      cotizacionRecord.policy_holder_state ?? null,
      cotizacionRecord.policy_holder_city ?? null,
      cotizacionRecord.policy_holder_municipality ?? null,
      cotizacionRecord.isseur_store ?? null,
      cotizacionRecord.prima_total_dolar,
      cotizacionRecord.prima_total_bs,
      cotizacionRecord.danos_personas,
      cotizacionRecord.danos_cosas,
      cotizacionRecord.insured_type_document ?? null,
      cotizacionRecord.insured_document_number ?? null,
      cotizacionRecord.insured_phone ?? null,
      cotizacionRecord.insured_email ?? null,
      cotizacionRecord.insured ?? null,
      cotizacionRecord.insured_address ?? null,
      cotizacionRecord.insured_state ?? null,
      cotizacionRecord.insured_city ?? null,
      cotizacionRecord.insured_municipality ?? null,
      cotizacionRecord.insured_isseur_store ?? null
    ];
    if (insertValues.some(v => v === undefined)) {
      throw new Error('Uno de los valores a insertar es undefined: ' + JSON.stringify(insertValues));
    }
    console.log('Valores para insertar en orders:', insertValues);
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO orders (
        car_id, policy_holder_type_document, policy_holder_document_number,
        policy_holder_phone, policy_holder_email, policy_holder, policy_holder_address,
        policy_holder_state, policy_holder_city, policy_holder_municipality, isseur_store,
        prima_total_dolar, prima_total_bs, danos_personas, danos_cosas,
        insured_type_document, insured_document_number, insured_phone, insured_email,
        insured, insured_address, insured_state, insured_city, insured_municipality,
        insured_isseur_store
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertValues
    );

    // No es necesario retornar el registro completo guardado, solo el resultado de la cotización
    return quotationResult;
  }
}

export default new QuotationService();