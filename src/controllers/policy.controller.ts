// src/controllers/policy.controller.ts
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import axios from 'axios'; // Asegúrate de que axios esté importado

import { insertPolicy } from '../services/policy.service';
import pool from '../config/db';
import { fillPdfTemplate } from '../utils/fillPdfTemplate';
import { Policy } from '../interfaces/policy.interface';

// Define una interfaz para la respuesta esperada del endpoint /sypago/auth
interface SyPagoAuthResponse {
    access_token: string;
    exp?: number;
}

// Base URL para tu propia API donde se exponen los endpoints de SyPago
const MY_SYPAGO_API_BASE_URL = 'http://localhost:4500'; // ¡VERIFICA QUE ESTA URL ES CORRECTA!

// Variables para almacenar el token de SyPago y su expiración
let sypagoAuthToken: string | null = null;
let sypagoTokenExpiry: number = 0; // Timestamp de expiración

// Función para obtener el token de SyPago, con caché simple
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
        const { orden_id, carData, generalData, generalDataTomador, isTomador, transaction_id } = req.body;

        if (!orden_id || !carData || !generalData || !transaction_id) {
            return res.status(400).json({
                error: 'Datos incompletos o inválidos. Se requiere orden_id, carData, generalData y transaction_id.'
            });
        }

        const [orders]: any = await pool.query('SELECT * FROM orders WHERE order_id = ?', [orden_id]);
        if (!orders || orders.length === 0) {
            return res.status(400).json({
                error: `El orden_id ${orden_id} no existe en la tabla orders.`
            });
        }
        const order = orders[0];
        const carId = order.car_id;

        const hoy = new Date();
        const hoyStr = hoy.toISOString().slice(0, 10);
        const [vigente]: any = await pool.query(
            'SELECT * FROM policies WHERE car_id = ? AND policy_status = ? AND end_date >= ?',
            [carId, 'APPROVED', hoyStr]
        );
        if (vigente && vigente.length > 0) {
            return res.status(409).json({
                error: 'Ya existe una póliza vigente para este vehículo.'
            });
        }

        let paymentStatus: string;
        try {
            // 1. Obtener el token de SyPago
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
            console.error('Error al consultar /getNotifications de SyPago:', sypagoError.response ? sypagoError.response.data : sypagoError.message);
            return res.status(500).json({
                error: 'Error al verificar el estado del pago con SyPago.',
                message: sypagoError.response ? sypagoError.response.data.message : sypagoError.message,
                status: 'PAYMENT_VERIFICATION_FAILED'
            });
        }

        if (paymentStatus !== 'ACCP') {
            console.warn(`Intento de emisión de póliza para orden ${orden_id} con pago NO APROBADO. Transaction ID: ${transaction_id}, Estado: ${paymentStatus}`);
            return res.status(402).json({
                error: `El pago para la transacción ${transaction_id} no ha sido aprobado. Estado actual: ${paymentStatus}. No se puede emitir la póliza.`,
                status: 'PAYMENT_REJECTED_OR_PENDING'
            });
        }

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

        const numeroPoliza = 'POL' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        const pdfUrl = `https://services-ui-vertice-qa.polizaqui.com/public/polizas/${numeroPoliza}.pdf`;

        const policyToInsert: Policy = {
            order_id: Number(orden_id),
            car_id: carId,
            policy_number: numeroPoliza,
            issue_date: `${ahora.getFullYear()}-${(ahora.getMonth()+1).toString().padStart(2,'0')}-${ahora.getDate().toString().padStart(2,'0')}`,
            start_date: `${ahora.getFullYear()}-${(ahora.getMonth()+1).toString().padStart(2,'0')}-${ahora.getDate().toString().padStart(2,'0')}`,
            end_date: `${expiracion.getFullYear()}-${(expiracion.getMonth()+1).toString().padStart(2,'0')}-${expiracion.getDate().toString().padStart(2,'0')}`,
            policy_status: 'APPROVED',
            transaction_id: transaction_id,
            payment_status: paymentStatus,
            pdf_url: pdfUrl
        };

        await insertPolicy(policyToInsert);

        const datosPdf = {
            ...generalData,
            ...carData,
            policy_holder_type_document: generalData.policy_holder_type_document || 'V',
            numero_poliza: numeroPoliza,
            orden_id,
            car_id: carId,
            fecha_creacion,
            hora_creacion,
            fecha_expiracion,
            hora_expiracion
        };

        const outputPath = path.join(__dirname, '../public/polizas', `${numeroPoliza}.pdf`);
        await fillPdfTemplate(datosPdf, outputPath);

        return res.status(201).json({
            estado: 'APPROVED',
            numero_poliza: numeroPoliza,
            url_pdf: pdfUrl
        });

    } catch (error: any) {
        console.error('Error en authorizePolicy:', error);
        return res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
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