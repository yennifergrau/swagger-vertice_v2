export interface GeneralData {
  policy_holder_type_document: string;
  policy_holder_document_number: number;
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
  type_plate: string;
  plate: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  color: string;
  gearbox: string;
  carroceria_serial_number: string;
  motor_serial_number: string;
  type_vehiculo: string;
  use: string;
  passenger_qty: number;
  driver: string;
  use_grua: boolean;
}

export interface GeneralDataTomador {
  type_document: string;
  insured_document: number;
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
    isTomador: boolean;
    generalData: GeneralData;
    carData: CarData;
    generalDataTomador: GeneralDataTomador;
  };
}

export interface QuotationResponse {
  order_id: number;
  primaTotal: {
      dolar: number;
      bs: number;
  };
  coberturas: {
      danosPersonas: number;
      danosCosas: number;
  };
}

export interface QuotationResult {
  order_id: number;
  primaTotal: {
    dolar: number;
    bs: number;
  };
  coberturas: {
    danosPersonas: number;
    danosCosas: number;
  };
}

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

export interface CotizacionRecord {
  order_id?: number;
  car_id: number;
  isTomador: boolean;
  policy_holder_type_document: string;
  policy_holder_document_number: string;
  policy_holder_phone: string;
  policy_holder_email: string;
  policy_holder: string;
  policy_holder_address: string;
  policy_holder_state: string;
  policy_holder_city: string;
  policy_holder_municipality: string;
  isseur_store: string;
  insured_type_document: string;
  insured_document_number: string;
  insured_phone: string;
  insured_email: string;
  insured: string;
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