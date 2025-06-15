// src/types/express/index.d.ts
import { Request } from 'express';

// Define la estructura de tu objeto de usuario.
// ¡Asegúrate de que 'id' coincida con el tipo de tu ID de usuario (string o number)!
interface User {
  id: string; // O 'number' si tu user ID es numérico
  // Agrega otras propiedades si tu objeto de usuario las tiene, por ejemplo:
  // email: string;
  // name: string;
  // roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: User; // La propiedad 'user' puede ser opcional (si el usuario no está autenticado)
    }
  }
}