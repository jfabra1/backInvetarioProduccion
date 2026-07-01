import mongoose from "mongoose";
import AjusteInventarioRepository from "../repositories/AjusteInventarioRepository.js";
import StockRepository from "../repositories/StockRepository.js";
import ErrorApi from "../utils/ErrorApi.js";
import { generarCodigo } from "../utils/generadorCodigo.util.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";
import { verificarAccesoSede } from "../utils/accesoSede.util.js";

class AjusteInventarioService {
  async crearAjuste(datos, usuarioId, usuarioActual = null) {
    if (!datos.items || datos.items.length === 0) {
      throw new ErrorApi(400, "El ajuste debe tener al menos un item");
    }
    verificarAccesoSede(usuarioActual, datos.sedeId, "crear ajustes en");

    const codigo = await generarCodigo(
      "AJU",
      AjusteInventarioRepository.model,
      "codigo",
    );

    const itemsConDiferencia = [];
    for (const item of datos.items) {
      const stock = await StockRepository.findByProductoYSede(
        item.productoId,
        datos.sedeId,
      );
      const cantidadAnterior = stock ? stock.cantidadDisponible : 0;
      itemsConDiferencia.push({
        productoId: item.productoId,
        cantidadAnterior,
        cantidadNueva: item.cantidadNueva,
        diferencia: item.cantidadNueva - cantidadAnterior,
        motivo: item.motivo || "",
      });
    }

    const ajuste = await AjusteInventarioRepository.create({
      codigo,
      sedeId: datos.sedeId,
      items: itemsConDiferencia,
      observaciones: datos.observaciones || "",
      creadoPor: usuarioId,
      estado: "pendiente",
      trazabilidad: [
        crearTrazabilidad(usuarioId, "creacion", `Ajuste ${codigo} creado`),
      ],
    });

    logAccionUsuario(usuarioId, "CREAR_AJUSTE", { ajusteCreado: ajuste._id });
    return ajuste;
  }

  async aprobarYAplicarAjuste(id, usuarioId) {
    const ajuste = await AjusteInventarioRepository.findById(id);
    if (!ajuste) throw new ErrorApi(404, "Ajuste no encontrado");
    if (ajuste.estado !== "pendiente")
      throw new ErrorApi(400, "Solo se pueden aprobar ajustes pendientes");

    const sesion = await mongoose.startSession();
    sesion.startTransaction();

    try {
      for (const item of ajuste.items) {
        if (item.diferencia > 0) {
          await StockRepository.incrementarStock(
            item.productoId,
            ajuste.sedeId,
            item.diferencia,
            { session: sesion },
          );
        } else if (item.diferencia < 0) {
          const resultado = await StockRepository.decrementarStock(
            item.productoId,
            ajuste.sedeId,
            Math.abs(item.diferencia),
            { session: sesion },
          );
          if (!resultado) {
            // Forzar cantidad a la nueva cifra si no hay suficiente
            await StockRepository.model.findOneAndUpdate(
              { productoId: item.productoId, sedeId: ajuste.sedeId },
              {
                $set: {
                  cantidadDisponible: item.cantidadNueva,
                  ultimaActualizacion: new Date(),
                },
              },
              { upsert: true, session: sesion },
            );
          }
        }
      }

      ajuste.estado = "aplicado";
      ajuste.aprobadoPor = usuarioId;
      ajuste.fechaAprobacion = new Date();
      ajuste.trazabilidad.push(
        crearTrazabilidad(
          usuarioId,
          "aprobacion",
          "Ajuste aprobado y aplicado",
        ),
      );
      await ajuste.save({ session: sesion });

      await sesion.commitTransaction();
      logAccionUsuario(usuarioId, "APROBAR_AJUSTE", { ajusteId: id });
      return ajuste;
    } catch (error) {
      await sesion.abortTransaction();
      throw error;
    } finally {
      sesion.endSession();
    }
  }

  async rechazarAjuste(id, usuarioId) {
    const ajuste = await AjusteInventarioRepository.findById(id);
    if (!ajuste) throw new ErrorApi(404, "Ajuste no encontrado");
    if (ajuste.estado !== "pendiente")
      throw new ErrorApi(400, "Solo se pueden rechazar ajustes pendientes");

    ajuste.estado = "rechazado";
    ajuste.aprobadoPor = usuarioId;
    ajuste.fechaAprobacion = new Date();
    ajuste.trazabilidad.push(
      crearTrazabilidad(usuarioId, "rechazo", "Ajuste rechazado"),
    );
    await ajuste.save();

    logAccionUsuario(usuarioId, "RECHAZAR_AJUSTE", { ajusteId: id });
    return ajuste;
  }

  async obtenerAjustesPaginado(pagina, limite, filtros = {}) {
    return await AjusteInventarioRepository.findPaginado(
      filtros,
      pagina,
      limite,
    );
  }

  async obtenerAjustes(filtros = {}) {
    return await AjusteInventarioRepository.findAll(filtros);
  }

  async obtenerAjustePorId(id) {
    const ajuste = await AjusteInventarioRepository.findById(id);
    if (!ajuste) throw new ErrorApi(404, "Ajuste no encontrado");
    return ajuste;
  }
}

export default new AjusteInventarioService();
