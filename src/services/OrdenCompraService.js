import mongoose from "mongoose";
import OrdenCompraRepository from "../repositories/OrdenCompraRepository.js";
import EntradaService from "./EntradaService.js";
import ErrorApi from "../utils/ErrorApi.js";
import { generarCodigo } from "../utils/generadorCodigo.util.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";
import { verificarAccesoSede } from "../utils/accesoSede.util.js";

class OrdenCompraService {
  async crearOrden(datos, usuarioId, usuarioActual = null) {
    if (!datos.items || datos.items.length === 0) {
      throw new ErrorApi(400, "La orden debe tener al menos un item");
    }
    verificarAccesoSede(usuarioActual, datos.sedeId, "crear órdenes de compra en");

    const codigo = await generarCodigo(
      "OC",
      OrdenCompraRepository.model,
      "codigo",
    );

    const orden = await OrdenCompraRepository.create({
      codigo,
      proveedorId: datos.proveedorId,
      sedeId: datos.sedeId,
      items: datos.items.map((item) => ({
        productoId: item.productoId,
        cantidadSolicitada: item.cantidadSolicitada,
        cantidadRecibida: 0,
        costoUnitario: item.costoUnitario || 0,
        observacion: item.observacion || "",
      })),
      observaciones: datos.observaciones || "",
      creadoPor: usuarioId,
      estado: "borrador",
      trazabilidad: [
        crearTrazabilidad(
          usuarioId,
          "creacion",
          `Orden de compra ${codigo} creada`,
        ),
      ],
    });

    logAccionUsuario(usuarioId, "CREAR_ORDEN_COMPRA", {
      ordenCreada: orden._id,
    });
    return orden;
  }

  async enviarOrden(id, usuarioId, usuarioActual = null) {
    const orden = await OrdenCompraRepository.findById(id);
    if (!orden) throw new ErrorApi(404, "Orden no encontrada");
    verificarAccesoSede(usuarioActual, orden.sedeId, "enviar órdenes de compra de");
    if (orden.estado !== "borrador")
      throw new ErrorApi(400, "Solo se pueden enviar borradores");

    const actualizada = await OrdenCompraRepository.updateById(id, {
      $set: { estado: "enviada", fechaEnvio: new Date() },
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "cambio_estado",
          "Orden enviada al proveedor",
        ),
      },
    });
    logAccionUsuario(usuarioId, "ENVIAR_ORDEN_COMPRA", { ordenId: id });
    return actualizada;
  }

  async registrarRecepcion(id, datos, usuarioId, usuarioActual = null) {
    const orden = await OrdenCompraRepository.findById(id);
    if (!orden) throw new ErrorApi(404, "Orden no encontrada");
    verificarAccesoSede(usuarioActual, orden.sedeId, "recepcionar órdenes de compra de");
    if (!["enviada", "recibida_parcial"].includes(orden.estado)) {
      throw new ErrorApi(400, "Esta orden no está pendiente de recepción");
    }

    const sesion = await mongoose.startSession();
    sesion.startTransaction();

    try {
      const itemsEntrada = [];
      let todosCompletos = true;

      for (const itemRecibido of datos.items || []) {
        const item = orden.items.id(itemRecibido.itemId);
        if (!item) continue;

        const cantidadNueva = itemRecibido.cantidadRecibida;
        item.cantidadRecibida += cantidadNueva;

        if (item.cantidadRecibida < item.cantidadSolicitada)
          todosCompletos = false;

        if (cantidadNueva > 0) {
          itemsEntrada.push({
            productoId: item.productoId,
            cantidad: cantidadNueva,
            costoUnitario: item.costoUnitario,
            observacion: `OC ${orden.codigo}`,
          });
        }
      }

      for (const item of orden.items) {
        if (item.cantidadRecibida < item.cantidadSolicitada)
          todosCompletos = false;
      }

      orden.estado = todosCompletos ? "recibida_total" : "recibida_parcial";
      if (todosCompletos) orden.fechaRecepcion = new Date();
      orden.trazabilidad.push(
        crearTrazabilidad(
          usuarioId,
          "cambio_estado",
          `Recepción registrada - ${orden.estado}`,
        ),
      );
      await orden.save({ session: sesion });

      if (itemsEntrada.length > 0) {
        await EntradaService.crearEntrada(
          {
            tipo: "compra",
            sedeId: orden.sedeId,
            proveedorId: orden.proveedorId,
            ordenCompraId: orden._id,
            items: itemsEntrada,
            observaciones: `Recepción OC ${orden.codigo}`,
          },
          usuarioId,
          sesion,
        );
      }

      await sesion.commitTransaction();
      logAccionUsuario(usuarioId, "RECEPCION_ORDEN_COMPRA", { ordenId: id });
      return orden;
    } catch (error) {
      await sesion.abortTransaction();
      throw error;
    } finally {
      sesion.endSession();
    }
  }

  async obtenerOrdenesPaginado(pagina, limite, filtros = {}) {
    return await OrdenCompraRepository.findPaginado(filtros, pagina, limite);
  }

  async obtenerOrdenes(filtros = {}) {
    return await OrdenCompraRepository.findAll(filtros);
  }

  async obtenerOrdenPorId(id) {
    const orden = await OrdenCompraRepository.findById(id);
    if (!orden) throw new ErrorApi(404, "Orden no encontrada");
    return orden;
  }

  async actualizarOrden(id, datos, usuarioId, usuarioActual = null) {
    const orden = await OrdenCompraRepository.findById(id);
    if (!orden) throw new ErrorApi(404, "Orden no encontrada");
    verificarAccesoSede(usuarioActual, orden.sedeId, "editar órdenes de compra de");
    if (orden.estado !== "borrador")
      throw new ErrorApi(400, "Solo se pueden editar borradores");

    delete datos.estado;
    delete datos.codigo;

    const actualizada = await OrdenCompraRepository.updateById(id, {
      $set: datos,
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "actualizacion",
          "Orden de compra actualizada",
        ),
      },
    });
    logAccionUsuario(usuarioId, "ACTUALIZAR_ORDEN_COMPRA", { ordenId: id });
    return actualizada;
  }

  async anularOrden(id, usuarioId, usuarioActual = null) {
    const orden = await OrdenCompraRepository.findById(id);
    if (!orden) throw new ErrorApi(404, "Orden no encontrada");
    verificarAccesoSede(usuarioActual, orden.sedeId, "anular órdenes de compra de");
    if (!["borrador", "enviada"].includes(orden.estado)) {
      throw new ErrorApi(400, "No se puede anular una orden ya recibida");
    }

    const actualizada = await OrdenCompraRepository.updateById(id, {
      $set: { estado: "anulada" },
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "anulacion",
          "Orden de compra anulada",
        ),
      },
    });
    logAccionUsuario(usuarioId, "ANULAR_ORDEN_COMPRA", { ordenId: id });
    return actualizada;
  }
}

export default new OrdenCompraService();
