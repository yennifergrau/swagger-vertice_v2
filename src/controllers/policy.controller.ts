import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import {getOrderAndCarData} from '../services/policy.service'
import axios from 'axios';

import { insertPolicy } from '../services/policy.service';
import pool from '../config/db';
import { fillPdfTemplate } from '../utils/fillPdfTemplate';
import { Policy } from '../interfaces/policy.interface';

interface SyPagoAuthResponse {
    access_token: string;
    exp?: number;
}

const MY_SYPAGO_API_BASE_URL = 'http://localhost:4500';

let sypagoAuthToken: string | null = null;
let sypagoTokenExpiry: number = 0;


const getSyPagoToken = async (): Promise<string> => {
    const now = Date.now();
    if (sypagoAuthToken && sypagoTokenExpiry > now + (5 * 60 * 1000)) {
        console.log('[SyPago] Reutilizando token existente.');
        return sypagoAuthToken as string;
    }

    try {
        console.log('[SyPago] Obteniendo nuevo token de SyPago desde /sypago/auth...');
        const response = await axios.post<SyPagoAuthResponse>(`${MY_SYPAGO_API_BASE_URL}/sypago/auth`);

        // console.log('[SyPago] Respuesta de /sypago/auth (status):', response.status);
        // console.log('[SyPago] Respuesta de /sypago/auth (headers):', response.headers);
        // console.log('[SyPago] Respuesta de /sypago/auth (data):', response.data);
        // ----------------------------------------------------------

        // Validación adicional para asegurarnos de que la propiedad existe
        if (!response.data || typeof response.data.access_token !== 'string') {
            console.error('[SyPago] La respuesta de /sypago/auth no contiene un "access_token" válido o no es un string.');
            throw new Error('Formato de respuesta inesperado de SyPago auth.');
        }

        sypagoAuthToken = response.data.access_token;
        sypagoTokenExpiry = response.data.exp ? response.data.exp * 1000 : now + (3600 * 1000);
        console.log('[SyPago] Token obtenido y almacenado.');
        return sypagoAuthToken;
    } catch (error: any) {
        // --- ¡CAMBIO CRUCIAL AQUÍ: Imprime el objeto de error completo! ---
        console.error('Error completo al obtener el token de SyPago:', error);

        // Si es un error de Axios, imprime más detalles
        if (axios.isAxiosError(error)) {
            if (error.response) {
                // El servidor respondió con un código de estado fuera del rango 2xx
                console.error('Detalles de la respuesta de error de Axios:', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers,
                });
            } else if (error.request) {
                // La solicitud fue hecha pero no se recibió respuesta (ej. servidor no responde)
                console.error('Error de solicitud Axios: No se recibió respuesta del servidor. Request:', error.request);
            } else {
                // Algo más causó el error al configurar la solicitud
                console.error('Error de configuración Axios:', error.message);
            }
        }
        // -------------------------------------------------------------
        throw new Error('No se pudo obtener el token de autenticación de SyPago.');
    }
};

