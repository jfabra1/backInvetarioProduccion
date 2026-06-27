import VentaController from "../controllers/VentaController.js";
import { autenticar } from "../hooks/auth.hook.js";
import { verificarPermiso } from "../hooks/permisos.hook.js";
import {
  schemaCrearVenta,
  schemaListarVentasPaginado,
  schemaObtenerVenta,
  schemaAnularVenta,
} from "../docs/venta.docs.js";

async function ventaRoutes(fastify) {
  fastify.addHook("onRequest", autenticar);

  fastify.post(
    "/",
    {
      schema:     schemaCrearVenta,
      preHandler: verificarPermiso("ventas", "crear"),
    },
    (req, reply) => VentaController.crear(req, reply),
  );

  fastify.get(
    "/paginado",
    {
      schema:     schemaListarVentasPaginado,
      preHandler: verificarPermiso("ventas", "ver"),
    },
    (req, reply) => VentaController.listarPaginado(req, reply),
  );

  fastify.get(
    "/:id",
    {
      schema:     schemaObtenerVenta,
      preHandler: verificarPermiso("ventas", "ver"),
    },
    (req, reply) => VentaController.obtenerPorId(req, reply),
  );

  fastify.patch(
    "/:id/anular",
    {
      schema:     schemaAnularVenta,
      preHandler: verificarPermiso("ventas", "actualizar"),
    },
    (req, reply) => VentaController.anular(req, reply),
  );
}

export default ventaRoutes;
