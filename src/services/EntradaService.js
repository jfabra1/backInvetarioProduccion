import mongoose from "mongoose";
import EntradaRepository from "../repositories/EntradaRepository.js";
import StockRepository from "../repositories/StockRepository.js";
import ErrorApi from "../utils/ErrorApi.js";
import { generarCodigo } from "../utils/generadorCodigo.util.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";
import { verificarAccesoSede } from "../utils/accesoSede.util.js";

class EntradaService {
  async crearEntrada(datos, usuarioId, sesionExterna = null, usuarioActual = null) {
    if (!datos.items || datos.items.length === 0) {
      throw new ErrorApi(400, "La entrada debe tener al menos un item");
    }
    verificarAccesoSede(usuarioActual, datos.sedeId, "crear entradas en");

    const sesion = sesionExterna || (await mongoose.startSession());
    if (!sesionExterna) sesion.startTransaction();

    try {
      const codigo = await generarCodigo(
        "ENT",
        EntradaRepository.model,
        "codigo",
      );

      const entrada = await EntradaRepository.create(
        {
          codigo,
          tipo: datos.tipo || "compra",
          sedeId: datos.sedeId,
          proveedorId: datos.proveedorId || null,
          ordenCompraId: datos.ordenCompraId || null,
          trasladoId: datos.trasladoId || null,
          items: datos.items,
          observaciones: datos.observaciones || "",
          creadoPor: usuarioId,
          estado: "aplicada",
          trazabilidad: [
            crearTrazabilidad(
              usuarioId,
              "creacion",
              `Entrada ${codigo} creada - tipo: ${datos.tipo || "compra"}`,
            ),
          ],
        },
        { session: sesion },
      );

      for (const item of datos.items) {
        await StockRepository.incrementarStock(
          item.productoId,
          datos.sedeId,
          item.cantidad,
          { session: sesion },
        );
      }

      if (!sesionExterna) await sesion.commitTransaction();

      logAccionUsuario(usuarioId, "CREAR_ENTRADA", {
        entradaCreada: entrada._id,
        codigo,
        tipo: datos.tipo,
        sedeId: datos.sedeId,
      });

      return entrada;
    } catch (error) {
      if (!sesionExterna) await sesion.abortTransaction();
      throw error;
    } finally {
      if (!sesionExterna) sesion.endSession();
    }
  }

  async obtenerEntradasPaginado(pagina, limite, filtros = {}) {
    return await EntradaRepository.findPaginado(filtros, pagina, limite);
  }

  async obtenerEntradas(filtros = {}) {
    return await EntradaRepository.findAll(filtros);
  }

  async obtenerEntradaPorId(id) {
    const entrada = await EntradaRepository.findById(id);
    if (!entrada) throw new ErrorApi(404, "Entrada no encontrada");
    return entrada;
  }

  async anularEntrada(id, usuarioId, usuarioActual = null) {
    const entrada = await EntradaRepository.findById(id);
    if (!entrada) throw new ErrorApi(404, "Entrada no encontrada");
    verificarAccesoSede(usuarioActual, entrada.sedeId, "anular entradas de");
    if (entrada.estado === "anulada")
      throw new ErrorApi(400, "La entrada ya está anulada");

    const sesion = await mongoose.startSession();
    sesion.startTransaction();

    try {
      for (const item of entrada.items) {
        const resultado = await StockRepository.decrementarStock(
          item.productoId,
          entrada.sedeId,
          item.cantidad,
          { session: sesion },
        );
        if (!resultado) {
          throw new ErrorApi(
            400,
            `Stock insuficiente para revertir producto ${item.productoId}`,
          );
        }
      }

      const actualizada = await EntradaRepository.updateById(
        id,
        {
          $set: { estado: "anulada" },
          $push: {
            trazabilidad: crearTrazabilidad(
              usuarioId,
              "anulacion",
              "Entrada anulada",
            ),
          },
        },
        { session: sesion },
      );

      await sesion.commitTransaction();
      logAccionUsuario(usuarioId, "ANULAR_ENTRADA", { entradaAnulada: id });
      return actualizada;
    } catch (error) {
      await sesion.abortTransaction();
      throw error;
    } finally {
      sesion.endSession();
    }
  }
}

export default new EntradaService();
