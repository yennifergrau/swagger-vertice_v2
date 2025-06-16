// src/services/bcv.service.ts
import axios from 'axios';
import dotenv from 'dotenv'; // Ensure dotenv is imported here if BCV_API_URL comes from .env
dotenv.config();

const BCV_API_URL = process.env.BCV_API_URL || 'http://localhost:4500/tasa';

export async function getBcvRates(): Promise<{ EUR: number; USD: number }> {
  try {
    console.log(`[BCV Service] Fetching rates from: ${BCV_API_URL}`);
    const response = await axios.get(BCV_API_URL);
    const data = response.data;

    let eur = 0;
    let usd = 0;

    if (Array.isArray(data)) {
      for (const item of data) {
        if (item && typeof item.code === 'string' && typeof item.rate === 'number') {
          if (item.code.toUpperCase() === 'EUR') {
            eur = item.rate;
          } else if (item.code.toUpperCase() === 'USD') {
            usd = item.rate;
          }
        }
      }
    }

    if (!eur && !usd) { // Check if at least one was found
      throw new Error('No se pudo obtener las tasas de EUR o USD del endpoint /tasa. Formato inesperado o valores faltantes.');
    }
    // If only one is missing, you might want to handle it (e.g., set to a default, or still throw error if both are strictly required)
    // For now, if one is zero, it might cause issues later, so we will throw if both are zero.

    console.log(`[BCV Service] Rates obtained: EUR=${eur}, USD=${usd}`);
    return { EUR: Number(eur), USD: Number(usd) }; // Ensure they are numbers
  } catch (error: any) {
    console.error('[BCV Service] Error obteniendo tasas BCV:', error.message);
    // Re-throw a more general error, or handle specific Axios errors (e.g., network issues)
    if (axios.isAxiosError(error)) {
        throw new Error(`Error de conexión con la API BCV: ${error.message}`);
    }
    throw new Error(`No se pudo obtener la tasa BCV desde el endpoint /tasa: ${error.message}`);
  }
}