export const authorizePolicy = async (req: Request, res: Response) => {
    try {
        const { order_id, transaction_id } = req.body;

        if (!order_id || !transaction_id) {
            return res.status(400).json({
                error: 'Datos incompletos o inválidos. Se requiere orden_id y transaction_id.'
            });
        }

        // Obtener datos de la orden y el vehículo
        const { order, car } = await getOrderAndCarData(order_id);

        // Verificar si ya existe una póliza vigente para este vehículo
        const hoy = new Date();
        const hoyStr = hoy.toISOString().slice(0, 10);
        const [vigente]: any = await pool.query(
            'SELECT * FROM policies WHERE car_id = ? AND policy_status = ? AND end_date >= ?',
            [car.car_id, 'APPROVED', hoyStr]
        );
        
        if (vigente && vigente.length > 0) {
            return res.status(409).json({
                error: 'Ya existe una póliza vigente para este vehículo.'
            });
        }

        // Verificar estado del pago con SyPago
        let paymentStatus: string;
        try {
            const token = await getSyPagoToken();
            const sypagoResponse = await axios.post(`${MY_SYPAGO_API_BASE_URL}/getNotifications`, {
                id_transaction: transaction_id
            }, {
                headers: {
                    'SyPago-Token': token
                }
            });
            paymentStatus = sypagoResponse.data.status; 
        } catch (sypagoError: any) {
            console.error('Error al consultar SyPago:', sypagoError.response ? sypagoError.response.data : sypagoError.message);
            return res.status(500).json({
                error: 'Error al verificar el estado del pago con SyPago.',
                message: sypagoError.response ? sypagoError.response.data.message : sypagoError.message,
                status: 'PAYMENT_VERIFICATION_FAILED'
            });
        }

        if (paymentStatus !== 'ACCP') {
            console.warn(`Intento de emisión de póliza para orden ${order_id} con pago NO APROBADO. Estado: ${paymentStatus}`);
            return res.status(402).json({
                error: `El pago para la transacción ${transaction_id} no ha sido aprobado. Estado actual: ${paymentStatus}.`,
                status: 'PAYMENT_REJECTED_OR_PENDING'
            });
        }

        // Configurar fechas de la póliza
        const ahora = new Date();
        const expiracion = new Date();
        expiracion.setFullYear(expiracion.getFullYear() + 1);

        const formatDate = (fecha: Date) => {
            const dia = String(fecha.getDate()).padStart(2, '0');
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const año = fecha.getFullYear();
            const hora = String(fecha.getHours()).padStart(2, '0');
            const min = String(fecha.getMinutes()).padStart(2, '0');
            const sec = String(fecha.getSeconds()).padStart(2, '0');
            return {
                fecha: `${dia}/${mes}/${año}`,
                hora: `${hora}:${min}:${sec}`
            };
        };

        const { fecha: fecha_creacion, hora: hora_creacion } = formatDate(ahora);
        const { fecha: fecha_expiracion, hora: hora_expiracion } = formatDate(expiracion);

        // Generar número de póliza único
        const numeroPoliza = 'POL' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const pdfUrl = `https://services-ui-vertice-qa.polizaqui.com/public/polizas/${numeroPoliza}.pdf`;

        // Preparar datos para insertar en policies
        const policyToInsert: Policy = {
            order_id: Number(order_id),
            car_id: car.car_id,
            policy_number: numeroPoliza,
            issue_date: ahora.toISOString().split('T')[0],
            start_date: ahora.toISOString().split('T')[0],
            end_date: expiracion.toISOString().split('T')[0],
            policy_status: 'APPROVED',
            transaction_id: transaction_id,
            payment_status: paymentStatus,
            pdf_url: pdfUrl
        };

        // Insertar póliza en la base de datos
        await insertPolicy(policyToInsert);

        // Preparar datos para el PDF - ajustado a la interfaz PdfData
        const pdfData = {
            policy_holder: order.policy_holder,
            policy_holder_type_document: order.policy_holder_type_document || 'V',
            policy_holder_document_number: order.policy_holder_document_number,
            policy_holder_address: order.policy_holder_address || '',
            policy_holder_state: order.policy_holder_state || '',
            policy_holder_city: order.policy_holder_city || '',
            policy_holder_municipality: order.policy_holder_municipality || '',
            isseur_store: order.isseur_store || 'Sucursal Principal',
            orden_id: order_id.toString(),
            numero_poliza: numeroPoliza,
            fecha_creacion,
            hora_creacion,
            fecha_expiracion,
            hora_expiracion,
            plate: car.plate,
            brand: car.brand,
            model: car.model,
            version: car.version || '',
            year: car.year.toString(),
            color: car.color || '',
            gearbox: car.gearbox || '',
            carroceria_serial_number: car.carroceria_serial_number || '',
            motor_serial_number: car.motor_serial_number || '',
            type_vehiculo: car.type_vehiculo || '',
            use: car.use || '',
            passenger_qty: car.passenger_qty?.toString() || '0',
            driver: car.driver || order.policy_holder,
            prima_total_euro: order.prima_total_euro?.toString() || '0',
            prima_total_dolar: order.prima_total_dolar?.toString() || '0',
            prima_total_bs: order.prima_total_bs?.toString() || '0',
            danos_personas: order.danos_personas?.toString() || '0',
            danos_cosas: order.danos_cosas?.toString() || '0',
            car_id: car.car_id.toString()
        };

        // Generar PDF
        const outputPath = path.join(__dirname, '../public/polizas', `${numeroPoliza}.pdf`);
        await fillPdfTemplate(pdfData, outputPath);

        return res.status(201).json({
            estado: 'APPROVED',
            numero_poliza: numeroPoliza,
            url_pdf: pdfUrl,
            message: 'Póliza emitida exitosamente'
        });

    } catch (error: any) {
        console.error('Error en authorizePolicy:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message,
            details: error.stack
        });
    }
};

export const confirmPolicy = async (req: Request, res: Response) => {
    try {
        const { reference, status } = req.body;
        await require('../services/policy.service').confirmPolicyStatus(reference, status);

        return res.status(200).json({
            message: 'Confirmación exitosa',
            status: true,
            estado: status
        });
    } catch (e: any) {
        console.error('Error al confirmar póliza:', e);
        if (e.message.includes('No se encontró la póliza')) {
            return res.status(404).json({ message: e.message });
        }
        return res.status(500).json({ message: 'Error interno del servidor.', error: e.message });
    }
};