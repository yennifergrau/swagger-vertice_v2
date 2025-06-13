import { Request } from 'express';

// Envuelve todo en 'declare global' para asegurar que la extensión sea globalmente reconocida.
declare global {
  namespace Express {
    // Asegúrate de que el nombre de la interfaz sea 'Request' y no 'CustomRequest' u otro.
    interface Request {
      // Define la propiedad 'user' como opcional (por el '?') y con el tipo de payload que esperas.
      user?: {
        id: number;
        username: string;
        role?: string;
      };
    }
  }
}