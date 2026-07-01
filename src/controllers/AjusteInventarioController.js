import AjusteInventarioService from "../services/AjusteInventarioService.js";
import RespuestaApi from "../utils/RespuestaApi.js";

class AjusteInventarioController {
  async crear(request, reply) {
    const ajuste = await AjusteInventarioService.crearAjuste(
      request.body,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(
      reply,
      "Ajuste creado (pendiente aprobación)",
      { ajuste },
      201,
    );
  }

  async listar(request, reply) {
    const ajustes = await AjusteInventarioService.obtenerAjustes();
    return RespuestaApi.exito(reply, "Ajustes obtenidos", { ajustes });
  }

  async listarPaginado(request, reply) {
    const { pagina = 1, limite = 20, sedeId, estado } = request.query;
    const filtros = {};
    if (sedeId) filtros.sedeId = sedeId;
    if (estado) filtros.estado = estado;

    const resultado = await AjusteInventarioService.obtenerAjustesPaginado(
      Number(pagina),
      Number(limite),
      filtros,
    );
    return RespuestaApi.exito(reply, "Ajustes obtenidos", {
      ajustes: resultado.documentos || [],
      paginacion: resultado.paginacion,
    });
  }

  async obtenerPorId(request, reply) {
    const ajuste = await AjusteInventarioService.obtenerAjustePorId(
      request.params.id,
    );
    return RespuestaApi.exito(reply, "Ajuste obtenido", { ajuste });
  }

  async aprobar(request, reply) {
    const ajuste = await AjusteInventarioService.aprobarYAplicarAjuste(
      request.params.id,
      request.usuarioId,
    );
    return RespuestaApi.exito(reply, "Ajuste aprobado y aplicado", { ajuste });
  }

  async rechazar(request, reply) {
    const ajuste = await AjusteInventarioService.rechazarAjuste(
      request.params.id,
      request.usuarioId,
    );
    return RespuestaApi.exito(reply, "Ajuste rechazado", { ajuste });
  }
}

export default new AjusteInventarioController();
