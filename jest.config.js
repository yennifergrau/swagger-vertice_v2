module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Directorio donde Jest buscará tus archivos de prueba.
  // Por convención, las pruebas se suelen poner en un directorio 'tests' o 'src/__tests__'.
  // Para este ejemplo, asumiremos 'src/__tests__'
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  // Mapeo de módulos para manejar rutas absolutas si las tienes (ej. si usas 'src/services' directamente)
  moduleNameMapper: {
    "^@src/(.*)$": "<rootDir>/src/$1" // Ejemplo: si tienes importaciones como @src/services
  },
  // Configuración para ignorar directorios o archivos
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/" // Ignorar el directorio de salida de TypeScript
  ],
  // Colección de rutas donde se encuentran tus archivos fuente (para cobertura de código)
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts", // Ignorar archivos de declaración de tipos
    "!src/db.ts", // Si no quieres probar la conexión directa a la DB aquí
    "!src/app.ts", // Si tu app.ts solo arranca el servidor
    "!src/interfaces/**/*.ts" // Generalmente no se prueban interfaces
  ],
  coverageDirectory: "coverage", // Directorio donde se guardarán los informes de cobertura
  coverageReporters: ["json", "text", "lcov"], // Formatos de informes de cobertura
};