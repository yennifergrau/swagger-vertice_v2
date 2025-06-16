// __tests__/services/quotation.service.generated.test.ts

import QuotationService from '../../src/services/quotation.service';
import * as bcvService from '../../src/services/bcv.service';
import carService from '../../src/services/car.service';
import pool from '../../src/config/db';
import * as testData from '../../datatest.json';
import * as tarifasRaw from '../../tarifas.json';
const tarifasData = tarifasRaw;

// --- MOCKED DATA AND UTILITIES ---

jest.mock('../../src/services/bcv.service');
jest.mock('../../src/services/car.service');
jest.mock('../../src/config/db', () => ({
  execute: jest.fn(), // Use execute for INSERT queries with mysql2/promise
  query: jest.fn(), // Keep query for other potential operations if needed
  end: jest.fn(),
}));

// Tasas de cambio mockeadas para asegurar la consistencia en el test
const MOCKED_BS_USD_RATE = 101.08; // Bs por USD (ejemplo)
const MOCKED_BS_EUR_RATE = 116.00; // Bs por EUR (ejemplo que da un factor EUR_TO_USD de ~1.1476)

beforeAll(() => {
  // Mock el método getBcvRates para devolver las tasas de cambio esperadas
  (bcvService.getBcvRates as jest.Mock).mockResolvedValue({
    USD: MOCKED_BS_USD_RATE,
    EUR: MOCKED_BS_EUR_RATE,
  });

  // Mock pool.execute para interacciones con la base de datos (ej. guardar cotización)
  // Simula un insert exitoso que devuelve un ID
  (pool.execute as jest.Mock).mockResolvedValue([{ insertId: 101 }]);

  // Mock carService.findOrCreateCar para que devuelva directamente un carId numérico
  (carService.findOrCreateCar as jest.Mock).mockResolvedValue(1); // ID de ejemplo para el vehículo
});

