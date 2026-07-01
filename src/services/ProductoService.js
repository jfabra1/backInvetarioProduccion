import ProductoRepository from "../repositories/ProductoRepository.js";
import RackRepository from "../repositories/RackRepository.js";
import UnidadMedidaRepository from "../repositories/UnidadMedidaRepository.js";
import StockRepository from "../repositories/StockRepository.js";
import ErrorApi from "../utils/ErrorApi.js";
import { generarCodigo } from "../utils/generadorCodigo.util.js";
import { esPosicionValida } from "../utils/rackPosiciones.util.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";

// Cachea unidades de medida por código dentro de una sola normalización
// (una petición de crear/actualizar producto suele repetir pocos códigos).
const resolverUnidadId = async (codigo, cache) => {
  if (!codigo) return null;
  if (cache.has(codigo)) return cache.get(codigo);
  const unidad = await UnidadMedidaRepository.findByCodigo(codigo);
  const id = unidad?._id || null;
  cache.set(codigo, id);
  return id;
};

class ProductoService {
  async normalizarPresentaciones(presentaciones) {
    if (!Array.isArray(presentaciones) || presentaciones.length === 0) {
      return [];
    }

    const cache = new Map();
    const resultado = [];

    for (const p of presentaciones) {
      const unidadMedidaId = await resolverUnidadId(p.unidadMedida, cache);
      if (!unidadMedidaId) {
        throw new ErrorApi(
          400,
          `Unidad de medida "${p.unidadMedida}" no reconocida`,
        );
      }
      const unidadContenidoId = await resolverUnidadId(p.unidadContenido, cache);

      resultado.push({
        tipo: p.tipo || "unidad",
        unidadMedidaId,
        cantidadPorUnidad: Number(p.cantidadPorUnidad || 0),
        unidadContenidoId,
        cantidadInterna: Number(p.cantidadInterna || 0),
        metrosLineales: Number(p.metrosLineales || 0),
        largoCm: Number(p.largoCm || 0),
        anchoCm: Number(p.anchoCm || 0),
        altoCm: Number(p.altoCm || 0),
        espesorMm: Number(p.espesorMm || 0),
        pesoKg: Number(p.pesoKg || 0),
        descripcion: p.descripcion || "",
      });
    }

    return resultado;
  }

  async crearProducto(datos, usuarioId) {
    const codigoInterno = await generarCodigo(
      "PRD",
      ProductoRepository.model,
      "codigoInterno",
    );
    const codigoExterno = String(datos.codigoExterno || "").trim();

    const presentaciones = await this.normalizarPresentaciones(
      datos.presentaciones,
    );
    const unidadMedidaId = presentaciones[0]?.unidadMedidaId || datos.unidadMedidaId;
    if (!unidadMedidaId) {
      throw new ErrorApi(400, "Debe indicar la unidad de medida del producto");
    }

    const producto = await ProductoRepository.create({
      codigoInterno,
      referencia: codigoExterno || codigoInterno,
      codigoExterno,
      nombre: datos.nombre,
      descripcion: datos.descripcion || "",
      categoriaId: datos.categoriaId || null,
      subcategoriaId: datos.subcategoriaId || null,
      unidadMedidaId,
      presentaciones,
      valorUnitario: datos.valorUnitario || 0,
      stockMinimo: datos.stockMinimo || 0,
      stockMaximo: datos.stockMaximo || 0,
      imagen: datos.imagen || "",
      trazabilidad: [
        crearTrazabilidad(usuarioId, "creacion", "Producto creado"),
      ],
    });

    // Se registra el stock (aunque sea 0) para que el producto aparezca
    // al filtrar por esa sede; solo la cantidad inicial es opcional.
    if (datos.sedeId) {
      await StockRepository.incrementarStock(
        producto._id,
        datos.sedeId,
        Number(datos.stockInicial) || 0,
      );
    }

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
    const filtroConsulta = { ...filtros };
    if (!filtros.incluirInactivos) {
      filtroConsulta.activo = true;
    }
    delete filtroConsulta.incluirInactivos;

    // Los productos no tienen sede propia: filtrar por sede significa
    // "productos con stock registrado en esa sede" (aunque sea 0).
    const sedeId = filtroConsulta.sedeId;
    delete filtroConsulta.sedeId;

    const consulta = ProductoRepository.construirFiltros(filtroConsulta);

    if (sedeId) {
      const idsConStock = await StockRepository.obtenerProductoIdsPorSede(sedeId);
      consulta._id = { $in: idsConStock };
    }

    return await ProductoRepository.findPaginadoConUnidades(consulta, pagina, limite);
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

  async asignarUbicacion(id, { rackId, posicion }, usuarioId) {
    const producto = await ProductoRepository.findById(id);
    if (!producto || !producto.activo)
      throw new ErrorApi(404, "Producto no encontrado");

    // Quitar ubicación: rackId vacío limpia el campo
    if (!rackId) {
      const actualizado = await ProductoRepository.updateById(id, {
        $set: { ubicacion: { rackId: null, posicion: "" } },
        $push: {
          trazabilidad: crearTrazabilidad(usuarioId, "actualizacion", "Ubicación de rack removida"),
        },
      });
      logAccionUsuario(usuarioId, "QUITAR_UBICACION_PRODUCTO", { productoId: id });
      return actualizado;
    }

    const rack = await RackRepository.findById(rackId);
    if (!rack || !rack.activo) throw new ErrorApi(404, "Rack no encontrado");

    if (!esPosicionValida(posicion, rack.filas, rack.columnas)) {
      throw new ErrorApi(
        400,
        `Posición "${posicion}" inválida para un rack de ${rack.filas} filas x ${rack.columnas} columnas`,
      );
    }

    const posicionNormalizada = String(posicion).toUpperCase().trim();

    const actualizado = await ProductoRepository.updateById(id, {
      $set: { ubicacion: { rackId, posicion: posicionNormalizada } },
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "actualizacion",
          `Ubicación asignada: ${rack.nombre} ${posicionNormalizada}`,
        ),
      },
    });

    logAccionUsuario(usuarioId, "ASIGNAR_UBICACION_PRODUCTO", {
      productoId: id,
      rackId,
      posicion: posicionNormalizada,
    });
    return actualizado;
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

    if (Object.prototype.hasOwnProperty.call(datos, "presentaciones")) {
      const presentaciones = await this.normalizarPresentaciones(
        datos.presentaciones,
      );
      datos.presentaciones = presentaciones;
      if (presentaciones[0]?.unidadMedidaId) {
        datos.unidadMedidaId = presentaciones[0].unidadMedidaId;
      }
    }

    delete datos.activo;
    delete datos.codigoInterno; // No permitir cambiar código interno
    delete datos.sedeId; // Solo aplica al crear (stock inicial)
    delete datos.stockInicial;

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
