// src/__tests__/services/quotation.service.test.ts

import QuotationService from '../../src/services/quotation.service';
import * as bcvService from '../../src/services/bcv.service';
import carService from '../../src/services/car.service';
import pool from '../../src/config/db';
import tarifasData from '../../tarifas.json';

jest.mock('../../src/services/bcv.service', () => ({
  getBcvRates: jest.fn(),
}));

jest.mock('../../src/services/car.service', () => ({
  findOrCreateCar: jest.fn(),
}));

jest.mock('../../src/config/db', () => ({
  execute: jest.fn(),
}));

describe('QuotationService', () => {
  // Define las tasas simuladas aquí para poder usarlas en tus cálculos esperados
  const MOCKED_USD_RATE = 101.08;
  const MOCKED_EUR_RATE = 117.08;
  const MOCKED_EUR_TO_USD_FACTOR = MOCKED_EUR_RATE / MOCKED_USD_RATE;

  beforeEach(() => {
    jest.clearAllMocks();

    // Configura los valores de retorno predeterminados para los mocks
    (bcvService.getBcvRates as jest.Mock).mockResolvedValue({
      EUR: MOCKED_EUR_RATE,
      USD: MOCKED_USD_RATE,
    });

    (carService.findOrCreateCar as jest.Mock).mockResolvedValue(1);
    (pool.execute as jest.Mock).mockResolvedValue([{ insertId: 101 }]);
  });

  // --- Caso de Prueba 1: Placa Nacional (tu ejemplo) ---
  test('debería calcular la cotización correctamente para un vehículo nacional particular (hasta 800 kg)', async () => {
    // ... (requestBody igual) ...
    const requestBody = {
      data: {
        generalData: {
          policy_holder_type_document: "V",
          policy_holder_document_number: 12345678,
          policy_holder_phone: "04141234567",
          policy_holder_email: "titular@email.com",
          policy_holder: "Juan Pérez",
          policy_holder_address: "Calle 1",
          policy_holder_state: "Miranda",
          policy_holder_city: "Caracas",
          policy_holder_municipality: "Libertador",
          isseur_store: "Sucursal Centro"
        },
        carData: {
          type_plate: "nacional",
          plate: "ABC123",
          brand: "Toyota",
          model: "Corolla",
          version: "LE",
          year: 2022,
          color: "Blanco",
          gearbox: "Automático",
          carroceria_serial_number: "1234567890",
          motor_serial_number: "0987654321",
          type_vehiculo: "particular",
          use: "Hasta 800 kg. de peso",
          passenger_qty: 5,
          driver: "Juan Pérez",
          use_grua: false
        },
        generalDataTomador: {
          type_document: "V",
          insured_document: 12345678,
          insured_phone: "04141234567",
          insured_email: "titular@email.com",
          insured: "Juan Pérez",
          insured_address: "Calle 1",
          insured_state: "Miranda",
          insured_city: "Caracas",
          insured_municipality: "Libertador",
          isseur_store: "Sucursal Centro"
        }
      }
    };

    const tarifaEsperada = tarifasData.find(t =>
      t.clase.toLowerCase() === "particulares" &&
      t.descripcion_vehiculo.toLowerCase().includes("hasta 800 kg") &&
      t.grupo === "1"
    );

    if (!tarifaEsperada) {
      fail('No se encontró la tarifa esperada para el caso de prueba nacional.');
    }

    // AQUI ES EL CAMBIO: Usa las constantes MOCKED_USD_RATE y MOCKED_EUR_TO_USD_FACTOR
    const danosCosasEsperadoUSD = tarifaEsperada.nacional_danos_cosas_usd ?? ((tarifaEsperada.nacional_danos_cosas_eur ?? 0) * MOCKED_EUR_TO_USD_FACTOR);
    const danosPersonasEsperadoUSD = tarifaEsperada.nacional_danos_personas_usd ?? ((tarifaEsperada.nacional_danos_personas_eur ?? 0) * MOCKED_EUR_TO_USD_FACTOR);
    const primaAnualEsperadoUSD = tarifaEsperada.nacional_prima_anual_usd ?? ((tarifaEsperada.nacional_prima_anual_eur ?? 0) * MOCKED_EUR_TO_USD_FACTOR);

    const primaTotalDolarEsperado = primaAnualEsperadoUSD;
    const primaTotalBsEsperado = (tarifaEsperada.nacional_prima_anual_eur ?? 0) * MOCKED_USD_RATE; // Asegúrate de usar la TASA_USD mockeada


    const result = await QuotationService.processQuotation(requestBody);

    expect(result.primaTotal.dolar).toBeCloseTo(primaTotalDolarEsperado, 2);
    expect(result.primaTotal.bs).toBeCloseTo(primaTotalBsEsperado, 2);
    expect(result.coberturas.danosPersonas).toBeCloseTo(danosPersonasEsperadoUSD, 2);
    expect(result.coberturas.danosCosas).toBeCloseTo(danosCosasEsperadoUSD, 2);

    expect(bcvService.getBcvRates).toHaveBeenCalledTimes(1);
    expect(carService.findOrCreateCar).toHaveBeenCalledTimes(1);
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });

  // --- Caso de Prueba 2: Placa Extranjera (tu ejemplo) ---
  test('debería calcular la cotización correctamente para un vehículo extranjero particular (primer caso extranjero)', async () => {
    // ... (requestBody igual) ...
    const requestBody = {
      data: {
        generalData: {
          policy_holder_type_document: "V",
          policy_holder_document_number: 12345678,
          policy_holder_phone: "04141234567",
          policy_holder_email: "titular@email.com",
          policy_holder: "Juan Pérez",
          policy_holder_address: "Calle 1",
          policy_holder_state: "Miranda",
          policy_holder_city: "Caracas",
          policy_holder_municipality: "Libertador",
          isseur_store: "Sucursal Centro"
        },
        carData: {
          type_plate: "extranjera",
          plate: "ABC123",
          brand: "Toyota",
          model: "Corolla",
          version: "LE",
          year: 2022,
          color: "Blanco",
          gearbox: "Automático",
          carroceria_serial_number: "1234567890",
          motor_serial_number: "0987654321",
          type_vehiculo: "particular",
          use: "Hasta 800 kg. de peso",
          passenger_qty: 5,
          driver: "Juan Pérez",
          use_grua: false
        },
        generalDataTomador: {
          type_document: "V",
          insured_document: 12345678,
          insured_phone: "04141234567",
          insured_email: "titular@email.com",
          insured: "Juan Pérez",
          insured_address: "Calle 1",
          insured_state: "Miranda",
          insured_city: "Caracas",
          insured_municipality: "Libertador",
          isseur_store: "Sucursal Centro"
        }
      }
    };

    const tarifaEsperadaExtranjera = tarifasData.find(t =>
      t.clase.toLowerCase() === "particulares" &&
      t.descripcion_vehiculo.toLowerCase().includes("hasta 800 kg") &&
      t.grupo === "1"
    );

    if (!tarifaEsperadaExtranjera) {
      fail('No se encontró la tarifa esperada para el caso de prueba extranjera.');
    }

    // AQUI ES EL CAMBIO: Usa las constantes MOCKED_USD_RATE y MOCKED_EUR_TO_USD_FACTOR
    const danosCosasEsperadoExtranjeraUSD = tarifaEsperadaExtranjera.extranjera_danos_cosas_usd ?? ((tarifaEsperadaExtranjera.extranjera_danos_cosas_eur ?? 0) * MOCKED_EUR_TO_USD_FACTOR);
    const danosPersonasEsperadoExtranjeraUSD = tarifaEsperadaExtranjera.extranjera_danos_personas_usd ?? ((tarifaEsperadaExtranjera.extranjera_danos_personas_eur ?? 0) * MOCKED_EUR_TO_USD_FACTOR);
    const primaAnualEsperadoExtranjeraUSD = tarifaEsperadaExtranjera.extranjera_prima_anual_usd ?? ((tarifaEsperadaExtranjera.extranjera_prima_anual_eur ?? 0) * MOCKED_EUR_TO_USD_FACTOR);

    const primaTotalDolarEsperadoExtranjera = primaAnualEsperadoExtranjeraUSD;
    const primaTotalBsEsperadoExtranjera = (tarifaEsperadaExtranjera.extranjera_prima_anual_eur ?? 0) * MOCKED_USD_RATE; // La prima anual EUR por la tasa USD

    const resultExtranjera = await QuotationService.processQuotation(requestBody);

    expect(resultExtranjera.primaTotal.dolar).toBeCloseTo(primaTotalDolarEsperadoExtranjera, 2);
    expect(resultExtranjera.primaTotal.bs).toBeCloseTo(primaTotalBsEsperadoExtranjera, 2);
    expect(resultExtranjera.coberturas.danosPersonas).toBeCloseTo(danosPersonasEsperadoExtranjeraUSD, 2);
    expect(resultExtranjera.coberturas.danosCosas).toBeCloseTo(danosCosasEsperadoExtranjeraUSD, 2);

    // OJO: Estos expect de calledTimes deben ser correctos para la suma de todas las llamadas en el beforeEach
    // Si ejecutas dos tests, cada uno llamará una vez, entonces el segundo test verá el contador en 2.
    // Esto es correcto si cada test es una ejecución "real" del servicio.
    // Si quieres que cada test sea completamente aislado, considera un beforeEach que solo mockee getBcvRates
    // y no verifique el contador global. O resetea las llamadas por cada 'describe' o 'test' con afterEach.
    // Para la lógica actual, deberían ser llamados una vez por cada test.
    expect(bcvService.getBcvRates).toHaveBeenCalledTimes(1); // Cada test llama 1 vez
    expect(carService.findOrCreateCar).toHaveBeenCalledTimes(1);
    expect(pool.execute).toHaveBeenCalledTimes(1);
  });
});