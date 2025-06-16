// src/interfaces/quotation.interface.ts

// Para el Request Body
export interface GeneralData {
  policy_holder_type_document: string;
  policy_holder_document_number: number; // Mantenido como number para el request
  policy_holder_phone: string;
  policy_holder_email: string;
  policy_holder: string;
  policy_holder_address: string;
  policy_holder_state: string;
  policy_holder_city: string;
  policy_holder_municipality: string;
  isseur_store: string;
}

export interface CarData {
  type_plate: string; // Puede ser "nacional" o "extranjera", pero el tipo es string
  plate: string;
  brand: string;
  model: string;
  version?: string; // Opcional
  year: number;
  color?: string; // Opcional
  gearbox?: string; // Opcional
  carroceria_serial_number: string;
  motor_serial_number: string;
  type_vehiculo: string; // Corresponde a 'clase' en el JSON
  use: string; // Corresponde a 'descripcion_vehiculo' o parte de ella
  passenger_qty: number;
  driver: string;
  use_grua: boolean;
}

export interface GeneralDataTomador {
  type_document: string;
  insured_document: number; // Mantenido como number para el request
  insured_phone: string;
  insured_email: string;
  insured: string;
  insured_address: string;
  insured_state: string;
  insured_city: string;
  insured_municipality: string;
  isseur_store: string;
}

export interface QuotationRequest {
  data: {
    generalData: GeneralData;
    carData: CarData;
    generalDataTomador: GeneralDataTomador;
  };
}

// Para la Respuesta del Endpoint
export interface QuotationResult {
  primaTotal: {
    dolar: number;
    bs: number;
  };
  coberturas: {
    danosPersonas: number;
    danosCosas: number;
  };
}

// Para la estructura de tu archivo tarifas.json
export interface Tarifa {
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

// Para guardar el registro de la cotización en la tabla 'orders'
export interface CotizacionRecord {
  id?: number;
  car_id: number; // PK de la tabla 'cars'
  policy_holder_type_document: string;
  policy_holder_document_number: string; // Ajustado a string según tu DDL
  policy_holder_phone: string;
  policy_holder_email: string;
  policy_holder: string; // Nombre del titular
  policy_holder_address: string;
  policy_holder_state: string;
  policy_holder_city: string;
  policy_holder_municipality: string;
  isseur_store: string;
  insured_type_document: string;
  insured_document_number: string; // Ajustado a string según tu DDL
  insured_phone: string;
  insured_email: string;
  insured: string; // Nombre del tomador
  insured_address: string;
  insured_state: string;
  insured_city: string;
  insured_municipality: string;
  insured_isseur_store: string;
  prima_total_euro: number;
  prima_total_dolar: number;
  prima_total_bs: number;
  danos_personas: number;
  danos_cosas: number;
  createdAt?: Date;
  updatedAt?: Date;
}