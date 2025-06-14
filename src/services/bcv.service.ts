import axios from 'axios';

export async function getBcvRates(): Promise<{ EUR: number; USD: number }> {
  try {
    const response = await axios.get('http://localhost:4500/tasa');
    const data = response.data;
    // Log para depuración
    console.log('Respuesta de /tasa:', data);
    // El endpoint devuelve un array de objetos con code y rate
    let eur = 0, usd = 0;
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.code === 'EUR') eur = item.rate;
        if (item.code === 'USD') usd = item.rate;
      }
    }
    if (!eur || !usd) {
      throw new Error('No se pudo obtener la tasa EUR o USD del endpoint /tasa');
    }
    return { EUR: Number(eur), USD: Number(usd) };
  } catch (error) {
    console.error('Error obteniendo tasas BCV:', error);
    throw new Error('No se pudo obtener la tasa BCV desde el endpoint /tasa');
  }
}
