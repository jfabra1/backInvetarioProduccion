import mongoose from "mongoose";
import TrasladoRepository from "../repositories/TrasladoRepository.js";
import StockRepository from "../repositories/StockRepository.js";
import EntradaService from "./EntradaService.js";
import SalidaService from "./SalidaService.js";
import ErrorApi from "../utils/ErrorApi.js";
import { generarCodigo } from "../utils/generadorCodigo.util.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";
import { verificarAccesoSede } from "../utils/accesoSede.util.js";

class TrasladoService {
  async crearSolicitud(datos, usuarioId) {
    if (!datos.items || datos.items.length === 0) {
      throw new ErrorApi(400, "El traslado debe tener al menos un item");
    }

    if (datos.sedeOrigenId === datos.sedeDestinoId) {
      throw new ErrorApi(400, "Sede origen y destino no pueden ser iguales");
    }

    const codigo = await generarCodigo(
      "TRS",
      TrasladoRepository.model,
      "codigo",
    );

    const traslado = await TrasladoRepository.create({
      codigo,
      sedeOrigenId: datos.sedeOrigenId,
      sedeDestinoId: datos.sedeDestinoId,
      items: datos.items.map((item) => ({
        productoId: item.productoId,
        cantidadSolicitada: item.cantidadSolicitada,
        cantidadAprobada: 0,
        observacion: item.observacion || "",
      })),
      observaciones: datos.observaciones || "",
      solicitadoPor: usuarioId,
      estado: "pendiente",
      trazabilidad: [
        crearTrazabilidad(
          usuarioId,
          "creacion",
          `Traslado ${codigo} solicitado`,
        ),
      ],
    });

    logAccionUsuario(usuarioId, "CREAR_TRASLADO", {
      trasladoCreado: traslado._id,
    });
    return traslado;
  }

  async aprobarTraslado(id, datos, usuarioId, usuarioActual) {
    const traslado = await TrasladoRepository.findById(id);
    if (!traslado) throw new ErrorApi(404, "Traslado no encontrado");
    verificarAccesoSede(usuarioActual, traslado.sedeOrigenId, "aprobar");
    if (traslado.estado !== "pendiente") {
      throw new ErrorApi(400, "Solo se pueden aprobar traslados pendientes");
    }

    let todoAprobado = true;
    let algunoAprobado = false;

    for (const itemAprobado of datos.items || []) {
      const item = traslado.items.id(itemAprobado.itemId);
      if (item) {
        item.cantidadAprobada = itemAprobado.cantidadAprobada;
        if (item.cantidadAprobada > 0) algunoAprobado = true;
        if (item.cantidadAprobada < item.cantidadSolicitada)
          todoAprobado = false;
      }
    }

    if (!algunoAprobado) {
      traslado.estado = "rechazado";
    } else if (todoAprobado) {
      traslado.estado = "aprobado";
    } else {
      traslado.estado = "aprobado_parcial";
    }

    traslado.aprobadoPor = usuarioId;
    traslado.fechaAprobacion = new Date();
    traslado.trazabilidad.push(
      crearTrazabilidad(usuarioId, "aprobacion", `Traslado ${traslado.estado}`),
    );
    await traslado.save();

    logAccionUsuario(usuarioId, "APROBAR_TRASLADO", {
      trasladoId: id,
      estado: traslado.estado,
    });

    return traslado;
  }

  async despacharTraslado(id, usuarioId, usuarioActual) {
    const traslado = await TrasladoRepository.findById(id);
    if (!traslado) throw new ErrorApi(404, "Traslado no encontrado");
    verificarAccesoSede(usuarioActual, traslado.sedeOrigenId, "despachar");
    if (!["aprobado", "aprobado_parcial"].includes(traslado.estado)) {
      throw new ErrorApi(400, "Solo se pueden despachar traslados aprobados");
    }

    const sesion = await mongoose.startSession();
    sesion.startTransaction();

    try {
      const itemsSalida = traslado.items
        .filter((item) => item.cantidadAprobada > 0)
        .map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidadAprobada,
          observacion: `Traslado ${traslado.codigo}`,
        }));

      await SalidaService.crearSalida(
        {
          tipo: "traslado",
          sedeId: traslado.sedeOrigenId,
          trasladoId: traslado._id,
          items: itemsSalida,
          observaciones: `Salida por traslado ${traslado.codigo}`,
        },
        usuarioId,
        sesion,
      );

      traslado.estado = "en_transito";
      traslado.trazabilidad.push(
        crearTrazabilidad(usuarioId, "cambio_estado", "Traslado despachado"),
      );
      await traslado.save({ session: sesion });

      await sesion.commitTransaction();
      logAccionUsuario(usuarioId, "DESPACHAR_TRASLADO", { trasladoId: id });
      return traslado;
    } catch (error) {
      await sesion.abortTransaction();
      throw error;
    } finally {
      sesion.endSession();
    }
  }

  async recibirTraslado(id, usuarioId, usuarioActual) {
    const traslado = await TrasladoRepository.findById(id);
    if (!traslado) throw new ErrorApi(404, "Traslado no encontrado");
    verificarAccesoSede(usuarioActual, traslado.sedeDestinoId, "recibir");
    if (traslado.estado !== "en_transito") {
      throw new ErrorApi(400, "Solo se pueden recibir traslados en tránsito");
    }

    const sesion = await mongoose.startSession();
    sesion.startTransaction();

    try {
      const itemsEntrada = traslado.items
        .filter((item) => item.cantidadAprobada > 0)
        .map((item) => ({
          productoId: item.productoId,
          cantidad: item.cantidadAprobada,
          observacion: `Traslado ${traslado.codigo}`,
        }));

      await EntradaService.crearEntrada(
        {
          tipo: "traslado",
          sedeId: traslado.sedeDestinoId,
          trasladoId: traslado._id,
          items: itemsEntrada,
          observaciones: `Entrada por traslado ${traslado.codigo}`,
        },
        usuarioId,
        sesion,
      );

      traslado.estado = "recibido";
      traslado.fechaRecepcion = new Date();
      traslado.recibidoPor = usuarioId;
      traslado.trazabilidad.push(
        crearTrazabilidad(usuarioId, "cambio_estado", "Traslado recibido"),
      );
      await traslado.save({ session: sesion });

      await sesion.commitTransaction();
      logAccionUsuario(usuarioId, "RECIBIR_TRASLADO", { trasladoId: id });
      return traslado;
    } catch (error) {
      await sesion.abortTransaction();
      throw error;
    } finally {
      sesion.endSession();
    }
  }

  async obtenerTrasladosPaginado(pagina, limite, filtros = {}) {
    const consulta = TrasladoRepository.construirFiltros(filtros);
    return await TrasladoRepository.findPaginado(consulta, pagina, limite);
  }

  async obtenerTraslados(filtros = {}) {
    return await TrasladoRepository.findAll(filtros);
  }

  async obtenerTrasladoPorId(id) {
    const traslado = await TrasladoRepository.findById(id);
    if (!traslado) throw new ErrorApi(404, "Traslado no encontrado");
    return traslado;
  }
}

export default new TrasladoService();
