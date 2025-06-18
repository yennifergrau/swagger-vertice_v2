import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';
import pool from "./config/db";
import { createUser } from './services/auth.service';
//Routes
import authRouter from './routes/auth';
import cotizacionRouter from './routes/cotizacion';
import verifyPlateRouter from './routes/verifyPlate';
import authSypagoRouter from './routes/sypagoAuth';
import otpSypagoRouter from './routes/otpSypago';
import verifyCodeRouter from './routes/verifyCode';
import getNotificationsRouter from './routes/getNotifications';
import policyRouter from './routes/policy';
// import confirmPolicyRouter from './routes/confirm';
import publicSypagoRouter from './routes/publicSypago'; // Importar el router publicSypago
import userReportRouter from './routes/holder';
import path from 'path';

dotenv.config();

const app = express();

const corsOptions = {
  origin: ['*','http://localhost:4500', 'http://localhost:4500/api-docs', 'https://services-ui-vertice-qa.polizaqui.com','http://localhost:4500/holders/report'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ROUTES
// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Autenticacion
app.use('/auth', authRouter);
// Verifica Placa
app.use('/verify', verifyPlateRouter); // Verifica Placa
// Cotizacion
app.use('/cotizacion', cotizacionRouter);
// Sypago
app.use('/sypago', authSypagoRouter); // Autenticación Sypago
app.use('/', publicSypagoRouter); // Bancos y Tasa
app.use('/otp', otpSypagoRouter); // Solicita OTP
app.use('/verify', verifyCodeRouter); // Verificar OTP y Pagar
app.use('/getNotifications', getNotificationsRouter);
// Poliza
app.use('/authorize', policyRouter);
// app.use('/confirm', confirmPolicyRouter);
// Reporte de policy holders
app.use('/holders', userReportRouter);
// Archivos estaticos
app.use('/public', express.static(path.join(__dirname, '../public')));

// Script para crear un usuario de prueba automáticamente si no existe
(async () => {
  const username = 'admin';
  const password = 'admin1234';
  try {
    await createUser(username, password);
    console.log('Usuario admin creado o ya existe.');
  } catch (e: any) {
    if (e.code === 'ER_DUP_ENTRY') {
      console.log('El usuario admin ya existe.');
    } else {
      console.error('Error creando usuario admin:', e);
    }
  }
})();

const PORT = process.env.PORT || 4500;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

pool.getConnection()
  .then(connection => {
    console.log('¡Conexión exitosa a la base de datos MySQL!');
    connection.release();
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos MySQL:', err.message);
    process.exit(1);
  });