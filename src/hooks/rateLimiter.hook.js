export const configuracionLimitadorAuth = {
  // Configurable para pruebas locales; por defecto 15 intentos por IP.
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 15,
  timeWindow: "15 minutes",
  errorResponseBuilder: () => ({
    statusCode: 429,
    status: "fail",
    message: "Demasiados intentos de login. Intenta en 15 minutos.",
  }),
};

export const configuracionLimitadorCreacion = {
  max: 30,
  timeWindow: "1 hour",
  errorResponseBuilder: () => ({
    statusCode: 429,
    status: "fail",
    message: "Demasiadas solicitudes de creación. Intenta más tarde.",
  }),
};

export const configuracionLimitadorEstricto = {
  max: 10,
  timeWindow: "1 hour",
  errorResponseBuilder: () => ({
    statusCode: 429,
    status: "fail",
    message: "Demasiadas solicitudes. Intenta más tarde.",
  }),
};
