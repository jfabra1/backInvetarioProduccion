import "dotenv/config";
import Fastify from "fastify";
import { networkInterfaces } from "node:os";
import { conectarDB } from "./src/config/db.js";
import { inicializarPrimerUsuario } from "./src/config/bootstrap.js";
import { especificacionOpenApi } from "./src/config/openapi.js";
import { logError } from "./src/config/logger.js";
import ErrorApi from "./src/utils/ErrorApi.js";

const obtenerIpsIPv4Locales = () => {
  const interfaces = networkInterfaces();
  const ips = new Set();

  for (const red of Object.values(interfaces)) {
    if (!red) continue;

    for (const direccion of red) {
      if (direccion.family === "IPv4" && !direccion.internal) {
        ips.add(direccion.address);
      }
    }
  }

  return Array.from(ips);
};

const aplicacion = Fastify({
  logger: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    transport:
      process.env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "SYS:standard" },
          }
        : undefined,
  },
  ajv: {
    customOptions: {
      removeAdditional: "all",
      coerceTypes: true,
      allErrors: true,
    },
  },
});

// ─── Manejador global de errores ────────────────────────────
aplicacion.setErrorHandler((error, request, reply) => {
  logError(error, { url: request.url, method: request.method });

  // Errores de validación de JSON Schema (Fastify)
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      status: "fail",
      message: "Datos de entrada inválidos",
      errores: error.validation,
    });
  }

  // Errores controlados de la aplicación
  if (error instanceof ErrorApi) {
    return reply.status(error.codigoEstado).send({
      statusCode: error.codigoEstado,
      status: error.codigoEstado < 500 ? "fail" : "error",
      message: error.message,
    });
  }

  // Error de duplicado MongoDB (código 11000)
  if (error.code === 11000) {
    const campo = Object.keys(error.keyValue || {})[0];
    return reply.status(400).send({
      statusCode: 400,
      status: "fail",
      message: `El valor del campo '${campo}' ya está registrado`,
    });
  }

  // Error de validación Mongoose
  if (error.name === "ValidationError") {
    const mensajes = Object.values(error.errors).map((e) => e.message);
    return reply.status(400).send({
      statusCode: 400,
      status: "fail",
      message: mensajes.join(", "),
    });
  }

  // Rate limit (429) — @fastify/rate-limit lanza error con statusCode 429
  if (error.statusCode === 429) {
    return reply.status(429).send({
      statusCode: 429,
      status: "fail",
      message: error.message || "Demasiadas solicitudes. Intenta de nuevo más tarde.",
    });
  }

  // Error inesperado
  return reply.status(500).send({
    statusCode: 500,
    status: "error",
    message:
      process.env.NODE_ENV === "production"
        ? "Error interno del servidor"
        : error.message,
  });
});

// ─── Arranque ───────────────────────────────────────────────
const iniciar = async () => {
  try {
    await conectarDB();
    await inicializarPrimerUsuario();

    // 1. Helmet — headers de seguridad
    await aplicacion.register(import("@fastify/helmet"), {
      contentSecurityPolicy: false,
    });

    // 2. CORS
    const puerto = Number(process.env.PORT) || 3080;
    const origenesBase = (
      process.env.CORS_ORIGINS ||
      process.env.FRONTEND_URL ||
      "http://localhost:5173"
    )
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    // Agregar automáticamente las IPs de red del servidor (para que Scalar funcione desde red local)
    const origenesPermitidos = new Set(origenesBase);
    origenesPermitidos.add(`http://localhost:${puerto}`);
    origenesPermitidos.add(`http://127.0.0.1:${puerto}`);
    for (const ip of obtenerIpsIPv4Locales()) {
      origenesPermitidos.add(`http://${ip}:${puerto}`);
    }

    await aplicacion.register(import("@fastify/cors"), {
      origin: (origen, cb) => {
        if (!origen) return cb(null, true);
        if (origenesPermitidos.has(origen)) return cb(null, true);
        cb(new Error(`Origen no permitido por CORS: ${origen}`), false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    });

    // 3. Rate Limiting global
    await aplicacion.register(import("@fastify/rate-limit"), {
      max: Number(process.env.RATE_LIMIT_MAX) || 300,
      timeWindow: "15 minutes",
      errorResponseBuilder: (_request, _context) => ({
        statusCode: 429,
        status: "fail",
        message: "Demasiadas solicitudes. Intenta de nuevo en 15 minutos.",
      }),
    });

    // 4. Cookies
    await aplicacion.register(import("@fastify/cookie"));

    // 5. Multipart (subida de archivos)
    await aplicacion.register(import("@fastify/multipart"), {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB máximo
        files: 1,
      },
    });

    // 6. JWT
    await aplicacion.register(import("@fastify/jwt"), {
      secret: process.env.JWT_SECRET,
      sign: { expiresIn: process.env.JWT_EXPIRES_IN || "8h" },
    });

    // 7. Documentación OpenAPI + Scalar
    await aplicacion.register(import("@fastify/swagger"), {
      openapi: especificacionOpenApi,
    });
    await aplicacion.register(import("@scalar/fastify-api-reference"), {
      routePrefix: "/docs",
    });

    // 8. Decoradores de request
    aplicacion.decorateRequest("usuarioId", null);
    aplicacion.decorateRequest("usuario", null);
    aplicacion.decorateRequest("sedeUsuario", null);

    // 9. Rutas
    await aplicacion.register(import("./src/routes/index.js"), {
      prefix: "/api",
    });

    await aplicacion.listen({
      port: puerto,
      host: "0.0.0.0",
    });

    const ipsLocales = obtenerIpsIPv4Locales();
    for (const ip of ipsLocales) {
      aplicacion.log.info(`Server listening at http://${ip}:${puerto}`);
      aplicacion.log.info(
        `Documentación disponible en http://${ip}:${puerto}/docs`,
      );
    }
  } catch (error) {
    logError(error, { action: "INICIAR_SERVIDOR" });
    process.exit(1);
  }
};

iniciar();
