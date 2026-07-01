import SalidaService from "../services/SalidaService.js";
import RespuestaApi from "../utils/RespuestaApi.js";

class SalidaController {
  async crear(request, reply) {
    const salida = await SalidaService.crearSalida(
      request.body,
      request.usuarioId,
      null,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Salida registrada", { salida }, 201);
  }

  async listar(request, reply) {
    const salidas = await SalidaService.obtenerSalidas();
    return RespuestaApi.exito(reply, "Salidas obtenidas", { salidas });
  }

  async listarPaginado(request, reply) {
    const {
      pagina = 1,
      limite = 20,
      sedeId,
      tipo,
      estado,
      clienteId,
      fechaDesde,
      fechaHasta,
    } = request.query;
    const filtros = {};
    if (sedeId) filtros.sedeId = sedeId;
    if (tipo) filtros.tipo = tipo;
    if (estado) filtros.estado = estado;
    if (clienteId) filtros.clienteId = clienteId;
    if (fechaDesde) filtros.fechaDesde = fechaDesde;
    if (fechaHasta) filtros.fechaHasta = fechaHasta;

    const resultado = await SalidaService.obtenerSalidasPaginado(
      Number(pagina),
      Number(limite),
      filtros,
    );
    return RespuestaApi.exito(reply, "Salidas obtenidas", {
      salidas: resultado.documentos || [],
      paginacion: resultado.paginacion,
    });
  }

  async obtenerPorId(request, reply) {
    const salida = await SalidaService.obtenerSalidaPorId(request.params.id);
    return RespuestaApi.exito(reply, "Salida obtenida", { salida });
  }

  async anular(request, reply) {
    const salida = await SalidaService.anularSalida(
      request.params.id,
      request.usuarioId,
      request.usuario,
    );
    return RespuestaApi.exito(reply, "Salida anulada", { salida });
  }
}

export default new SalidaController();
