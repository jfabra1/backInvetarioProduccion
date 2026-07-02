import OrdenPedidoController from "../controllers/OrdenPedidoController.js";
import { autenticar } from "../hooks/auth.hook.js";
import { verificarPermiso } from "../hooks/permisos.hook.js";
import {
  schemaCrearOrdenPedido,
  schemaListarOrdenesPedido,
  schemaListarOrdenesPedidoPaginado,
  schemaObtenerOrdenPedido,
  schemaResponderOrdenPedido,
  schemaAnularOrdenPedido,
} from "../docs/ordenPedido.docs.js";

async function ordenPedidoRoutes(fastify) {
  fastify.addHook("onRequest", autenticar);

  fastify.post(
    "/",
    {
      schema: schemaCrearOrdenPedido,
      preHandler: verificarPermiso("ordenes_pedido", "crear"),
    },
    (req, reply) => OrdenPedidoController.crear(req, reply),
  );

  fastify.get(
    "/",
    {
      schema: schemaListarOrdenesPedido,
      preHandler: verificarPermiso("ordenes_pedido", "ver"),
    },
    (req, reply) => OrdenPedidoController.listar(req, reply),
  );

  fastify.get(
    "/paginado",
    {
      schema: schemaListarOrdenesPedidoPaginado,
      preHandler: verificarPermiso("ordenes_pedido", "ver"),
    },
    (req, reply) => OrdenPedidoController.listarPaginado(req, reply),
  );

  fastify.get(
    "/:id",
    {
      schema: schemaObtenerOrdenPedido,
      preHandler: verificarPermiso("ordenes_pedido", "ver"),
    },
    (req, reply) => OrdenPedidoController.obtenerPorId(req, reply),
  );

  fastify.patch(
    "/:id/responder",
    {
      schema: schemaResponderOrdenPedido,
      preHandler: verificarPermiso("ordenes_pedido", "actualizar"),
    },
    (req, reply) => OrdenPedidoController.responder(req, reply),
  );

  fastify.patch(
    "/:id/anular",
    {
      schema: schemaAnularOrdenPedido,
      preHandler: verificarPermiso("ordenes_pedido", "eliminar"),
    },
    (req, reply) => OrdenPedidoController.anular(req, reply),
  );
}

export default ordenPedidoRoutes;
