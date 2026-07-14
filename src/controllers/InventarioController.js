import InventarioService from "../services/InventarioService.js";
import RespuestaApi from "../utils/RespuestaApi.js";
import ErrorApi from "../utils/ErrorApi.js";

/** Extrae el _id de sede del payload JWT (puede ser ObjectId o string). */
const resolverSedeUsuario = (request) => {
  const sede = request.usuario?.sedeId;
  if (!sede) return null;
  if (typeof sede === "object") return String(sede._id || "");
  return String(sede);
};

class InventarioController {
  async stockPorSede(request, reply) {
    const esAdmin = Boolean(request.usuario?.esAdmin);
    const sedeIdUsuario = resolverSedeUsuario(request);

    // No-admin sin sede: acceso denegado
    if (!esAdmin && !sedeIdUsuario) {
      throw new ErrorApi(403, "Tu usuario no tiene sede asignada");
    }

    // No-admin con sede: solo puede consultar su propia sede, ignora el param de URL
    const sedeId = esAdmin ? request.params.sedeId : sedeIdUsuario;

    const { productoId, productoIds } = request.query;
    const filtros = {};
    if (productoId) filtros.productoId = productoId;
    if (productoIds) filtros.productoIds = productoIds.split(",").filter(Boolean);

    const stock = await InventarioService.obtenerStockPorSede(sedeId, filtros);
    return RespuestaApi.exito(reply, "Stock por sede obtenido", { stock });
  }

  async stockGlobal(request, reply) {
    const esAdmin = Boolean(request.usuario?.esAdmin);
    const sedeIdUsuario = resolverSedeUsuario(request);

    const { productoId, productoIds } = request.query;
    const filtros = {};
    if (productoId) filtros.productoId = productoId;
    if (productoIds) filtros.productoIds = productoIds.split(",").filter(Boolean);

    // No-admin: devuelve solo su sede en lugar del stock global
    if (!esAdmin) {
      if (!sedeIdUsuario) {
        throw new ErrorApi(403, "Tu usuario no tiene sede asignada");
      }
      const stock = await InventarioService.obtenerStockPorSede(sedeIdUsuario, filtros);
      return RespuestaApi.exito(reply, "Stock por sede obtenido", { stock });
    }

    const stock = await InventarioService.obtenerStockGlobal(filtros);
    return RespuestaApi.exito(reply, "Stock global obtenido", { stock });
  }

  async stockProducto(request, reply) {
    const esAdmin = Boolean(request.usuario?.esAdmin);
    const sedeIdUsuario = resolverSedeUsuario(request);
    const productoId = request.params.productoId;

    // No-admin: solo devuelve el stock del producto en su sede
    if (!esAdmin) {
      if (!sedeIdUsuario) {
        throw new ErrorApi(403, "Tu usuario no tiene sede asignada");
      }
      const stock = await InventarioService.obtenerStockPorSede(sedeIdUsuario, { productoId });
      return RespuestaApi.exito(reply, "Stock del producto obtenido", { stock });
    }

    const stock = await InventarioService.obtenerStockProducto(productoId);
    return RespuestaApi.exito(reply, "Stock del producto obtenido", { stock });
  }
}

export default new InventarioController();
