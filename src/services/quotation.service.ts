// src/services/quotation.service.ts
import pool from '../db';
import { QuotationRequest, QuotationResult, CarData, GeneralData, GeneralDataTomador, CotizacionRecord } from '../interfaces/quotation.interface';
import carService from './car.service';
import { Car } from '../interfaces/car.interface';
import { ResultSetHeader } from 'mysql2/promise';
import { getBcvRates } from './bcv.service';

class QuotationService {
  private async calculateQuotation(carData: CarData): Promise<QuotationResult> {
    // Usar la lógica de la referencia para obtener tarifas y coberturas
    function calcularClaseGrupo(tipoVehiculo: string, uso: string) {
      let claseGrupo = "";
      if (tipoVehiculo.toLowerCase() === "particular") {
        if (uso === "Hasta 800 kg. de peso") claseGrupo = "particular_1";
        else if (uso === "Más de 800 kg. de peso") claseGrupo = "particular_2";
        else if (uso === "Casas Móviles con Tracción propia") claseGrupo = "particular_3";
        else if (uso === "Auto – Escuela") claseGrupo = "particular_4";
        else if (uso === "Alquiler sin chofer") claseGrupo = "particular_5";
        else if (uso === "Alquiler con chofer, taxi o por puesto") claseGrupo = "particular_6";
        else claseGrupo = "particular_1";
      } else if (tipoVehiculo.toLowerCase() === "carga") {
        if (uso === "Hasta 2 TM") claseGrupo = "carga_7";
        else if (uso === "Más de 2 y hasta 5 TM") claseGrupo = "carga_8";
        else if (uso === "Más de 5 hasta 8 TM") claseGrupo = "carga_9";
        else if (uso === "Más de 8 hasta 12 TM") claseGrupo = "carga_10";
        else if (uso === "Más de 12 TM") claseGrupo = "carga_11";
        else claseGrupo = "carga_7";
      } else if (tipoVehiculo.toLowerCase() === "autobus") {
        claseGrupo = uso === "suburbano" ? "autobus_13"
                   : uso === "interurbano" ? "autobus_14"
                   : "autobus_12";
      } else if (tipoVehiculo.toLowerCase() === "minibus") {
        claseGrupo = uso === "suburbano" ? "minibus_16"
                   : uso === "interurbano" ? "minibus_17"
                   : "minibus_15";
      } else if (tipoVehiculo.toLowerCase().includes("rústico")) {
        claseGrupo = "rustico";
      } else if (tipoVehiculo.toLowerCase().includes("moto")) {
        claseGrupo = "moto";
      } else if (tipoVehiculo.toLowerCase().includes("motocarro")) {
        claseGrupo = "motocarro";
      } else if (tipoVehiculo.toLowerCase().includes("máquinas")) {
        claseGrupo = "Móviles";
      }
      return claseGrupo;
    }

    function getTarifas() {
      return {
        particular_1: { primaAnualEUR: 33, extranjera: { primaAnualEUR: 120 }, servicioGruaUSD: 80 },
        particular_2: { primaAnualEUR: 39, extranjera: { primaAnualEUR: 142 }, servicioGruaUSD: 80 },
        particular_3: { primaAnualEUR: 39, extranjera: { primaAnualEUR: 142 }, servicioGruaUSD: 120 },
        particular_4: { primaAnualEUR: 45, extranjera: { primaAnualEUR: 164 }, servicioGruaUSD: 80 },
        particular_5: { primaAnualEUR: 102, extranjera: { primaAnualEUR: 371 }, servicioGruaUSD: 80 },
        particular_6: { primaAnualEUR: 114, extranjera: { primaAnualEUR: 415 }, servicioGruaUSD: 80 },
        carga_7: { primaAnualEUR: 45, extranjera: { primaAnualEUR: 164 }, servicioGruaUSD: 120 },
        carga_8: { primaAnualEUR: 84, extranjera: { primaAnualEUR: 306 }, servicioGruaUSD: 140 },
        carga_9: { primaAnualEUR: 84, extranjera: { primaAnualEUR: 306 }, servicioGruaUSD: 0 },
        carga_10: { primaAnualEUR: 108, extranjera: { primaAnualEUR: 393 }, servicioGruaUSD: 0 },
        carga_11: { primaAnualEUR: 108, extranjera: { primaAnualEUR: 393 }, servicioGruaUSD: 0 },
        autobus_12: { primaAnualEUR: 114, extranjera: { primaAnualEUR: 415 }, servicioGruaUSD: 0 },
        autobus_13: { primaAnualEUR: 114, extranjera: { primaAnualEUR: 415 }, servicioGruaUSD: 0 },
        autobus_14: { primaAnualEUR: 258, extranjera: { primaAnualEUR: 939 }, servicioGruaUSD: 0 },
        minibus_15: { primaAnualEUR: 75, extranjera: { primaAnualEUR: 273 }, servicioGruaUSD: 0 },
        minibus_16: { primaAnualEUR: 75, extranjera: { primaAnualEUR: 273 }, servicioGruaUSD: 0 },
        minibus_17: { primaAnualEUR: 168, extranjera: { primaAnualEUR: 611 }, servicioGruaUSD: 0 },
        rustico: { primaAnualEUR: 75, extranjera: { primaAnualEUR: 273 }, servicioGruaUSD: 100 },
        moto: { primaAnualEUR: 15, extranjera: { primaAnualEUR: 55 }, servicioGruaUSD: 80 },
        motocarro: { primaAnualEUR: 21, extranjera: { primaAnualEUR: 76 }, servicioGruaUSD: 80 },
        Móviles: { primaAnualEUR: 30, extranjera: { primaAnualEUR: 109 }, servicioGruaUSD: 0 }
      };
    }

    function getCoberturas() {
      return {
        particular_1: { danosCosasEUR: 2000, danosPersonasEUR: 2505 },
        particular_2: { danosCosasEUR: 2000, danosPersonasEUR: 2505 },
        particular_3: { danosCosasEUR: 2000, danosPersonasEUR: 2505 },
        particular_4: { danosCosasEUR: 2252, danosPersonasEUR: 3315 },
        particular_5: { danosCosasEUR: 2252, danosPersonasEUR: 3315 },
        particular_6: { danosCosasEUR: 2252, danosPersonasEUR: 3315 },
        carga_7: { danosCosasEUR: 1877, danosPersonasEUR: 2505 },
        carga_8: { danosCosasEUR: 2192, danosPersonasEUR: 3315 },
        carga_9: { danosCosasEUR: 2312, danosPersonasEUR: 3441 },
        carga_10: { danosCosasEUR: 2595, danosPersonasEUR: 4378 },
        carga_11: { danosCosasEUR: 2595, danosPersonasEUR: 4378 },
        autobus_12: { danosCosasEUR: 1502, danosPersonasEUR: 2817 },
        autobus_13: { danosCosasEUR: 1502, danosPersonasEUR: 2817 },
        autobus_14: { danosCosasEUR: 2000, danosPersonasEUR: 3754 },
        minibus_15: { danosCosasEUR: 1502, danosPersonasEUR: 2817 },
        minibus_16: { danosCosasEUR: 1502, danosPersonasEUR: 2817 },
        minibus_17: { danosCosasEUR: 2505, danosPersonasEUR: 3754 },
        rustico: { danosCosasEUR: 1874, danosPersonasEUR: 2817 },
        moto: { danosCosasEUR: 2000, danosPersonasEUR: 2505 },
        motocarro: { danosCosasEUR: 1874, danosPersonasEUR: 2505 },
        Móviles: { danosCosasEUR: 2000, danosPersonasEUR: 2505 }
      };
    }

    const tipoVehiculo = carData.type_vehiculo;
    const uso = carData.use || '';
    const incluirGrua = carData.use_grua || false;
    const tipoPlaca = carData.type_plate === 'extranjera' ? 'extranjera' : 'nacional';
    const claseGrupo = calcularClaseGrupo(tipoVehiculo, uso);
    // Solución de tipado para acceso dinámico a objetos
    const tarifas: Record<string, { primaAnualEUR: number; extranjera?: { primaAnualEUR: number }; servicioGruaUSD: number }> = getTarifas();
    const coberturas: Record<string, { danosCosasEUR: number; danosPersonasEUR: number }> = getCoberturas();
    const data = tarifas[claseGrupo];
    const coberturaData = coberturas[claseGrupo];
    if (!data || !coberturaData) {
      throw new Error('No se encontraron tarifas para este tipo de vehículo');
    }
    let primaEUR = data.primaAnualEUR;
    if (tipoPlaca === "extranjera" && data.extranjera) {
      primaEUR = data.extranjera.primaAnualEUR;
    }
    // Obtener tasas dinámicas del BCV
    const rates = await getBcvRates();
    const euroRate = rates.EUR;
    const dollarRate = rates.USD;
    // El factor de conversión correcto de EUR a USD es dollarRate / euroRate
    const factorConversion = dollarRate / euroRate;
    const tasaDolarBs = dollarRate;
    let primaUSD = primaEUR * factorConversion;
    if (incluirGrua && typeof data.servicioGruaUSD === 'number' && data.servicioGruaUSD > 0) {
      primaUSD += data.servicioGruaUSD;
    }
    const totalUSD = parseFloat(primaUSD.toFixed(2));
    const totalBs = parseFloat((totalUSD * tasaDolarBs).toFixed(2));
    const totalEuro = parseFloat((primaUSD / factorConversion).toFixed(2));
    let danosCosasUSD = parseFloat((coberturaData.danosCosasEUR * factorConversion).toFixed(2));
    let danosPersonasUSD = parseFloat((coberturaData.danosPersonasEUR * factorConversion).toFixed(2));
    return {
      primaTotal: {
        dolar: totalUSD,
        bs: totalBs
      },
      coberturas: {
        danosPersonas: danosPersonasUSD,
        danosCosas: danosCosasUSD
      }
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
    // Log para depuración de primaTotal
    console.log('quotationResult.primaTotal:', quotationResult.primaTotal, 'use_grua:', carData.use_grua);

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