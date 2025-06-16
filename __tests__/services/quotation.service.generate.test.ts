// __tests__/services/quotation.service.generated.test.ts

import QuotationService from '../../src/services/quotation.service';
import * as bcvService from '../../src/services/bcv.service';
import carService from '../../src/services/car.service'; // Assuming this is used for car data processing
import pool from '../../src/config/db'; // Assuming database connection is mocked or used

// Import the test data directly. Ensure the path is correct relative to this test file.
import * as testData from '../../datatest.json'; 

// Import the actual tarifas.json data for calculations within tests
// Ensure the path is correct relative to this test file.
import * as tarifasRaw from '../../tarifas.json';
const tarifasData = tarifasRaw; // Assign to a constant for use

// --- MOCKED DATA AND UTILITIES ---

// Mock external services to ensure tests are isolated and deterministic
jest.mock('../../src/services/bcv.service');
jest.mock('../../src/services/car.service'); // Mock carService if its methods are called
jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  end: jest.fn(),
}));

const MOCKED_EUR_TO_USD_FACTOR = 1.1583; // Example factor, ensure it matches what your service uses
const MOCKED_USD_RATE = 36.5; // Example USD to BS rate

beforeAll(() => {
  // Mock the getConversionFactor method from bcvService
  (bcvService.getConversionFactor as jest.Mock).mockResolvedValue(MOCKED_EUR_TO_USD_FACTOR);
  // Mock the getUsdRate method from bcvService
  (bcvService.getUsdRate as jest.Mock).mockResolvedValue(MOCKED_USD_RATE);

  // Mock pool.query for database interactions (e.g., saving quotation)
  (pool.query as jest.Mock).mockResolvedValue({
    rows: [{ id: 101 }], // Simulate a successful insert returning an ID
  });

  // === INICIO DE CORRECCIÓN: Mockear findOrCreateCar ===
  // Si tu servicio llama a carService.findOrCreateCar, debe ser mockeado.
  // Ajusta el valor de retorno para que coincida con lo que findOrCreateCar realmente devuelve
  // (por ejemplo, un objeto con un ID y otros detalles del vehículo).
  (carService.findOrCreateCar as jest.Mock).mockResolvedValue({
    id: 1, // ID de ejemplo para el vehículo
    plate: 'ABC123MOCKED',
    brand: 'MockBrand',
    model: 'MockModel',
    version: 'MockVersion',
    year: 2020,
    color: 'MockColor',
    gearbox: 'MockGearbox',
    carroceria_serial_number: 'MOCKEDSERIAL123',
    motor_serial_number: 'MOCKEDMOTOR456',
    type_vehiculo: 'particular',
    use: 'Hasta 800 kg. de peso',
    passenger_qty: 5,
    driver: 'MockDriver',
    use_grua: false // O true, según tu caso de prueba, si la lógica de carService lo requiere
  });
  // === FIN DE CORRECCIÓN ===
});

describe('QuotationService Generated Tests from datatest.json', () => {
  // Loop through each test case in datatest.json
  testData.data.forEach((testCase: any) => {
    // Dynamically generate a test name for better readability
    const testName = `debería calcular la cotización correctamente para el caso ${testCase.orden_id} (Placa: ${testCase.carData.type_plate}, Uso: ${testCase.carData.use})`;

    it(testName, async () => {
      // Construct the requestBody to match QuotationRequest type
      // Using 'any' for the type here to avoid importing specific interfaces unless strictly necessary,
      // but ideally you'd define and import them for stronger type safety.
      const requestBody: any = {
        data: {
          // generalData: Populated directly from datatest.json's generalData.
          // This ensures the 'policy_holder_' fields are correctly passed for the GeneralData type.
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
          // generalDataTomador: Created by mapping fields from generalData.
          // This provides the data for the 'GeneralDataTomador' type, with 'insured_' or simpler field names.
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
          // carData: Populated directly from datatest.json's carData
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

      // --- Expected Value Calculations (based on your service's logic and tarifaf.json) ---
      const tarifaEncontrada = tarifasData.find(
        (tarifa: any) =>
          tarifa.clase === requestBody.data.carData.type_vehiculo &&
          tarifa.descripcion_vehiculo === requestBody.data.carData.use
      );

      if (!tarifaEncontrada) {
        // If a tariff isn't found for a test case, it indicates an issue with test data or tariffs.
        fail(`No se encontró tarifa para el caso ${testCase.orden_id} (Tipo Vehículo: ${requestBody.data.carData.type_vehiculo}, Uso: ${requestBody.data.carData.use})`);
      }

      let danosCosasEsperadoEUR: number;
      let danosPersonasEsperadoEUR: number;
      let primaAnualEsperadoEUR: number;

      if (requestBody.data.carData.type_plate === 'nacional') {
        danosCosasEsperadoEUR = tarifaEncontrada.nacional_danos_cosas_eur ?? 0;
        danosPersonasEsperadoEUR = tarifaEncontrada.nacional_danos_personas_eur ?? 0;
        primaAnualEsperadoEUR = tarifaEncontrada.nacional_prima_anual_eur ?? 0;
      } else if (requestBody.data.carData.type_plate === 'extranjera') {
        danosCosasEsperadoEUR = tarifaEncontrada.extranjera_danos_cosas_eur ?? 0;
        danosPersonasEsperadoEUR = tarifaEncontrada.extranjera_danos_personas_eur ?? 0;
        primaAnualEsperadoEUR = tarifaEncontrada.extranjera_prima_anual_eur ?? 0;
      } else {
        fail('Tipo de placa desconocido en los datos de prueba.');
      }
      
      const danosCosasEsperadoUSD = danosCosasEsperadoEUR * MOCKED_EUR_TO_USD_FACTOR;
      const danosPersonasEsperadoUSD = danosPersonasEsperadoEUR * MOCKED_EUR_TO_USD_FACTOR;
      let primaTotalDolarEsperado = primaAnualEsperadoEUR * MOCKED_EUR_TO_USD_FACTOR;

      // Add crane service cost if applicable
      if (requestBody.data.carData.use_grua) {
        primaTotalDolarEsperado += (tarifaEncontrada.prima_servicio_grua_usd || 0);
      }

      // Calculate total in Bolivares
      const primaTotalBsEsperado = primaTotalDolarEsperado * MOCKED_USD_RATE;


      // --- Call the service and make assertions ---
      const result = await QuotationService.processQuotation(requestBody);

      // Assertions for primaTotal
      expect(result.primaTotal.dolar).toBeCloseTo(primaTotalDolarEsperado, 2);
      // A pesar de que esta línea es lógicamente correcta para la prueba,
      // el problema de 'primaTotal.bs' persiste y apunta a un cálculo diferente
      // en el servicio src/services/quotation.service.ts
      expect(result.primaTotal.bs).toBeCloseTo(primaTotalBsEsperado, 2);

      // Assertions for cobertura (mantengo la estructura que definiste en tu test)
      expect(result.cobertura.danos_cosas.eur).toBeCloseTo(danosCosasEsperadoEUR, 2);
      expect(result.cobertura.danos_cosas.dolar).toBeCloseTo(danosCosasEsperadoUSD, 2);
      expect(result.cobertura.danos_personas.eur).toBeCloseTo(danosPersonasEsperadoEUR, 2);
      expect(result.cobertura.danos_personas.dolar).toBeCloseTo(danosPersonasEsperadoUSD, 2);

      // Additional assertions as needed, e.g., on orderId if the service returns it
      expect(result.orderId).toBe(101); // Based on mock of pool.query
    });
  });
});