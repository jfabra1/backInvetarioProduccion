import RackController from "../controllers/RackController.js";
import { autenticar } from "../hooks/auth.hook.js";
import { verificarPermiso } from "../hooks/permisos.hook.js";
import {
  schemaCrearRack,
  schemaListarRacks,
  schemaListarRacksPaginado,
  schemaObtenerRack,
  schemaActualizarRack,
  schemaEliminarRack,
  schemaActualizarEstadoRack,
} from "../docs/rack.docs.js";

async function rackRoutes(fastify) {
  fastify.addHook("onRequest", autenticar);

  fastify.get(
    "/",
    { schema: schemaListarRacks, preHandler: verificarPermiso("racks", "ver") },
    (req, reply) => RackController.listar(req, reply),
  );
  fastify.get(
    "/paginado",
    { schema: schemaListarRacksPaginado, preHandler: verificarPermiso("racks", "ver") },
    (req, reply) => RackController.listarPaginado(req, reply),
  );
  fastify.get(
    "/:id",
    { schema: schemaObtenerRack, preHandler: verificarPermiso("racks", "ver") },
    (req, reply) => RackController.obtenerPorId(req, reply),
  );

  fastify.post(
    "/",
    { schema: schemaCrearRack, preHandler: verificarPermiso("racks", "crear") },
    (req, reply) => RackController.crear(req, reply),
  );
  fastify.put(
    "/:id",
    { schema: schemaActualizarRack, preHandler: verificarPermiso("racks", "actualizar") },
    (req, reply) => RackController.actualizar(req, reply),
  );
  fastify.patch(
    "/:id/estado",
    { schema: schemaActualizarEstadoRack, preHandler: verificarPermiso("racks", "estado") },
    (req, reply) => RackController.actualizarEstado(req, reply),
  );
  fastify.delete(
    "/:id",
    { schema: schemaEliminarRack, preHandler: verificarPermiso("racks", "estado") },
    (req, reply) => RackController.eliminar(req, reply),
  );
}

export default rackRoutes;
