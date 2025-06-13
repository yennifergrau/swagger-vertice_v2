// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.KEY || 'default_secret';

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const access_token = authHeader && authHeader.split(' ')[1];

  if (!access_token) {
    res.status(401).json({ message: 'Token no proporcionado. Acceso denegado.' });
    return;
  }

  jwt.verify(access_token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ message: 'Token inválido o expirado. Acceso denegado.' });
      return;
    }

    // Aquí es donde 'req.user' necesita ser reconocido.
    (req as any).user = user as { id: number; username: string; role?: string; };

    next();
  });
}