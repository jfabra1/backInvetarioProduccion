import AuthController from "../controllers/AuthController.js";
import { autenticar } from "../hooks/auth.hook.js";
import { configuracionLimitadorAuth } from "../hooks/rateLimiter.hook.js";

// perfil y renovar-token se llaman en cada carga de página / renovación
// automática. Tenían límites propios (120 y 60 cada 15 min por IP) MÁS BAJOS
// que el global, y al agotarse el front cerraba la sesión del usuario.
// Usan el mismo límite que el global.
const limiteSesion = { max: Number(process.env.RATE_LIMIT_MAX) || 300, timeWindow: "15 minutes" };
import {
  schemaLogin,
  schemaRenovarToken,
  schemaLogout,
  schemaCambiarContrasena,
  schemaSolicitarRecuperacion,
  schemaRestablecerContrasena,
  schemaPerfil,
} from "../docs/auth.docs.js";

const rutasAuth = async (fastify, opciones) => {
  // POST /api/v1/auth/login
  fastify.post(
    "/login",
    {
      config: { rateLimit: configuracionLimitadorAuth },
      schema: schemaLogin,
    },
    AuthController.login,
  );

  // POST /api/v1/auth/renovar-token (límite alto — se invoca automáticamente al renovar sesión)
  fastify.post(
    "/renovar-token",
    {
      config: { rateLimit: limiteSesion },
      schema: schemaRenovarToken,
    },
    AuthController.renovarToken,
  );

  // POST /api/v1/auth/logout
  fastify.post(
    "/logout",
    {
      preHandler: [autenticar],
      schema: schemaLogout,
    },
    AuthController.logout,
  );

  // PUT /api/v1/auth/cambiar-contrasena
  fastify.put(
    "/cambiar-contrasena",
    {
      preHandler: [autenticar],
      schema: schemaCambiarContrasena,
    },
    AuthController.cambiarContrasena,
  );

  // POST /api/v1/auth/solicitar-recuperacion
  fastify.post(
    "/solicitar-recuperacion",
    {
      config: { rateLimit: configuracionLimitadorAuth },
      schema: schemaSolicitarRecuperacion,
    },
    AuthController.solicitarRecuperacion,
  );

  // POST /api/v1/auth/restablecer-contrasena/:token
  fastify.post(
    "/restablecer-contrasena/:token",
    {
      schema: schemaRestablecerContrasena,
    },
    AuthController.restablecerContrasena,
  );

  // GET /api/v1/auth/perfil (límite alto — se invoca en cada carga de página)
  fastify.get(
    "/perfil",
    {
      config: { rateLimit: limiteSesion },
      preHandler: [autenticar],
      schema: schemaPerfil,
    },
    AuthController.perfil,
  );
};

export default rutasAuth;
