import RackService from "../services/RackService.js";
import RespuestaApi from "../utils/RespuestaApi.js";

class RackController {
  async crear(request, reply) {
    const rack = await RackService.crearRack(request.body, request.usuarioId);
    return RespuestaApi.exito(reply, "Rack creado exitosamente", { rack }, 201);
  }

  async listar(request, reply) {
    const { sedeId, incluirInactivos } = request.query;
    const filtros = {};
    if (sedeId) filtros.sedeId = sedeId;
    if (incluirInactivos !== undefined) filtros.incluirInactivos = incluirInactivos === true;

    const racks = await RackService.obtenerRacks(filtros);
    return RespuestaApi.exito(reply, "Racks obtenidos", { racks });
  }

  async listarPaginado(request, reply) {
    const { pagina = 1, limite = 50, sedeId, nombre, incluirInactivos } = request.query;
    const filtros = {};
    if (sedeId) filtros.sedeId = sedeId;
    if (nombre) filtros.nombre = nombre;
    if (incluirInactivos !== undefined) filtros.incluirInactivos = incluirInactivos === true;

    const resultado = await RackService.obtenerRacksPaginado(
      Number(pagina),
      Number(limite),
      filtros,
    );

    return RespuestaApi.exito(reply, "Racks obtenidos", {
      racks: resultado.documentos,
      paginacion: resultado.paginacion,
    });
  }

  async obtenerPorId(request, reply) {
    const rack = await RackService.obtenerRackPorId(request.params.id);
    return RespuestaApi.exito(reply, "Rack obtenido", { rack });
  }

  async actualizar(request, reply) {
    const rack = await RackService.actualizarRack(
      request.params.id,
      request.body,
      request.usuarioId,
    );
    return RespuestaApi.exito(reply, "Rack actualizado", { rack });
  }

  async eliminar(request, reply) {
    await RackService.eliminarRack(request.params.id, request.usuarioId);
    return RespuestaApi.exito(reply, "Rack desactivado exitosamente");
  }

  async actualizarEstado(request, reply) {
    const rack = await RackService.actualizarEstadoRack(
      request.params.id,
      request.body?.activo,
      request.usuarioId,
    );
    return RespuestaApi.exito(reply, "Estado de rack actualizado", { rack });
  }
}

export default new RackController();
