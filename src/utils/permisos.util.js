/**
 * Acciones disponibles para permisos.
 * Cada permiso vincula un módulo con una acción.
 */
export const ACCIONES = Object.freeze({
  VER: "ver",
  CREAR: "crear",
  ACTUALIZAR: "actualizar",
  ESTADO: "estado",
  ELIMINAR: "eliminar",
});

/**
 * Módulos del sistema sobre los cuales se aplican permisos.
 */
export const MODULOS = Object.freeze({
  USUARIOS: "usuarios",
  ROLES: "roles",
  SEDES: "sedes",
  CATEGORIAS: "categorias",
  PRODUCTOS: "productos",
  TERCEROS: "terceros",
  ORDENES_COMPRA: "ordenes_compra",
  ENTRADAS: "entradas",
  SALIDAS: "salidas",
  TRASLADOS: "traslados",
  AJUSTES_INVENTARIO: "ajustes_inventario",
  ORDENES_DESPACHO: "ordenes_despacho",
  INVENTARIO: "inventario",
  VENTAS: "ventas",
});

export const ACCIONES_POR_MODULO = Object.freeze({
  [MODULOS.USUARIOS]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
    ACCIONES.ACTUALIZAR,
    ACCIONES.ESTADO,
    ACCIONES.ELIMINAR,
  ],
  [MODULOS.ROLES]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
    ACCIONES.ACTUALIZAR,
    ACCIONES.ELIMINAR,
  ],
  [MODULOS.SEDES]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
    ACCIONES.ACTUALIZAR,
    ACCIONES.ESTADO,
    ACCIONES.ELIMINAR,
  ],
  [MODULOS.CATEGORIAS]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
    ACCIONES.ACTUALIZAR,
    ACCIONES.ELIMINAR,
  ],
  [MODULOS.PRODUCTOS]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
    ACCIONES.ACTUALIZAR,
    ACCIONES.ESTADO,
    ACCIONES.ELIMINAR,
  ],
  [MODULOS.TERCEROS]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
    ACCIONES.ACTUALIZAR,
    ACCIONES.ESTADO,
    ACCIONES.ELIMINAR,
  ],
  [MODULOS.ORDENES_COMPRA]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
    ACCIONES.ACTUALIZAR,
    ACCIONES.ELIMINAR,
  ],
  [MODULOS.ENTRADAS]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
    ACCIONES.ACTUALIZAR,
  ],
  [MODULOS.SALIDAS]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
    ACCIONES.ACTUALIZAR,
  ],
  [MODULOS.TRASLADOS]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
    ACCIONES.ACTUALIZAR,
  ],
  [MODULOS.AJUSTES_INVENTARIO]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
  ],
  [MODULOS.ORDENES_DESPACHO]: [
    ACCIONES.VER,
    ACCIONES.CREAR,
    ACCIONES.ACTUALIZAR,
    ACCIONES.ELIMINAR,
  ],
  [MODULOS.INVENTARIO]: [ACCIONES.VER, ACCIONES.ACTUALIZAR],
  [MODULOS.VENTAS]: [ACCIONES.VER, ACCIONES.CREAR, ACCIONES.ACTUALIZAR],
});

export const obtenerAccionesPermitidasModulo = (modulo) =>
  ACCIONES_POR_MODULO[modulo] || [];

/**
 * Genera la lista completa de permisos posibles (todas las combinaciones módulo + acción).
 */
export const generarTodosLosPermisos = () => {
  const permisos = [];
  for (const modulo of Object.values(MODULOS)) {
    for (const accion of obtenerAccionesPermitidasModulo(modulo)) {
      permisos.push({ modulo, accion });
    }
  }
  return permisos;
};
