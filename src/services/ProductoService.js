import ProductoRepository from "../repositories/ProductoRepository.js";
import StockRepository from "../repositories/StockRepository.js";
import ErrorApi from "../utils/ErrorApi.js";
import { generarCodigo } from "../utils/generadorCodigo.util.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";

class ProductoService {
  async crearProducto(datos, usuarioId) {
    const codigoInterno = await generarCodigo(
      "PRD",
      ProductoRepository.model,
      "codigoInterno",
    );
    const codigoExterno = String(datos.codigoExterno || "").trim();

    const producto = await ProductoRepository.create({
      codigoInterno,
      referencia: codigoExterno || codigoInterno,
      codigoExterno,
      nombre: datos.nombre,
      descripcion: datos.descripcion || "",
      categoriaId: datos.categoriaId,
      subcategoriaId: datos.subcategoriaId || null,
      unidadMedidaId: datos.unidadMedidaId,
      stockMinimo: datos.stockMinimo || 0,
      stockMaximo: datos.stockMaximo || 0,
      imagen: datos.imagen || "",
      trazabilidad: [
        crearTrazabilidad(usuarioId, "creacion", "Producto creado"),
      ],
    });

    logAccionUsuario(usuarioId, "CREAR_PRODUCTO", {
      productoCreado: producto._id,
    });
    return producto;
  }

  async obtenerProductos(filtros = {}, incluirInactivos = false) {
    return await ProductoRepository.findAll(
      incluirInactivos ? { ...filtros } : { ...filtros, activo: true },
    );
  }

  async obtenerProductosPaginado(pagina, limite, filtros = {}) {
    const escaparRegex = (texto = "") =>
      String(texto).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const filtroConsulta = {};

    if (!filtros.incluirInactivos) {
      filtroConsulta.activo = true;
    }
    if (filtros.nombre) {
      filtroConsulta.nombre = { $regex: escaparRegex(filtros.nombre), $options: "i" };
    }
    if (filtros.codigoInterno) {
      filtroConsulta.codigoInterno = { $regex: escaparRegex(filtros.codigoInterno), $options: "i" };
    }
    if (filtros.codigoExterno) {
      filtroConsulta.codigoExterno = { $regex: escaparRegex(filtros.codigoExterno), $options: "i" };
    }
    if (filtros.categoriaId) {
      filtroConsulta.categoriaId = filtros.categoriaId;
    }
    if (filtros.subcategoriaId) {
      filtroConsulta.subcategoriaId = filtros.subcategoriaId;
    }
    if (filtros.sedeId) {
      const productoIds = await StockRepository.findProductoIdsBySedeId(filtros.sedeId);
      filtroConsulta._id = { $in: productoIds };
    }

    return await ProductoRepository.findPaginado(
      filtroConsulta,
      pagina,
      limite,
    );
  }

  async buscarPorCodigo(codigo) {
    return ProductoRepository.findByCodigo(codigo);
  }

  async obtenerProductoPorId(id) {
    const producto = await ProductoRepository.findById(id);
    if (!producto || !producto.activo)
      throw new ErrorApi(404, "Producto no encontrado");
    return producto;
  }

  async actualizarProducto(id, datos, usuarioId) {
    const producto = await ProductoRepository.findById(id);
    if (!producto || !producto.activo)
      throw new ErrorApi(404, "Producto no encontrado");

    if (Object.prototype.hasOwnProperty.call(datos, "codigoExterno")) {
      const codigoExterno = String(datos.codigoExterno || "").trim();
      datos.codigoExterno = codigoExterno;
      datos.referencia = codigoExterno || producto.codigoInterno;
    }

    delete datos.activo;
    delete datos.codigoInterno; // No permitir cambiar código interno

    const actualizado = await ProductoRepository.updateById(id, {
      $set: datos,
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "actualizacion",
          "Producto actualizado",
        ),
      },
    });
    logAccionUsuario(usuarioId, "ACTUALIZAR_PRODUCTO", {
      productoActualizado: id,
    });
    return actualizado;
  }

  async eliminarProducto(id, usuarioId) {
    const producto = await ProductoRepository.findById(id);
    if (!producto || !producto.activo)
      throw new ErrorApi(404, "Producto no encontrado");

    await ProductoRepository.updateById(id, {
      $set: { activo: false },
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "eliminacion",
          "Producto desactivado",
        ),
      },
    });
    logAccionUsuario(usuarioId, "ELIMINAR_PRODUCTO", { productoEliminado: id });
  }

  async actualizarEstadoProducto(id, activo, usuarioId) {
    const producto = await ProductoRepository.findById(id);
    if (!producto) throw new ErrorApi(404, "Producto no encontrado");

    const nuevoEstado = Boolean(activo);
    if (Boolean(producto.activo) === nuevoEstado) {
      return producto;
    }

    const actualizado = await ProductoRepository.updateById(id, {
      $set: { activo: nuevoEstado },
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "actualizacion",
          nuevoEstado ? "Producto reactivado" : "Producto desactivado",
        ),
      },
    });

    logAccionUsuario(
      usuarioId,
      nuevoEstado ? "REACTIVAR_PRODUCTO" : "DESACTIVAR_PRODUCTO",
      { productoActualizado: id, activo: nuevoEstado },
    );

    return actualizado;
  }

  async eliminarProductoFisico(id, usuarioId) {
    const producto = await ProductoRepository.findById(id);
    if (!producto) throw new ErrorApi(404, "Producto no encontrado");

    await ProductoRepository.deleteById(id);
    logAccionUsuario(usuarioId, "ELIMINAR_PRODUCTO_FISICO", {
      productoEliminado: id,
    });
  }
}

export default new ProductoService();
