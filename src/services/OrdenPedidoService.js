import OrdenPedidoRepository from "../repositories/OrdenPedidoRepository.js";
import TrasladoService from "./TrasladoService.js";
import ErrorApi from "../utils/ErrorApi.js";
import { generarCodigo } from "../utils/generadorCodigo.util.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";
import { verificarAccesoSede } from "../utils/accesoSede.util.js";

class OrdenPedidoService {
  async crearPedido(datos, usuarioId) {
    if (!datos.items || datos.items.length === 0) {
      throw new ErrorApi(400, "El pedido debe tener al menos un item");
    }
    if (datos.sedeSolicitanteId === datos.sedeProveedoraId) {
      throw new ErrorApi(
        400,
        "Sede solicitante y sede proveedora no pueden ser iguales",
      );
    }

    const codigo = await generarCodigo("PED", OrdenPedidoRepository.model, "codigo");

    const pedido = await OrdenPedidoRepository.create({
      codigo,
      sedeSolicitanteId: datos.sedeSolicitanteId,
      sedeProveedoraId: datos.sedeProveedoraId,
      items: datos.items.map((item) => ({
        productoId: item.productoId,
        cantidadSolicitada: item.cantidadSolicitada,
        cantidadAprobada: 0,
        observacion: "",
      })),
      observaciones: datos.observaciones || "",
      solicitadoPor: usuarioId,
      estado: "pendiente",
      trazabilidad: [
        crearTrazabilidad(usuarioId, "creacion", `Pedido ${codigo} solicitado`),
      ],
    });

    logAccionUsuario(usuarioId, "CREAR_ORDEN_PEDIDO", {
      pedidoCreado: pedido._id,
    });
    return pedido;
  }

  async obtenerPedidosPaginado(pagina, limite, filtros = {}) {
    const consulta = OrdenPedidoRepository.construirFiltros(filtros);
    return await OrdenPedidoRepository.findPaginado(consulta, pagina, limite);
  }

  async obtenerPedidos(filtros = {}) {
    return await OrdenPedidoRepository.findAll(filtros);
  }

  async obtenerPedidoPorId(id) {
    const pedido = await OrdenPedidoRepository.findById(id);
    if (!pedido) throw new ErrorApi(404, "Pedido no encontrado");
    return pedido;
  }

  async responderPedido(id, datos, usuarioId, usuarioActual) {
    const pedido = await OrdenPedidoRepository.findById(id);
    if (!pedido) throw new ErrorApi(404, "Pedido no encontrado");
    verificarAccesoSede(usuarioActual, pedido.sedeProveedoraId, "responder");
    if (pedido.estado !== "pendiente") {
      throw new ErrorApi(400, "Solo se pueden responder pedidos pendientes");
    }

    let algunoAprobado = false;

    for (const itemRespondido of datos.items || []) {
      const item = pedido.items.id(itemRespondido.itemId);
      if (item) {
        item.cantidadAprobada = itemRespondido.cantidadAprobada;
        item.observacion = itemRespondido.observacion || "";
        if (item.cantidadAprobada > 0) algunoAprobado = true;
      }
    }

    pedido.revisadoPor = usuarioId;
    pedido.fechaRevision = new Date();

    if (!algunoAprobado) {
      pedido.estado = "rechazado";
      pedido.trazabilidad.push(
        crearTrazabilidad(usuarioId, "rechazo", `Pedido ${pedido.codigo} rechazado`),
      );
      await pedido.save();
      logAccionUsuario(usuarioId, "RECHAZAR_ORDEN_PEDIDO", { pedidoId: id });
      return pedido;
    }

    pedido.estado = "aceptado";

    const traslado = await TrasladoService.crearSolicitud(
      {
        sedeOrigenId: pedido.sedeProveedoraId,
        sedeDestinoId: pedido.sedeSolicitanteId,
        items: pedido.items
          .filter((item) => item.cantidadAprobada > 0)
          .map((item) => ({
            productoId: item.productoId,
            cantidadSolicitada: item.cantidadAprobada,
            observacion: item.observacion || `Pedido ${pedido.codigo}`,
          })),
        observaciones: `Generado automáticamente desde pedido ${pedido.codigo}`,
      },
      usuarioId,
    );

    await TrasladoService.aprobarTraslado(
      traslado._id,
      {
        items: traslado.items.map((item) => ({
          itemId: item._id,
          cantidadAprobada: item.cantidadSolicitada,
        })),
      },
      usuarioId,
      usuarioActual,
    );

    await TrasladoService.despacharTraslado(traslado._id, usuarioId, usuarioActual);

    pedido.trasladoId = traslado._id;
    pedido.trazabilidad.push(
      crearTrazabilidad(
        usuarioId,
        "aprobacion",
        `Pedido ${pedido.codigo} aceptado, traslado ${traslado.codigo} generado`,
      ),
    );
    await pedido.save();

    logAccionUsuario(usuarioId, "ACEPTAR_ORDEN_PEDIDO", {
      pedidoId: id,
      trasladoId: traslado._id,
    });
    return pedido;
  }

  async anularPedido(id, usuarioId, usuarioActual) {
    const pedido = await OrdenPedidoRepository.findById(id);
    if (!pedido) throw new ErrorApi(404, "Pedido no encontrado");
    verificarAccesoSede(usuarioActual, pedido.sedeSolicitanteId, "anular");
    if (pedido.estado !== "pendiente") {
      throw new ErrorApi(400, "Solo se pueden anular pedidos pendientes");
    }

    pedido.estado = "anulado";
    pedido.trazabilidad.push(
      crearTrazabilidad(usuarioId, "anulacion", `Pedido ${pedido.codigo} anulado`),
    );
    await pedido.save();

    logAccionUsuario(usuarioId, "ANULAR_ORDEN_PEDIDO", { pedidoId: id });
    return pedido;
  }
}

export default new OrdenPedidoService();
