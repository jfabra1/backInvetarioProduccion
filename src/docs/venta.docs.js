const itemVentaSchema = {
  type: "object",
  required: ["productoId", "cantidad"],
  properties: {
    productoId: { type: "string" },
    cantidad: { type: "number", minimum: 1 },
  },
};

const schemaCrearVenta = {
  summary: "Registrar venta",
  description:
    "Registra una venta: descuenta stock y genera un movimiento de salida con concepto 'venta'",
  tags: ["Ventas"],
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["sedeId", "items"],
    properties: {
      sedeId: { type: "string" },
      clienteId: { type: "string" },
      items: { type: "array", items: itemVentaSchema, minItems: 1 },
      observaciones: { type: "string", maxLength: 500 },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Venta registrada exitosamente" },
    400: { description: "Datos inválidos" },
  },
};

const schemaListarVentasPaginado = {
  summary: "Listar ventas paginado",
  description: "Listar historial de ventas con filtros y paginación",
  tags: ["Ventas"],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: "object",
    properties: {
      pagina: { type: "integer", minimum: 1, default: 1 },
      limite: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      sedeId: { type: "string" },
      estado: { type: "string" },
      fechaDesde: { type: "string", format: "date" },
      fechaHasta: { type: "string", format: "date" },
    },
  },
  response: {
    200: { description: "Ventas obtenidas" },
  },
};

const schemaObtenerVenta = {
  summary: "Obtener venta",
  description: "Obtener venta por ID",
  tags: ["Ventas"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Venta obtenida" },
    404: { description: "Venta no encontrada" },
  },
};

const schemaAnularVenta = {
  summary: "Anular venta",
  description: "Anular venta y devolver stock al inventario",
  tags: ["Ventas"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Venta anulada" },
    404: { description: "Venta no encontrada" },
  },
};

const ventaTags = [
  { name: "Ventas", description: "Punto de venta e historial de ventas" },
];

export {
  schemaCrearVenta,
  schemaListarVentasPaginado,
  schemaObtenerVenta,
  schemaAnularVenta,
  ventaTags,
};
