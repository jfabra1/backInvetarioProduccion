import mongoose from "mongoose";
import VentaRepository from "../repositories/VentaRepository.js";
import StockRepository from "../repositories/StockRepository.js";
import ProductoRepository from "../repositories/ProductoRepository.js";
import ErrorApi from "../utils/ErrorApi.js";
import { generarCodigo } from "../utils/generadorCodigo.util.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";

class VentaService {
  async crearVenta(datos, usuarioId) {
    if (!datos.items || datos.items.length === 0)
      throw new ErrorApi(400, "La venta debe tener al menos un item");

    const sesion = await mongoose.startSession();
    sesion.startTransaction();

    try {
      // Verificar stock y enriquecer items con codigoExterno
      const itemsEnriquecidos = [];
      for (const item of datos.items) {
        const stock = await StockRepository.findByProductoYSede(
          item.productoId,
          datos.sedeId,
          { session: sesion },
        );
        if (!stock || stock.cantidadDisponible < item.cantidad) {
          const prod = await ProductoRepository.findById(item.productoId);
          const nombre = prod?.nombre || item.productoId;
          throw new ErrorApi(400, `Stock insuficiente para "${nombre}"`);
        }
        const prod = await ProductoRepository.findById(item.productoId);
        itemsEnriquecidos.push({
          productoId: item.productoId,
          cantidad:   Number(item.cantidad),
          codigoExterno: prod?.codigoExterno || "",
        });
      }

      const codigo = await generarCodigo("VNT", VentaRepository.model, "codigo");

      // Decrementar stock
      for (const item of itemsEnriquecidos) {
        const ok = await StockRepository.decrementarStock(
          item.productoId,
          datos.sedeId,
          item.cantidad,
          { session: sesion },
        );
        if (!ok)
          throw new ErrorApi(400, `Error al decrementar stock del producto ${item.productoId}`);
      }

      const venta = await VentaRepository.create(
        {
          codigo,
          sedeId:        datos.sedeId,
          clienteId:     datos.clienteId || null,
          vendedorId:    usuarioId,
          items:         itemsEnriquecidos,
          observaciones: datos.observaciones || "",
          estado:        "aplicada",
          trazabilidad: [
            crearTrazabilidad(usuarioId, "creacion", `Venta ${codigo} registrada`),
          ],
        },
        { session: sesion },
      );

      await sesion.commitTransaction();

      logAccionUsuario(usuarioId, "CREAR_VENTA", {
        ventaId: venta._id,
        codigo,
        sedeId: datos.sedeId,
      });

      return venta;
    } catch (err) {
      await sesion.abortTransaction();
      throw err;
    } finally {
      sesion.endSession();
    }
  }

  async obtenerVentasPaginado(pagina, limite, filtros = {}) {
    return VentaRepository.findAllPaginado(pagina, limite, filtros);
  }

  async obtenerVentaPorId(id) {
    const venta = await VentaRepository.findById(id);
    if (!venta) throw new ErrorApi(404, "Venta no encontrada");
    return venta;
  }

  async anularVenta(id, usuarioId) {
    const venta = await VentaRepository.findById(id);
    if (!venta)              throw new ErrorApi(404, "Venta no encontrada");
    if (venta.estado === "anulada") throw new ErrorApi(400, "La venta ya está anulada");

    const sesion = await mongoose.startSession();
    sesion.startTransaction();

    try {
      for (const item of venta.items) {
        await StockRepository.incrementarStock(
          item.productoId,
          venta.sedeId,
          item.cantidad,
          { session: sesion },
        );
      }

      const actualizada = await VentaRepository.updateById(
        id,
        {
          $set:  { estado: "anulada" },
          $push: { trazabilidad: crearTrazabilidad(usuarioId, "anulacion", "Venta anulada") },
        },
        { session: sesion },
      );

      await sesion.commitTransaction();
      logAccionUsuario(usuarioId, "ANULAR_VENTA", { ventaId: id });
      return actualizada;
    } catch (err) {
      await sesion.abortTransaction();
      throw err;
    } finally {
      sesion.endSession();
    }
  }
}

export default new VentaService();
