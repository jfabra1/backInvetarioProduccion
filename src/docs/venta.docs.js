const itemVentaSchema = {
  type: "object",
  required: ["productoId", "cantidad"],
  properties: {
    productoId: { type: "string" },
    cantidad:   { type: "number", minimum: 1 },
  },
};

export const schemaCrearVenta = {
  summary: "Registrar venta",
  description: "Registrar una venta POS y descontar del inventario",
  tags: ["Ventas"],
  security: [{ bearerAuth: [] }],
  body: {
    type: "object",
    required: ["sedeId", "items"],
    properties: {
      sedeId:        { type: "string" },
      clienteId:     { type: "string" },
      items:         { type: "array", items: itemVentaSchema, minItems: 1 },
      observaciones: { type: "string", maxLength: 500 },
    },
    additionalProperties: false,
  },
  response: {
    201: { description: "Venta registrada exitosamente" },
    400: { description: "Datos inválidos o stock insuficiente" },
  },
};

export const schemaListarVentasPaginado = {
  summary: "Listar ventas paginado",
  description: "Historial de ventas con filtros y paginación",
  tags: ["Ventas"],
  security: [{ bearerAuth: [] }],
  querystring: {
    type: "object",
    properties: {
      pagina:     { type: "integer", minimum: 1, default: 1 },
      limite:     { type: "integer", minimum: 1, maximum: 100, default: 20 },
      sedeId:     { type: "string" },
      estado:     { type: "string", enum: ["aplicada", "anulada"] },
      clienteId:  { type: "string" },
      vendedorId: { type: "string" },
      fechaDesde: { type: "string", format: "date" },
      fechaHasta: { type: "string", format: "date" },
    },
  },
  response: {
    200: {
      description: "Ventas obtenidas",
      type: "object",
      properties: {
        statusCode: { type: "integer" },
        status:     { type: "string" },
        message:    { type: "string" },
        data: {
          type: "object",
          properties: {
            ventas: {
              type: "array",
              items: { type: "object", additionalProperties: true },
            },
            paginacion: {
              type: "object",
              properties: {
                pagina:           { type: "integer" },
                limite:           { type: "integer" },
                total:            { type: "integer" },
                totalPaginas:     { type: "integer" },
                hayPaginaSiguiente: { type: "boolean" },
                hayPaginaAnterior:  { type: "boolean" },
              },
            },
          },
        },
      },
    },
  },
};

export const schemaObtenerVenta = {
  summary: "Obtener venta",
  description: "Obtener detalle de una venta por ID",
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

export const schemaAnularVenta = {
  summary: "Anular venta",
  description: "Anular una venta y devolver el stock al inventario",
  tags: ["Ventas"],
  security: [{ bearerAuth: [] }],
  params: {
    type: "object",
    properties: { id: { type: "string" } },
    required: ["id"],
  },
  response: {
    200: { description: "Venta anulada y stock restaurado" },
    404: { description: "Venta no encontrada" },
  },
};

export const ventaTags = [{ name: "Ventas", description: "Módulo de ventas POS" }];
