import fs from 'fs';
import path from 'path';

// Definición de la interfaz Tarifa basada en la estructura de tarifas.json
interface Tarifa {
  id: number;
  clase: string;
  grupo: string;
  descripcion_vehiculo: string;
  nacional_danos_cosas_eur: number | null;
  nacional_danos_cosas_usd: number | null;
  nacional_danos_personas_eur: number | null;
  nacional_danos_personas_usd: number | null;
  nacional_prima_anual_eur: number | null;
  nacional_prima_anual_usd: number | null;
  nacional_prima_tasa_cambio_bs: number | null;
  extranjera_danos_cosas_eur: number | null;
  extranjera_danos_cosas_usd: number | null;
  extranjera_danos_personas_eur: number | null;
  extranjera_danos_personas_usd: number | null;
  extranjera_prima_anual_eur: number | null;
  extranjera_prima_anual_usd: number | null;
  extranjera_prima_tasa_cambio_bs: number | null;
  prima_servicio_grua_usd: number | null;
}

/**
 * Carga las tarifas desde el archivo tarifas.json.
 * El archivo tarifas.json se busca en el directorio de trabajo actual (CWD).
 * @returns Un array de objetos Tarifa.
 * @throws Error si no se pueden cargar o parsear las tarifas.
 */
export function loadTarifas(): Tarifa[] {
  try {
    const filePath = path.resolve(process.cwd(), 'tarifas.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const tarifas = JSON.parse(fileContent);
    // Parsear el contenido del archivo como un array de Tarifas
    const loadedTarifas: Tarifa[] = JSON.parse(fileContent);
    console.log('[Quotation Service] Tarifas cargadas exitosamente.');
    return loadedTarifas;
  } catch (error) {
    console.error('[Quotation Service] Error al cargar tarifas.json:', error);
    // Relanzar el error para que el llamador pueda manejarlo
    throw new Error('Error crítico: No se pudieron cargar las tarifas de RCV.');
  }
};

