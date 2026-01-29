// src/utils/formatter.ts

export const formatDate = (date: Date) => {
  if (!date) return "ไม่ระบุ";
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric", month: "short", day: "numeric",
  });
};

export const formatMovieOutput = (movies: any[]) => {
  if (!movies || movies.length === 0) return "ไม่พบข้อมูลภาพยนตร์ครับ";

  const list = movies.map((m, index) => {
    return `### ${index + 1}. 🎬 ${m.title_th} (${m.title_en})
   - 🎭 แนว: ${m.genre} | ⏳ ${m.duration_min || 0} นาที
   - 📅 ฉาย: ${formatDate(m.start_date)} - ${formatDate(m.due_date)}`;
  }).join("\n\n");

  return `${list}\n\n-------------------------------------\n💡 พิมพ์หมายเลขหนังที่ต้องการจองได้เลยครับ (เช่น พิมพ์ 1)`;
};