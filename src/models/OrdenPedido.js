import mongoose from "mongoose";
import { trazabilidadSchema } from "../utils/trazabilidad.util.js";

const itemOrdenPedidoSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: true,
    },
    cantidadSolicitada: { type: Number, required: true, min: 1 },
    cantidadAprobada: { type: Number, default: 0, min: 0 },
    observacion: { type: String, trim: true, maxlength: 200 },
  },
  { _id: true },
);

const ordenPedidoSchema = new mongoose.Schema(
  {
    codigo: { type: String, unique: true, trim: true, uppercase: true },
    sedeSolicitanteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sede",
      required: true,
    },
    sedeProveedoraId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sede",
      required: true,
    },
    items: [itemOrdenPedidoSchema],
    estado: {
      type: String,
      enum: ["pendiente", "aceptado", "rechazado", "anulado"],
      default: "pendiente",
    },
    observaciones: { type: String, trim: true, maxlength: 500 },
    solicitadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    revisadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      default: null,
    },
    fechaRevision: { type: Date, default: null },
    trasladoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Traslado",
      default: null,
    },
    trazabilidad: {
      type: [trazabilidadSchema],
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
);

ordenPedidoSchema.index({ sedeSolicitanteId: 1, estado: 1 });
ordenPedidoSchema.index({ sedeProveedoraId: 1, estado: 1 });

const OrdenPedido = mongoose.model("OrdenPedido", ordenPedidoSchema);
export default OrdenPedido;
