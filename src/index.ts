import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json';
import pool from "./db";
import { createUser } from './services/auth.service';
//Routes
import authRouter from './routes/auth';
import cotizacionRouter from './routes/cotizacion';
import verifyRouter from './routes/verify';
import otpSypagoRouter from './routes/otpSypago';
import getNotificationsRouter from './routes/getNotifications';
import policyRouter from './routes/policy';
import confirmPolicyRouter from './routes/confirm';
import publicSypagoRouter from './routes/publicSypago'; // Importar el router publicSypago
import reportRouter from './routes/report'; // Importar el router de reportes


dotenv.config();

const app = express();

const corsOptions = {
  origin: ['http://localhost:4500', 'http://localhost:4500/api-docs', 'https://services-ui-vertice-qa.polizaqui.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Autenticacion
app.use('/auth', authRouter);
// Cotizacion
app.use('/cotizacion', cotizacionRouter);
// Sypago
app.use('/sypago', );
app.use('/', publicSypagoRouter); // Bancos y Tasa
app.use('/otp', otpSypagoRouter);
app.use('/verify', verifyRouter);
app.use('/getNotifications', getNotificationsRouter);
// Poliza
app.use('/authorize', policyRouter);
app.use('/confirm', confirmPolicyRouter);
app.use('/report', reportRouter);

app.post('/authorize', (req, res) => {
  // Lógica para manejar la autorización
  res.send('Autorización procesada');
});

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