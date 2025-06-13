// src/services/quotation.service.ts
import pool from '../db';
import { QuotationRequest, QuotationResult, CarData, GeneralData, GeneralDataTomador, CotizacionRecord } from '../interfaces/quotation.interface';
import carService from './car.service';
import { Car } from '../interfaces/car.interface';
import { ResultSetHeader } from 'mysql2/promise';

class QuotationService {
  private async calculateQuotation(carData: CarData): Promise<QuotationResult> {
    // Determinar clase y grupo
    function calcularClaseGrupo(tipoVehiculo: string, uso: string) {
      let clase = "";
      let grupo = "";
      if (tipoVehiculo.toLowerCase() === "particular") {
        clase = "Particulares";
        if (uso === "Hasta 800 kg. de peso") grupo = "1";
        else if (uso === "Más de 800 kg. de peso") grupo = "2";
        else if (uso === "Casas Móviles con Tracción propia") grupo = "3";
        else if (uso === "Auto – Escuela") grupo = "4";
        else if (uso === "Alquiler sin chofer") grupo = "5";
        else if (uso === "Alquiler con chofer, taxi o por puesto") grupo = "6";
        else grupo = "1";
      } else if (tipoVehiculo.toLowerCase().startsWith("carga")) {
        clase = "Carga (A)";
        if(uso === "Hasta 2 TM") grupo = "7";
        else if(uso === "Más de 2 y hasta 5 TM") grupo = "8";
        else if(uso === "Más de 5 hasta 8 TM") grupo = "9";
        else if(uso === "Más de 8 hasta 12 TM") grupo = "10";
        else if(uso === "Más de 12 TM") grupo = "11";
        else grupo = "7";
      } else if (tipoVehiculo.toLowerCase().startsWith("autobus")) {
        clase = "Autobuses (B)";
        grupo = uso === "suburbano" ? "13"
               : uso === "interurbano" ? "14"
               : "12";
      } else if (tipoVehiculo.toLowerCase().startsWith("minibus")) {
        clase = "Minibuses (B)";
        grupo = uso === "suburbano" ? "16"
               : uso === "interurbano" ? "17"
               : "15";
      } else if (tipoVehiculo.toLowerCase().includes("foráneas")) {
        clase = "Vehículos Rutas Foráneas";
        grupo = "18";
      } else if (tipoVehiculo.toLowerCase().includes("rústico")) {
        clase = "Vehículos Rústicos de doble tracción.";
        grupo = "19";
      } else if (tipoVehiculo.toLowerCase().includes("otros")) {
        clase = "Otros Vehículos";
        grupo = "20";
      } else if (tipoVehiculo.toLowerCase().includes("motocarro")) {
        clase = "Moto Carros (C)";
        grupo = "21";
      } else if (tipoVehiculo.toLowerCase().includes("sangre")) {
        clase = "Tracción Sangre";
        grupo = "22";
      } else if (tipoVehiculo.toLowerCase().includes("máquinas")) {
        clase = "Otras Máquinas";
        grupo = "23";
      }
      return { clase, grupo };
    }

    const tipoVehiculo = carData.type_vehiculo;
    const uso = carData.use || '';
    const incluirGrua = carData.use_grua || false;
    const tipoPlaca = carData.type_plate === 'extranjera' ? 'extranjera' : 'nacional';
    const { clase, grupo } = calcularClaseGrupo(tipoVehiculo, uso);

    console.log('Buscando tarifa con:', { clase, grupo });
    // Buscar la tarifa correspondiente
    const [tarifaRows]: any = await pool.query('SELECT * FROM tarifas WHERE clase = ? AND grupo = ?', [clase, grupo]);
    const tarifa = tarifaRows && tarifaRows[0];
    if (!tarifa) {
      throw new Error('No se encontraron tarifas para este tipo de vehículo');
    }

    // Calcular primas y coberturas según tipo de placa
    let primaAnualEUR = tipoPlaca === 'extranjera' ? tarifa.extranjera_prima_anual_eur : tarifa.nacional_prima_anual_eur;
    let primaAnualUSD = tipoPlaca === 'extranjera' ? tarifa.extranjera_prima_anual_usd : tarifa.nacional_prima_anual_usd;
    let tasaCambioBs = tipoPlaca === 'extranjera' ? tarifa.extranjera_prima_tasa_cambio_bs : tarifa.nacional_prima_tasa_cambio_bs;
    let danosCosasEUR = tipoPlaca === 'extranjera' ? tarifa.extranjera_danos_cosas_eur : tarifa.nacional_danos_cosas_eur;
    let danosPersonasEUR = tipoPlaca === 'extranjera' ? tarifa.extranjera_danos_personas_eur : tarifa.nacional_danos_personas_eur;
    let danosCosasUSD = tipoPlaca === 'extranjera' ? tarifa.extranjera_danos_cosas_usd : tarifa.nacional_danos_cosas_usd;
    let danosPersonasUSD = tipoPlaca === 'extranjera' ? tarifa.extranjera_danos_personas_usd : tarifa.nacional_danos_personas_usd;

    // Sumar grúa si aplica
    let primaUSD = Number(primaAnualUSD) || 0;
    if (incluirGrua && typeof tarifa.prima_servicio_grua_usd === 'number' && tarifa.prima_servicio_grua_usd > 0) {
      primaUSD += Number(tarifa.prima_servicio_grua_usd);
    }

    const totalUSD = parseFloat(primaUSD.toFixed(2));
    const totalBs = parseFloat((totalUSD * Number(tasaCambioBs || 0)).toFixed(2));
    const totalEuro = parseFloat((Number(primaAnualEUR || 0)).toFixed(2));

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