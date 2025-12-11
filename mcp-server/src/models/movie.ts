import mongoose, { Schema, Document } from "mongoose";

export interface IMovie extends Document {
  title_th: string;
  title_en: string;
  poster_url: string;
  genre: string;
  duration_min: number;
  start_date: Date;
  due_date: Date;
  language: string;
}

const MovieSchema: Schema = new Schema(
  {
    title_th: { type: String, required: true },
    title_en: { type: String, required: true },
    poster_url: { type: String },
    genre: { type: String, required: true },
    duration_min: { type: Number, required: true },
    start_date: { type: Date, required: true },
    due_date: { type: Date, required: true },
    language: { type: String, default: "TH/EN" },
  },
  { timestamps: true }
);

export const MovieModel = mongoose.model<IMovie>("Movie", MovieSchema);