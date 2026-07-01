import RackRepository from "../repositories/RackRepository.js";
import ErrorApi from "../utils/ErrorApi.js";
import { generarCodigo } from "../utils/generadorCodigo.util.js";
import { generarPosiciones } from "../utils/rackPosiciones.util.js";
import { logAccionUsuario } from "../config/logger.js";
import { crearTrazabilidad } from "../utils/trazabilidad.util.js";

const conPosiciones = (rack) => {
  if (!rack) return rack;
  const obj = rack.toObject ? rack.toObject() : rack;
  return { ...obj, posiciones: generarPosiciones(obj.filas, obj.columnas) };
};

class RackService {
  async crearRack(datos, usuarioId) {
    const existente = await RackRepository.findByNombreYSede(datos.nombre, datos.sedeId);
    if (existente) throw new ErrorApi(400, "Ya existe un rack con ese nombre en esa sede");

    const codigo = await generarCodigo("RCK", RackRepository.model, "codigo");

    const rack = await RackRepository.create({
      nombre: datos.nombre,
      codigo,
      sedeId: datos.sedeId,
      filas: datos.filas,
      columnas: datos.columnas,
      trazabilidad: [crearTrazabilidad(usuarioId, "creacion", "Rack creado")],
    });

    logAccionUsuario(usuarioId, "CREAR_RACK", { rackCreado: rack._id });
    return conPosiciones(rack);
  }

  async obtenerRacks(filtros = {}) {
    const consulta = RackRepository.construirFiltros(filtros);
    const racks = await RackRepository.findAll(consulta);
    return racks.map(conPosiciones);
  }

  async obtenerRacksPaginado(pagina, limite, filtros = {}) {
    const consulta = RackRepository.construirFiltros(filtros);
    const resultado = await RackRepository.findPaginado(consulta, pagina, limite, { nombre: 1 });
    return {
      ...resultado,
      documentos: resultado.documentos.map(conPosiciones),
    };
  }

  async obtenerRackPorId(id) {
    const rack = await RackRepository.findByIdConSede(id);
    if (!rack || !rack.activo) throw new ErrorApi(404, "Rack no encontrado");
    return conPosiciones(rack);
  }

  async actualizarRack(id, datos, usuarioId) {
    const rack = await RackRepository.findById(id);
    if (!rack || !rack.activo) throw new ErrorApi(404, "Rack no encontrado");

    if (datos.nombre && datos.nombre !== rack.nombre) {
      const existente = await RackRepository.findByNombreYSede(
        datos.nombre,
        datos.sedeId || rack.sedeId,
      );
      if (existente) throw new ErrorApi(400, "Ya existe un rack con ese nombre en esa sede");
    }

    delete datos.activo;
    delete datos.codigo;

    const actualizado = await RackRepository.updateById(id, {
      $set: datos,
      $push: {
        trazabilidad: crearTrazabilidad(usuarioId, "actualizacion", "Rack actualizado"),
      },
    });
    logAccionUsuario(usuarioId, "ACTUALIZAR_RACK", { rackActualizado: id });
    return conPosiciones(actualizado);
  }

  async eliminarRack(id, usuarioId) {
    const rack = await RackRepository.findById(id);
    if (!rack || !rack.activo) throw new ErrorApi(404, "Rack no encontrado");

    await RackRepository.updateById(id, {
      $set: { activo: false },
      $push: {
        trazabilidad: crearTrazabilidad(usuarioId, "eliminacion", "Rack desactivado"),
      },
    });
    logAccionUsuario(usuarioId, "ELIMINAR_RACK", { rackEliminado: id });
  }

  async actualizarEstadoRack(id, activo, usuarioId) {
    const rack = await RackRepository.findById(id);
    if (!rack) throw new ErrorApi(404, "Rack no encontrado");

    const nuevoEstado = Boolean(activo);
    if (Boolean(rack.activo) === nuevoEstado) return conPosiciones(rack);

    const actualizado = await RackRepository.updateById(id, {
      $set: { activo: nuevoEstado },
      $push: {
        trazabilidad: crearTrazabilidad(
          usuarioId,
          "actualizacion",
          nuevoEstado ? "Rack reactivado" : "Rack desactivado",
        ),
      },
    });

    logAccionUsuario(usuarioId, nuevoEstado ? "REACTIVAR_RACK" : "DESACTIVAR_RACK", {
      rackActualizado: id,
      activo: nuevoEstado,
    });

    return conPosiciones(actualizado);
  }
}

export default new RackService();
