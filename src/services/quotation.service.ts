import pool from '../config/db';
import { QuotationRequest, QuotationResult, Tarifa, GeneralDataTomador, CotizacionRecord } from '../interfaces/quotation.interface';
import carService from './car.service';
import { getBcvRates } from './bcv.service';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { DuplicatePlateError } from '../errors/custom.errors';

let tarifas: Tarifa[] = [];
const loadTarifas = () => {
  try {
    const filePath = path.resolve(process.cwd(), 'tarifas.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    tarifas = JSON.parse(fileContent);
  } catch (error) {
    console.error('[Quotation Service] Error al cargar tarifas.json:', error);
    throw new Error('Error crítico: No se pudieron cargar las tarifas de RCV.');
  }
};

loadTarifas();

class QuotationService {
  async processQuotation(requestBody: QuotationRequest): Promise<QuotationResult> {
    const { isTomador, generalData, carData, generalDataTomador } = requestBody.data;

    // Se invierte la lógica de la validación:
    // Si isTomador es FALSE (es decir, el tomador NO es el mismo que el titular),
    // ENTONCES generalDataTomador DEBE estar presente.
    // Si no está, lanzamos el error.
    if (!isTomador && !generalDataTomador) {
        throw new Error("Faltan datos de 'generalDataTomador' cuando isTomador es false (el tomador es diferente del titular).");
    }

    // Obtener tasas de cambio BCV
    const rates = await getBcvRates();
    const TASA_CAMBIO_BS_USD = rates.USD;
    const TASA_CAMBIO_BS_EUR = rates.EUR;

    if (!TASA_CAMBIO_BS_USD || TASA_CAMBIO_BS_USD <= 0) {
        throw new Error('La tasa de cambio USD del BCV es inválida o cero.');
    }
    if (!TASA_CAMBIO_BS_EUR || TASA_CAMBIO_BS_EUR <= 0) {
        throw new Error('La tasa de cambio EUR del BCV es inválida o cero. Necesaria para conversiones.');
    }

    const EUR_TO_USD_FACTOR = TASA_CAMBIO_BS_EUR / TASA_CAMBIO_BS_USD;
    console.log(`[Quotation Service] Factor de conversión EUR a USD: ${EUR_TO_USD_FACTOR.toFixed(4)}`);

    const tarifaEncontrada = tarifas.find(t => {
        const normalizedTypePlate = carData.type_plate.toLowerCase().trim();
        const normalizedTypeVehiculo = carData.type_vehiculo.toLowerCase().trim();
        const normalizedUse = carData.use.toLowerCase().trim();
        const normalizedClase = t.clase.toLowerCase().trim();
        const normalizedDescripcionVehiculo = t.descripcion_vehiculo.toLowerCase().trim();

        if (normalizedClase.includes(normalizedTypeVehiculo) || normalizedTypeVehiculo.includes(normalizedClase)) {
            if (normalizedDescripcionVehiculo === normalizedUse) {
                return true;
            }
            if (normalizedClase === "particulares" && normalizedTypeVehiculo === "particular") {
                if (normalizedUse.includes("hasta 800 kg") && t.grupo === "1") return true;
                if (normalizedUse.includes("mas de 800 kg") && t.grupo === "2") return true;
                if (normalizedUse.includes("casas moviles") && t.grupo === "3") return true;
                if (normalizedUse.includes("auto-escuela") && t.grupo === "4") return true;
                if (normalizedUse.includes("alquiler sin chofer") && t.grupo === "5") return true;
                if (normalizedUse.includes("alquiler con chofer") && t.grupo === "6") return true;
            } else if (normalizedClase === "carga (a)" && normalizedTypeVehiculo === "carga") {
                if (normalizedUse.includes("hasta 2 tm") && t.grupo === "7") return true;
                if (normalizedUse.includes("mas de 2 y hasta 5 tm") && t.grupo === "8") return true;
                if (normalizedUse.includes("mas de 5 hasta 8 tm") && t.grupo === "9") return true;
                if (normalizedUse.includes("mas de 8 hasta 12 tm") && t.grupo === "10") return true;
                if (normalizedUse.includes("mas de 12 tm") && t.grupo === "11") return true;
            } else if (normalizedClase === "autobuses (b)" && normalizedTypeVehiculo === "autobús") {
                if (normalizedUse.includes("urbanos") && t.grupo === "12") return true;
                if (normalizedUse.includes("suburbanos") && t.grupo === "13") return true;
                if (normalizedUse.includes("interurbanos") && t.grupo === "14") return true;
            } else if (normalizedClase === "minibuses (b)" && normalizedTypeVehiculo === "minibús") {
                if (normalizedUse.includes("urbanos") && t.grupo === "15") return true;
                if (normalizedUse.includes("suburbanos") && t.grupo === "16") return true;
                if (normalizedUse.includes("interurbanos") && t.grupo === "17") return true;
            } else if (normalizedClase === "vehículos rutas foráneas" && normalizedTypeVehiculo.includes("rutas foraneas")) {
                if (t.grupo === "18") return true;
            } else if (normalizedClase === "vehículos rústicos de doble tracción." && normalizedTypeVehiculo.includes("rustico")) {
                if (t.grupo === "19") return true;
            } else if (normalizedClase === "otros vehículos" && normalizedTypeVehiculo === "motocicleta") {
                if (t.grupo === "20") return true;
            } else if (normalizedClase === "moto carros (c)" && normalizedTypeVehiculo === "motocarro") {
                if (t.grupo === "21") return true;
            } else if (normalizedClase === "tracción sangre" && normalizedTypeVehiculo.includes("traccion sangre")) {
                if (t.grupo === "22") return true;
            } else if (normalizedClase === "otras máquinas" && normalizedTypeVehiculo.includes("maquinas moviles")) {
                if (t.grupo === "23") return true;
            }
        }
        return false;
    });

    if (!tarifaEncontrada) {
      throw new Error(`No se encontró una tarifa para el tipo de vehículo "${carData.type_vehiculo}" y uso "${carData.use}" especificados.`);
    }

    let danosCosas: number = 0;
    let danosPersonas: number = 0;
    let primaAnualUSD: number = 0;
    let primaAnualEUR: number = 0;
    const primaServicioGrua: number = tarifaEncontrada.prima_servicio_grua_usd || 0;

    if (carData.type_plate.toLowerCase() === 'nacional') {
      danosCosas = tarifaEncontrada.nacional_danos_cosas_usd ?? ((tarifaEncontrada.nacional_danos_cosas_eur ?? 0) * EUR_TO_USD_FACTOR);
      danosPersonas = tarifaEncontrada.nacional_danos_personas_usd ?? ((tarifaEncontrada.nacional_danos_personas_eur ?? 0) * EUR_TO_USD_FACTOR);
      primaAnualUSD = tarifaEncontrada.nacional_prima_anual_usd ?? ((tarifaEncontrada.nacional_prima_anual_eur ?? 0) * EUR_TO_USD_FACTOR);
      primaAnualEUR = tarifaEncontrada.nacional_prima_anual_eur ?? 0;
    } else if (carData.type_plate.toLowerCase() === 'extranjera') {
      danosCosas = tarifaEncontrada.extranjera_danos_cosas_usd ?? ((tarifaEncontrada.extranjera_danos_cosas_eur ?? 0) * EUR_TO_USD_FACTOR);
      danosPersonas = tarifaEncontrada.extranjera_danos_personas_usd ?? ((tarifaEncontrada.extranjera_danos_personas_eur ?? 0) * EUR_TO_USD_FACTOR);
      primaAnualUSD = tarifaEncontrada.extranjera_prima_anual_usd ?? ((tarifaEncontrada.extranjera_prima_anual_eur ?? 0) * EUR_TO_USD_FACTOR);
      primaAnualEUR = tarifaEncontrada.extranjera_prima_anual_eur ?? 0;
    } else {
        throw new Error("Tipo de placa ('nacional' o 'extranjera') no especificado o inválido.");
    }

    let primaTotalDolar = primaAnualUSD;
    if (carData.use_grua) {
      primaTotalDolar += primaServicioGrua;
    }

    const primaTotalBs = parseFloat((primaTotalDolar * TASA_CAMBIO_BS_USD).toFixed(2));
    const primaTotalEuroCalculated = primaAnualEUR;

    const quotationResult: QuotationResult = {
      order_id: 0,
      primaTotal: {
        dolar: parseFloat(primaTotalDolar.toFixed(2)),
        bs: primaTotalBs,
      },
      coberturas: {
        danosPersonas: parseFloat(danosPersonas.toFixed(2)),
        danosCosas: parseFloat(danosCosas.toFixed(2)),
      },
    };

    let carId: number;
    try {
        carId = await carService.createCar({
            type_plate: carData.type_plate,
            plate: carData.plate,
            brand: carData.brand,
            model: carData.model,
            version: carData.version || null,
            year: carData.year,
            color: carData.color || null,
            gearbox: carData.gearbox || null,
            carroceria_serial_number: carData.carroceria_serial_number,
            motor_serial_number: carData.motor_serial_number,
            type_vehiculo: carData.type_vehiculo,
            use: carData.use,
            passenger_qty: carData.passenger_qty,
            driver: carData.driver,
            use_grua: carData.use_grua,
        });
    } catch (error) {
        if (error instanceof DuplicatePlateError) {
            console.error('[Quotation Service] Error de placa duplicada al procesar cotización:', error.message);
            throw new Error(`Error de validación: ${error.message}`);
        }
        throw error;
    }

    let tomadorData: GeneralDataTomador;
    // Se invierte la lógica:
    // Si isTomador es TRUE (Tomador = Titular), construimos tomadorData desde generalData.
    // Si isTomador es FALSE (Tomador ≠ Titular), usamos generalDataTomador del request.
    if (isTomador) { // Si isTomador es TRUE (el tomador ES el mismo que el titular)
      tomadorData = {
        type_document: generalData.policy_holder_type_document,
        insured_document: generalData.policy_holder_document_number,
        insured_phone: generalData.policy_holder_phone,
        insured_email: generalData.policy_holder_email,
        insured: generalData.policy_holder,
        insured_address: generalData.policy_holder_address,
        insured_state: generalData.policy_holder_state,
        insured_city: generalData.policy_holder_city,
        insured_municipality: generalData.policy_holder_municipality,
        isseur_store: generalData.isseur_store,
      };
    } else { // Si isTomador es FALSE (el tomador NO es el mismo que el titular)
      tomadorData = generalDataTomador!; // Sabemos que existe por la validación inicial.
    }

    const cotizacionRecord: CotizacionRecord = {
      order_id: 0,
      car_id: carId,
      isTomador: isTomador,
      policy_holder_type_document: generalData.policy_holder_type_document,
      policy_holder_document_number: String(generalData.policy_holder_document_number),
      policy_holder_phone: generalData.policy_holder_phone,
      policy_holder_email: generalData.policy_holder_email,
      policy_holder: generalData.policy_holder,
      policy_holder_address: generalData.policy_holder_address,
      policy_holder_state: generalData.policy_holder_state,
      policy_holder_city: generalData.policy_holder_city,
      policy_holder_municipality: generalData.policy_holder_municipality,
      isseur_store: generalData.isseur_store,

      insured_type_document: tomadorData.type_document,
      insured_document_number: String(tomadorData.insured_document),
      insured_phone: tomadorData.insured_phone,
      insured_email: tomadorData.insured_email,
      insured: tomadorData.insured,
      insured_address: tomadorData.insured_address,
      insured_state: tomadorData.insured_state,
      insured_city: tomadorData.insured_city,
      insured_municipality: tomadorData.insured_municipality,
      insured_isseur_store: tomadorData.isseur_store,

      prima_total_euro: primaTotalEuroCalculated,
      prima_total_dolar: quotationResult.primaTotal.dolar,
      prima_total_bs: quotationResult.primaTotal.bs,
      danos_personas: quotationResult.coberturas.danosPersonas,
      danos_cosas: quotationResult.coberturas.danosCosas,
    };

    const [insertResult] = await pool.execute<ResultSetHeader>(
      `INSERT INTO orders (
        car_id, isTomador, policy_holder_type_document, policy_holder_document_number, policy_holder_phone,
        policy_holder_email, policy_holder, policy_holder_address, policy_holder_state,
        policy_holder_city, policy_holder_municipality, isseur_store, insured_type_document,
        insured_document_number, insured_phone, insured_email, insured,
        insured_address, insured_state, insured_city, insured_municipality,
        insured_isseur_store, prima_total_euro, prima_total_dolar, prima_total_bs,
        danos_personas, danos_cosas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cotizacionRecord.car_id, cotizacionRecord.isTomador, cotizacionRecord.policy_holder_type_document, cotizacionRecord.policy_holder_document_number, cotizacionRecord.policy_holder_phone,
        cotizacionRecord.policy_holder_email, cotizacionRecord.policy_holder, cotizacionRecord.policy_holder_address, cotizacionRecord.policy_holder_state,
        cotizacionRecord.policy_holder_city, cotizacionRecord.policy_holder_municipality, cotizacionRecord.isseur_store, cotizacionRecord.insured_type_document,
        cotizacionRecord.insured_document_number, cotizacionRecord.insured_phone, cotizacionRecord.insured_email, cotizacionRecord.insured,
        cotizacionRecord.insured_address, cotizacionRecord.insured_state, cotizacionRecord.insured_city, cotizacionRecord.insured_municipality,
        cotizacionRecord.insured_isseur_store, cotizacionRecord.prima_total_euro, cotizacionRecord.prima_total_dolar, cotizacionRecord.prima_total_bs,
        cotizacionRecord.danos_personas, cotizacionRecord.danos_cosas
      ]
    );

    quotationResult.order_id = insertResult.insertId;

    console.log(`Cotización guardada en la tabla 'orders' con ID: ${insertResult.insertId}`);

    return quotationResult;
  }
}

export default new QuotationService();