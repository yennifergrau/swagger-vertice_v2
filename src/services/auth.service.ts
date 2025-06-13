// src/auth/auth.service.ts
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../db';
import bcrypt from 'bcrypt';
import { RowDataPacket } from 'mysql2/promise';
import { User } from '../interfaces/user.interface';

dotenv.config();

const JWT_SECRET = process.env.KEY || 'default_secret';

export async function login(username: string, password: string): Promise<{ token: string, exp: number } | null> {
  try {
    console.log('Intentando iniciar sesión para:', username); // <-- Añade esto
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT id, username, password FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      console.log('Usuario no encontrado:', username); // <-- Añade esto
      return null;
    }

    const user = rows[0] as User;
    console.log('Usuario encontrado, comparando contraseña. Contraseña DB (simulada):', user.password); // <-- Añade esto
    // Comparar la contraseña usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Contraseña inválida para usuario:', username); // <-- Añade esto
      return null;
    }

    console.log('Credenciales válidas, generando token para:', username); // <-- Añade esto
    const expiresInSeconds = 3600; // 1 hora
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: expiresInSeconds }
    );

    return { token, exp: expiresInSeconds };

  } catch (error) {
    console.error('Error en AuthService.login:', error); // <-- Asegúrate de que este log esté visible
    throw new Error('Error al intentar iniciar sesión');
  }
}


export async function createUser(username: string, password: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
}