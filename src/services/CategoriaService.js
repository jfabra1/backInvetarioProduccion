import CategoriaRepository from "../repositories/CategoriaRepository.js";
import ErrorApi from "../utils/ErrorApi.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";

class CategoriaService {
  // ─── Categorías ──────────────────────────────────────────
  async crearCategoria(datos, usuarioId) {
    const existente = await CategoriaRepository.findByNombre(datos.nombre);
    if (existente)
      throw new ErrorApi(400, "Ya existe una categoría con ese nombre");

    const categoria = await CategoriaRepository.create({
      nombre: datos.nombre,
      descripcion: datos.descripcion || "",
      subcategorias: [],
      trazabilidad: [
        crearTrazabilidad(usuarioId, "creacion", "Categoría creada"),
      ],
    });

    logAccionUsuario(usuarioId, "CREAR_CATEGORIA", {
      categoriaCreada: categoria._id,
    });
    return categoria;
  }

  async obtenerCategorias() {
    return await CategoriaRepository.findAllActivas();
  }

  async obtenerCategoriasPaginado(pagina, limite, filtros = {}) {
    const escaparRegex = (texto = "") =>
      String(texto).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const filtroConsulta = { activo: true };

    if (filtros.nombre) {
      filtroConsulta.nombre = { $regex: filtros.nombre, $options: "i" };
    }
    if (filtros.descripcion) {
      filtroConsulta.descripcion = {
        $regex: filtros.descripcion,
        $options: "i",
      };
    }
    if (filtros.busqueda) {
      const regexBusqueda = escaparRegex(filtros.busqueda);
      // En la pantalla de categorías cada fila es una subcategoría (el padre
      // solo guarda el código, ej. "0012"): la búsqueda también debe mirar
      // sus nombres, o nunca encontraba lo que el usuario ve en la tabla.
      filtroConsulta.$or = [
        { nombre: { $regex: regexBusqueda, $options: "i" } },
        { descripcion: { $regex: regexBusqueda, $options: "i" } },
        { "subcategorias.nombre": { $regex: regexBusqueda, $options: "i" } },
        { "subcategorias.descripcion": { $regex: regexBusqueda, $options: "i" } },
      ];
    }
    if (filtros.subcategoriaNombre) {
      const regexSubcategoria = {
        $regex: `^${escaparRegex(filtros.subcategoriaNombre)}$`,
        $options: "i",
      };
      filtroConsulta.subcategorias = {
        $elemMatch: {
          $or: [{ nombre: regexSubcategoria }, { descripcion: regexSubcategoria }],
          activo: true,
        },
      };
    }

    return await CategoriaRepository.findPaginado(
      filtroConsulta,
      pagina,
      limite,
      { nombre: 1 },
    );
  }

  async obtenerCategoriaPorId(id) {
    const cat = await CategoriaRepository.findById(id);
    if (!cat || !cat.activo) throw new ErrorApi(404, "Categoría no encontrada");
    return cat;
  }

  async actualizarCategoria(id, datos, usuarioId) {
    const cat = await CategoriaRepository.findById(id);
    if (!cat || !cat.activo) throw new ErrorApi(404, "Categoría no encontrada");

    if (datos.nombre && datos.nombre !== cat.nombre) {
      const existente = await CategoriaRepository.findByNombre(datos.nombre);
      if (existente)
        throw new ErrorApi(400, "Ya existe una categoría con ese nombre");
    }

    delete datos.activo;
    delete datos.subcategorias; // subcategorías se gestionan aparte

    const actualizada = await CategoriaRepository.updateById(id, {
      $set: datos,
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "actualizacion",
          "Categoría actualizada",
        ),
      },
    });
    logAccionUsuario(usuarioId, "ACTUALIZAR_CATEGORIA", {
      categoriaActualizada: id,
    });
    return actualizada;
  }

  async eliminarCategoria(id, usuarioId) {
    const cat = await CategoriaRepository.findById(id);
    if (!cat || !cat.activo) throw new ErrorApi(404, "Categoría no encontrada");

    await CategoriaRepository.updateById(id, {
      $set: { activo: false },
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "eliminacion",
          "Categoría desactivada",
        ),
      },
    });
    logAccionUsuario(usuarioId, "ELIMINAR_CATEGORIA", {
      categoriaEliminada: id,
    });
  }

  // ─── Subcategorías ──────────────────────────────────────
  async agregarSubcategoria(categoriaId, datos, usuarioId) {
    const cat = await CategoriaRepository.findById(categoriaId);
    if (!cat || !cat.activo) throw new ErrorApi(404, "Categoría no encontrada");

    const duplicada = cat.subcategorias.find(
      (s) => s.nombre.toLowerCase() === datos.nombre.toLowerCase() && s.activo,
    );
    if (duplicada)
      throw new ErrorApi(400, "Ya existe una subcategoría con ese nombre");

    cat.subcategorias.push({
      nombre: datos.nombre,
      descripcion: datos.descripcion || "",
    });
    cat.trazabilidad.push(
      crearTrazabilidad(
        usuarioId,
        "actualizacion",
        `Subcategoría '${datos.nombre}' agregada`,
      ),
    );
    await cat.save();

    logAccionUsuario(usuarioId, "CREAR_SUBCATEGORIA", { categoriaId });
    return cat;
  }

  async actualizarSubcategoria(categoriaId, subcategoriaId, datos, usuarioId) {
    const cat = await CategoriaRepository.findById(categoriaId);
    if (!cat || !cat.activo) throw new ErrorApi(404, "Categoría no encontrada");

    const sub = cat.subcategorias.id(subcategoriaId);
    if (!sub || !sub.activo)
      throw new ErrorApi(404, "Subcategoría no encontrada");

    if (datos.nombre) sub.nombre = datos.nombre;
    if (datos.descripcion !== undefined) sub.descripcion = datos.descripcion;
    cat.trazabilidad.push(
      crearTrazabilidad(
        usuarioId,
        "actualizacion",
        `Subcategoría '${sub.nombre}' actualizada`,
      ),
    );
    await cat.save();

    logAccionUsuario(usuarioId, "ACTUALIZAR_SUBCATEGORIA", {
      categoriaId,
      subcategoriaId,
    });
    return cat;
  }

  async eliminarSubcategoria(categoriaId, subcategoriaId, usuarioId) {
    const cat = await CategoriaRepository.findById(categoriaId);
    if (!cat || !cat.activo) throw new ErrorApi(404, "Categoría no encontrada");

    const sub = cat.subcategorias.id(subcategoriaId);
    if (!sub || !sub.activo)
      throw new ErrorApi(404, "Subcategoría no encontrada");

    sub.activo = false;
    cat.trazabilidad.push(
      crearTrazabilidad(
        usuarioId,
        "eliminacion",
        `Subcategoría '${sub.nombre}' desactivada`,
      ),
    );
    await cat.save();

    logAccionUsuario(usuarioId, "ELIMINAR_SUBCATEGORIA", {
      categoriaId,
      subcategoriaId,
    });
  }
}

export default new CategoriaService();
