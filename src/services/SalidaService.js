import mongoose from "mongoose";
import SalidaRepository from "../repositories/SalidaRepository.js";
import StockRepository from "../repositories/StockRepository.js";
import ErrorApi from "../utils/ErrorApi.js";
import { generarCodigo } from "../utils/generadorCodigo.util.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";
import { verificarAccesoSede } from "../utils/accesoSede.util.js";

class SalidaService {
  async crearSalida(datos, usuarioId, sesionExterna = null, usuarioActual = null) {
    if (!datos.items || datos.items.length === 0) {
      throw new ErrorApi(400, "La salida debe tener al menos un item");
    }
    verificarAccesoSede(usuarioActual, datos.sedeId, "crear salidas en");

    const sesion = sesionExterna || (await mongoose.startSession());
    if (!sesionExterna) sesion.startTransaction();

    try {
      // Verificar stock disponible para cada item
      for (const item of datos.items) {
        const stock = await StockRepository.findByProductoYSede(
          item.productoId,
          datos.sedeId,
          { session: sesion },
        );
        if (!stock || stock.cantidadDisponible < item.cantidad) {
          throw new ErrorApi(
            400,
            `Stock insuficiente para producto ${item.productoId}`,
          );
        }
      }

      const codigo = await generarCodigo(
        "SAL",
        SalidaRepository.model,
        "codigo",
      );

      // Aplicar decrementos
      for (const item of datos.items) {
        const resultado = await StockRepository.decrementarStock(
          item.productoId,
          datos.sedeId,
          item.cantidad,
          { session: sesion },
        );
        if (!resultado) {
          throw new ErrorApi(
            400,
            `Error al decrementar stock del producto ${item.productoId}`,
          );
        }
      }

      const salida = await SalidaRepository.create(
        {
          codigo,
          tipo: datos.tipo || "venta",
          sedeId: datos.sedeId,
          clienteId: datos.clienteId || null,
          trasladoId: datos.trasladoId || null,
          items: datos.items,
          observaciones: datos.observaciones || "",
          creadoPor: usuarioId,
          estado: "aplicada",
          trazabilidad: [
            crearTrazabilidad(
              usuarioId,
              "creacion",
              `Salida ${codigo} creada - tipo: ${datos.tipo || "venta"}`,
            ),
          ],
        },
        { session: sesion },
      );

      if (!sesionExterna) await sesion.commitTransaction();

      logAccionUsuario(usuarioId, "CREAR_SALIDA", {
        salidaCreada: salida._id,
        codigo,
        tipo: datos.tipo,
        sedeId: datos.sedeId,
      });

      return salida;
    } catch (error) {
      if (!sesionExterna) await sesion.abortTransaction();
      throw error;
    } finally {
      if (!sesionExterna) sesion.endSession();
    }
  }

  async obtenerSalidasPaginado(pagina, limite, filtros = {}) {
    return await SalidaRepository.findPaginado(filtros, pagina, limite);
  }

  async obtenerSalidas(filtros = {}) {
    return await SalidaRepository.findAll(filtros);
  }

  async obtenerSalidaPorId(id) {
    const salida = await SalidaRepository.findById(id);
    if (!salida) throw new ErrorApi(404, "Salida no encontrada");
    return salida;
  }

  async anularSalida(id, usuarioId, usuarioActual = null) {
    const salida = await SalidaRepository.findById(id);
    if (!salida) throw new ErrorApi(404, "Salida no encontrada");
    verificarAccesoSede(usuarioActual, salida.sedeId, "anular salidas de");
    if (salida.estado === "anulada")
      throw new ErrorApi(400, "La salida ya está anulada");

    const sesion = await mongoose.startSession();
    sesion.startTransaction();

    try {
      for (const item of salida.items) {
        await StockRepository.incrementarStock(
          item.productoId,
          salida.sedeId,
          item.cantidad,
          { session: sesion },
        );
      }

      const actualizada = await SalidaRepository.updateById(
        id,
        {
          $set: { estado: "anulada" },
          $push: {
            trazabilidad: crearTrazabilidad(
              usuarioId,
              "anulacion",
              "Salida anulada",
            ),
          },
        },
        { session: sesion },
      );

      await sesion.commitTransaction();
      logAccionUsuario(usuarioId, "ANULAR_SALIDA", { salidaAnulada: id });
      return actualizada;
    } catch (error) {
      await sesion.abortTransaction();
      throw error;
    } finally {
      sesion.endSession();
    }
  }
}

export default new SalidaService();
