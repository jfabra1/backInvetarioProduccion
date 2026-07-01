import mongoose from "mongoose";
import { trazabilidadSchema } from "../utils/trazabilidad.util.js";

const rackSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    codigo: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
    },
    sedeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sede",
      required: true,
    },
    filas: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    columnas: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    activo: {
      type: Boolean,
      default: true,
    },
    trazabilidad: {
      type: [trazabilidadSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

rackSchema.index({ sedeId: 1, nombre: 1 });

const Rack = mongoose.model("Rack", rackSchema);
export default Rack;
