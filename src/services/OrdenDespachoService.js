import mongoose from "mongoose";
import OrdenDespachoRepository from "../repositories/OrdenDespachoRepository.js";
import SalidaService from "./SalidaService.js";
import ErrorApi from "../utils/ErrorApi.js";
import { generarCodigo } from "../utils/generadorCodigo.util.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";
import { verificarAccesoSede } from "../utils/accesoSede.util.js";

class OrdenDespachoService {
  async crearOrden(datos, usuarioId, usuarioActual = null) {
    if (!datos.items || datos.items.length === 0) {
      throw new ErrorApi(400, "La orden debe tener al menos un item");
    }
    verificarAccesoSede(usuarioActual, datos.sedeId, "crear órdenes de despacho en");

    const codigo = await generarCodigo(
      "DSP",
      OrdenDespachoRepository.model,
      "codigo",
    );

    const orden = await OrdenDespachoRepository.create({
      codigo,
      sedeId: datos.sedeId,
      clienteId: datos.clienteId || null,
      items: datos.items,
      direccionEntrega: datos.direccionEntrega || "",
      observaciones: datos.observaciones || "",
      creadoPor: usuarioId,
      estado: "pendiente",
      trazabilidad: [
        crearTrazabilidad(
          usuarioId,
          "creacion",
          `Orden de despacho ${codigo} creada`,
        ),
      ],
    });

    logAccionUsuario(usuarioId, "CREAR_ORDEN_DESPACHO", {
      ordenCreada: orden._id,
    });
    return orden;
  }

  async prepararOrden(id, usuarioId, usuarioActual = null) {
    const orden = await OrdenDespachoRepository.findById(id);
    if (!orden) throw new ErrorApi(404, "Orden no encontrada");
    verificarAccesoSede(usuarioActual, orden.sedeId, "preparar órdenes de despacho de");
    if (orden.estado !== "pendiente")
      throw new ErrorApi(400, "Solo órdenes pendientes");

    await OrdenDespachoRepository.updateById(id, {
      $set: { estado: "en_preparacion" },
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "cambio_estado",
          "Orden en preparación",
        ),
      },
    });
    logAccionUsuario(usuarioId, "PREPARAR_DESPACHO", { ordenId: id });
    return await OrdenDespachoRepository.findById(id);
  }

  async despacharOrden(id, usuarioId, usuarioActual = null) {
    const orden = await OrdenDespachoRepository.findById(id);
    if (!orden) throw new ErrorApi(404, "Orden no encontrada");
    verificarAccesoSede(usuarioActual, orden.sedeId, "despachar órdenes de");
    if (orden.estado !== "en_preparacion")
      throw new ErrorApi(400, "Solo órdenes en preparación");

    const sesion = await mongoose.startSession();
    sesion.startTransaction();

    try {
      const itemsSalida = orden.items.map((item) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        observacion: `Despacho ${orden.codigo}`,
      }));

      await SalidaService.crearSalida(
        {
          tipo: "venta",
          sedeId: orden.sedeId,
          clienteId: orden.clienteId,
          items: itemsSalida,
          observaciones: `Salida por despacho ${orden.codigo}`,
        },
        usuarioId,
        sesion,
      );

      await OrdenDespachoRepository.updateById(
        id,
        {
          $set: { estado: "despachada", fechaDespacho: new Date() },
          $push: {
            trazabilidad: crearTrazabilidad(
              usuarioId,
              "cambio_estado",
              "Orden despachada",
            ),
          },
        },
        { session: sesion },
      );

      await sesion.commitTransaction();
      logAccionUsuario(usuarioId, "DESPACHAR_ORDEN", { ordenId: id });
      return await OrdenDespachoRepository.findById(id);
    } catch (error) {
      await sesion.abortTransaction();
      throw error;
    } finally {
      sesion.endSession();
    }
  }

  async confirmarEntrega(id, usuarioId, usuarioActual = null) {
    const orden = await OrdenDespachoRepository.findById(id);
    if (!orden) throw new ErrorApi(404, "Orden no encontrada");
    verificarAccesoSede(usuarioActual, orden.sedeId, "confirmar entregas de");
    if (orden.estado !== "despachada")
      throw new ErrorApi(400, "Solo órdenes despachadas");

    await OrdenDespachoRepository.updateById(id, {
      $set: { estado: "entregada", fechaEntrega: new Date() },
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "cambio_estado",
          "Orden entregada al cliente",
        ),
      },
    });

    logAccionUsuario(usuarioId, "CONFIRMAR_ENTREGA", { ordenId: id });
    return await OrdenDespachoRepository.findById(id);
  }

  async obtenerOrdenesPaginado(pagina, limite, filtros = {}) {
    return await OrdenDespachoRepository.findPaginado(filtros, pagina, limite);
  }

  async obtenerOrdenes(filtros = {}) {
    return await OrdenDespachoRepository.findAll(filtros);
  }

  async obtenerOrdenPorId(id) {
    const orden = await OrdenDespachoRepository.findById(id);
    if (!orden) throw new ErrorApi(404, "Orden no encontrada");
    return orden;
  }

  async anularOrden(id, usuarioId, usuarioActual = null) {
    const orden = await OrdenDespachoRepository.findById(id);
    if (!orden) throw new ErrorApi(404, "Orden no encontrada");
    verificarAccesoSede(usuarioActual, orden.sedeId, "anular órdenes de despacho de");
    if (!["pendiente", "en_preparacion"].includes(orden.estado)) {
      throw new ErrorApi(400, "No se puede anular una orden ya despachada");
    }

    await OrdenDespachoRepository.updateById(id, {
      $set: { estado: "anulada" },
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "anulacion",
          "Orden de despacho anulada",
        ),
      },
    });
    logAccionUsuario(usuarioId, "ANULAR_DESPACHO", { ordenId: id });
    return await OrdenDespachoRepository.findById(id);
  }
}

export default new OrdenDespachoService();
