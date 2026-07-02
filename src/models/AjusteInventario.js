import mongoose from "mongoose";
import { trazabilidadSchema } from "../utils/trazabilidad.util.js";

const itemAjusteSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Producto",
      required: true,
    },
    cantidadAnterior: { type: Number, default: 0 },
    cantidadNueva: { type: Number, required: true, min: 0 },
    diferencia: { type: Number, default: 0 },
    motivo: { type: String, trim: true, maxlength: 200 },
  },
  { _id: true },
);


const ajusteInventarioSchema = new mongoose.Schema(
  {
    codigo: { type: String, unique: true, trim: true, uppercase: true },
    sedeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sede",
      required: true,
    },
    items: [itemAjusteSchema],
    estado: {
      type: String,
      enum: ["pendiente", "aprobado", "rechazado", "aplicado"],
      default: "pendiente",
    },
    observaciones: { type: String, trim: true, maxlength: 500 },
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    aprobadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      default: null,
    },
    fechaAprobacion: { type: Date, default: null },
    trazabilidad: {
      type: [trazabilidadSchema],
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
);

ajusteInventarioSchema.index({ sedeId: 1, estado: 1 });

const AjusteInventario = mongoose.model(
  "AjusteInventario",
  ajusteInventarioSchema,
);
export default AjusteInventario;
