// src/errors/custom.errors.ts

export class DuplicatePlateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicatePlateError';
    // Mantiene la pila de llamadas para mejor depuración
    Object.setPrototypeOf(this, DuplicatePlateError.prototype);
  }
}