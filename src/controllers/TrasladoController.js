import TrasladoService from "../services/TrasladoService.js";
import RespuestaApi from "../utils/RespuestaApi.js";

class TrasladoController {
  async crear(request, reply) {
    const traslado = await TrasladoService.crearSolicitud(
      request.body,
      request.usuarioId,
    );
    return RespuestaApi.exito(
      reply,
      "Solicitud de traslado creada",
      { traslado },
      201,
    );
  }

  async listar(request, reply) {
    const traslados = await TrasladoService.obtenerTraslados();
    return RespuestaApi.exito(reply, "Traslados obtenidos", { traslados });
  }

  async listarPaginado(request, reply) {
    const {
      pagina = 1,
      limite = 20,
      sedeOrigenId,
      sedeDestinoId,
      sedeId,
      estado,
    } = request.query;
    const filtros = {};
    if (sedeOrigenId) filtros.sedeOrigenId = sedeOrigenId;
    if (sedeDestinoId) filtros.sedeDestinoId = sedeDestinoId;
    if (sedeId) filtros.sedeId = sedeId;
    if (estado) filtros.estado = estado;

    const resultado = await TrasladoService.obtenerTrasladosPaginado(
      Number(pagina),
      Number(limite),
      filtros,
    );
    return RespuestaApi.exito(reply, "Traslados obtenidos", {
      traslados: resultado.documentos || [],
      paginacion: resultado.paginacion,
    });
  }

  async obtenerPorId(request, reply) {
    const traslado = await TrasladoService.obtenerTrasladoPorId(
      request.params.id,
    );
    return RespuestaApi.exito(reply, "Traslado obtenido", { traslado });
  }

  async aprobar(request, reply) {
    const traslado = await TrasladoService.aprobarTraslado(
      request.params.id,
      request.body,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Traslado procesado", { traslado });
  }

  async despachar(request, reply) {
    const traslado = await TrasladoService.despacharTraslado(
      request.params.id,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Traslado despachado", { traslado });
  }

  async recibir(request, reply) {
    const traslado = await TrasladoService.recibirTraslado(
      request.params.id,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Traslado recibido", { traslado });
  }
}

export default new TrasladoController();
