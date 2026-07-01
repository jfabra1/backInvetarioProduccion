import ProductoService from "../services/ProductoService.js";
import RespuestaApi from "../utils/RespuestaApi.js";

class ProductoController {
  resolverBoolean(valor, porDefecto = false) {
    if (valor === undefined || valor === null) return porDefecto;
    if (typeof valor === "boolean") return valor;
    if (typeof valor === "string") return valor.toLowerCase() === "true";
    return porDefecto;
  }

  async crear(request, reply) {
    const producto = await ProductoService.crearProducto(
      request.body,
      request.usuarioId,
    );
    return RespuestaApi.exito(reply, "Producto creado", { producto }, 201);
  }

  async listar(request, reply) {
    const incluirInactivos = this.resolverBoolean(
      request.query?.incluirInactivos,
      false,
    );
    const productos = await ProductoService.obtenerProductos({}, incluirInactivos);
    return RespuestaApi.exito(reply, "Productos obtenidos", { productos });
  }

  async listarPaginado(request, reply) {
    const {
      pagina = 1,
      limite = 20,
      nombre,
      categoriaId,
      subcategoriaId,
      codigoInterno,
      codigoExterno,
      busqueda,
      sedeId,
      incluirInactivos,
    } = request.query;
    const filtros = {};
    if (nombre) filtros.nombre = nombre;
    if (categoriaId) filtros.categoriaId = categoriaId;
    if (subcategoriaId) filtros.subcategoriaId = subcategoriaId;
    if (codigoInterno) filtros.codigoInterno = codigoInterno;
    if (codigoExterno) filtros.codigoExterno = codigoExterno;
    if (busqueda) filtros.busqueda = busqueda;
    if (sedeId) filtros.sedeId = sedeId;
    filtros.incluirInactivos = this.resolverBoolean(incluirInactivos, false);

    const resultado = await ProductoService.obtenerProductosPaginado(
      Number(pagina),
      Number(limite),
      filtros,
    );
    return RespuestaApi.exito(reply, "Productos obtenidos", {
      productos: resultado.documentos || [],
      paginacion: resultado.paginacion,
    });
  }

  async buscarPorCodigo(request, reply) {
    const { codigo } = request.query;
    if (!codigo) return RespuestaApi.error(reply, "Falta el parámetro codigo", 400);
    const producto = await ProductoService.buscarPorCodigo(codigo);
    if (!producto) return RespuestaApi.error(reply, "Producto no encontrado", 404);
    return RespuestaApi.exito(reply, "Producto encontrado", { producto });
  }

  async obtenerPorId(request, reply) {
    const producto = await ProductoService.obtenerProductoPorId(
      request.params.id,
    );
    return RespuestaApi.exito(reply, "Producto obtenido", { producto });
  }

  async asignarUbicacion(request, reply) {
    const producto = await ProductoService.asignarUbicacion(
      request.params.id,
      request.body,
      request.usuarioId,
    );
    return RespuestaApi.exito(reply, "Ubicación asignada", { producto });
  }

  async actualizar(request, reply) {
    const producto = await ProductoService.actualizarProducto(
      request.params.id,
      request.body,
      request.usuarioId,
    );
    return RespuestaApi.exito(reply, "Producto actualizado", { producto });
  }

  async eliminar(request, reply) {
    await ProductoService.eliminarProducto(
      request.params.id,
      request.usuarioId,
    );
    return RespuestaApi.exito(reply, "Producto eliminado");
  }

  async actualizarEstado(request, reply) {
    const producto = await ProductoService.actualizarEstadoProducto(
      request.params.id,
      request.body?.activo,
      request.usuarioId,
    );
    return RespuestaApi.exito(reply, "Estado de producto actualizado", {
      producto,
    });
  }

  async eliminarFisico(request, reply) {
    await ProductoService.eliminarProductoFisico(
      request.params.id,
      request.usuarioId,
    );
    return RespuestaApi.exito(reply, "Producto eliminado permanentemente");
  }
}

export default new ProductoController();