describe('QuotationService Generated Tests from datatest.json', () => {
  // Loop through each test case in datatest.json
  testData.data.forEach((testCase: any) => {
    // Dynamically generate a test name for better readability
    const testName = `debería calcular la cotización correctamente para el caso ${testCase.orden_id} (Placa: ${testCase.carData.type_plate}, Uso: ${testCase.carData.use})`;

    it(testName, async () => {
      // Construct the requestBody to match QuotationRequest type
      const requestBody: any = {
        data: {
          generalData: {
            policy_holder_type_document: testCase.generalData.policy_holder_type_document,
            policy_holder_document_number: testCase.generalData.policy_holder_document_number,
            policy_holder_phone: testCase.generalData.policy_holder_phone,
            policy_holder_email: testCase.generalData.policy_holder_email,
            policy_holder: testCase.generalData.policy_holder,
            policy_holder_address: testCase.generalData.policy_holder_address,
            policy_holder_state: testCase.generalData.policy_holder_state,
            policy_holder_city: testCase.generalData.policy_holder_city,
            policy_holder_municipality: testCase.generalData.policy_holder_municipality,
            isseur_store: testCase.generalData.isseur_store,
          },
          generalDataTomador: {
            type_document: testCase.generalData.policy_holder_type_document,
            insured_document: testCase.generalData.policy_holder_document_number,
            insured_phone: testCase.generalData.policy_holder_phone,
            insured_email: testCase.generalData.policy_holder_email,
            insured: testCase.generalData.policy_holder,
            insured_address: testCase.generalData.policy_holder_address,
            insured_state: testCase.generalData.policy_holder_state,
            insured_city: testCase.generalData.policy_holder_city,
            insured_municipality: testCase.generalData.policy_holder_municipality,
            isseur_store: testCase.generalData.isseur_store,
          },
          carData: {
            type_plate: testCase.carData.type_plate,
            plate: testCase.carData.plate,
            brand: testCase.carData.brand,
            model: testCase.carData.model,
            version: testCase.carData.version,
            year: testCase.carData.year,
            color: testCase.carData.color,
            gearbox: testCase.carData.gearbox,
            carroceria_serial_number: testCase.carData.carroceria_serial_number,
            motor_serial_number: testCase.carData.motor_serial_number,
            type_vehiculo: testCase.carData.type_vehiculo,
            use: testCase.carData.use,
            passenger_qty: testCase.carData.passenger_qty,
            driver: testCase.carData.driver,
            use_grua: testCase.carData.use_grua,
          },
        },
      };

      // --- Expected Value Calculations (based on your service's logic and tarifas.json) ---
      const normalizedTypePlate = requestBody.data.carData.type_plate.toLowerCase().trim();
      const normalizedTypeVehiculo = requestBody.data.carData.type_vehiculo.toLowerCase().trim();
      const normalizedUse = requestBody.data.carData.use.toLowerCase().trim();

      const tarifaEncontrada = tarifasData.find((t: any) => {
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
        fail(`No se encontró tarifa para el caso ${testCase.orden_id} (Tipo Vehículo: ${requestBody.data.carData.type_vehiculo}, Uso: ${requestBody.data.carData.use})`);
      }

      // El factor de conversión EUR a USD que el servicio calcularía internamente
      const EUR_TO_USD_FACTOR_IN_TEST = MOCKED_BS_EUR_RATE / MOCKED_BS_USD_RATE;

      let danosCosasEsperadoUSD: number;
      let danosPersonasEsperadoUSD: number;
      let primaAnualEsperadoEUR: number; // Esto es la prima anual base en EUR de la tarifa

      if (normalizedTypePlate === 'nacional') {
        danosCosasEsperadoUSD = tarifaEncontrada.nacional_danos_cosas_usd ?? ((tarifaEncontrada.nacional_danos_cosas_eur ?? 0) * EUR_TO_USD_FACTOR_IN_TEST);
        danosPersonasEsperadoUSD = tarifaEncontrada.nacional_danos_personas_usd ?? ((tarifaEncontrada.nacional_danos_personas_eur ?? 0) * EUR_TO_USD_FACTOR_IN_TEST);
        primaAnualEsperadoEUR = tarifaEncontrada.nacional_prima_anual_eur ?? 0;
      } else if (normalizedTypePlate === 'extranjera') {
        danosCosasEsperadoUSD = tarifaEncontrada.extranjera_danos_cosas_usd ?? ((tarifaEncontrada.extranjera_danos_cosas_eur ?? 0) * EUR_TO_USD_FACTOR_IN_TEST);
        danosPersonasEsperadoUSD = tarifaEncontrada.extranjera_danos_personas_usd ?? ((tarifaEncontrada.extranjera_danos_personas_eur ?? 0) * EUR_TO_USD_FACTOR_IN_TEST);
        primaAnualEsperadoEUR = tarifaEncontrada.extranjera_prima_anual_eur ?? 0;
      } else {
        fail('Tipo de placa desconocido en los datos de prueba.');
      }

      let primaTotalDolarEsperado = tarifaEncontrada.nacional_prima_anual_usd ?? ((tarifaEncontrada.nacional_prima_anual_eur ?? 0) * EUR_TO_USD_FACTOR_IN_TEST);

      // Add crane service cost if applicable
      if (requestBody.data.carData.use_grua) {
        primaTotalDolarEsperado += (tarifaEncontrada.prima_servicio_grua_usd || 0);
      }

      // Calculate total in Bolivares (using the corrected service logic: primaTotalDolar * BS_USD_RATE)
      const primaTotalBsEsperado = primaTotalDolarEsperado * MOCKED_BS_USD_RATE;


      // --- Call the service and make assertions ---
      const result = await QuotationService.processQuotation(requestBody);

      // Assertions for primaTotal
      expect(result.primaTotal.dolar).toBeCloseTo(parseFloat(primaTotalDolarEsperado.toFixed(2)), 2);
      expect(result.primaTotal.bs).toBeCloseTo(parseFloat(primaTotalBsEsperado.toFixed(2)), 2);

      // Assertions for coberturas (corrected from 'cobertura' to 'coberturas')
      // Note: El servicio solo devuelve los valores finales en USD, no en EUR para coberturas.
      // Así que ajustamos la aserción para que coincida con lo que el servicio devuelve.
      expect(result.coberturas.danosCosas).toBeCloseTo(parseFloat(danosCosasEsperadoUSD.toFixed(2)), 2);
      expect(result.coberturas.danosPersonas).toBeCloseTo(parseFloat(danosPersonasEsperadoUSD.toFixed(2)), 2);
    });
  });
});