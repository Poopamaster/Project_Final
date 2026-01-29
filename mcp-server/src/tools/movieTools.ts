// src/tools/movieTools.ts
import { z } from "zod";
import { MovieModel } from "../models/movie.js";
import { connectDB } from "../db.js";
import { formatMovieOutput } from "../utils/formatter.js";

export const movieTools = [
  {
    name: "search_movies",
    args: { keyword: z.string().describe("Search keyword for movie title") },
    handler: async ({ keyword }: { keyword: string }) => {
      await connectDB();
      const movies = await MovieModel.find({
        $or: [
          { title_th: { $regex: keyword, $options: "i" } },
          { title_en: { $regex: keyword, $options: "i" } }
        ]
      }).limit(5).select("title_th title_en genre duration_min start_date due_date -_id");
      
      const formattedText = formatMovieOutput(movies);
      return { 
        content: [{ type: "text", text: `[SYSTEM: DISPLAY EXACTLY]\n\n${formattedText}` }] 
      };
    }
  },
  {
    name: "find_latest_movies",
    args: { limit: z.number().describe("Number of movies").default(5) },
    handler: async ({ limit }: { limit: number }) => {
        await connectDB();
        const movies = await MovieModel.find()
            .sort({ start_date: -1 })
            .limit(limit)
            .select("title_th title_en genre duration_min start_date due_date -_id");
        const formattedText = formatMovieOutput(movies);
        return { 
            content: [{ type: "text", text: `[SYSTEM: DISPLAY EXACTLY]\n\n${formattedText}` }] 
        };
    }
  }
  // ... เพิ่ม tool อื่นๆ ที่เกี่ยวกับหนังตรงนี้
];