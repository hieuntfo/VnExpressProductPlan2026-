
import { GoogleGenAI } from "@google/genai";
import { Project } from "../types";

export const analyzeProjects = async (projects: Project[], query: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const projectSummary = projects.map(p => 
    `- ${p.description} (Mã: ${p.code}): Trạng thái ${p.status}, PM: ${p.pm}, Designer: ${p.designer}, Release: ${p.releaseDate}`
  ).join('\n');

  const systemPrompt = `
    Bạn là Trợ lý AI chuyên nghiệp của Trưởng phòng Sản phẩm & Công nghệ VnExpress.
    Dưới đây là danh sách dự án năm 2026:
    ${projectSummary}
    
    Hãy trả lời các câu hỏi về tài nguyên, tiến độ, hoặc phân tích rủi ro dựa trên dữ liệu này.
    Nếu có sự chồng chéo nhân sự (ví dụ một người làm quá nhiều dự án cùng lúc), hãy cảnh báo.
    Hãy trả lời bằng tiếng Việt, súc tích, chuyên nghiệp.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });
    return response.text || "Xin lỗi, tôi không thể xử lý yêu cầu lúc này.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.";
  }
};
