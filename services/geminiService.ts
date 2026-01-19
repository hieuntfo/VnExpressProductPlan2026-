
import { GoogleGenAI } from "@google/genai";
import { Project } from "../types";

export const analyzeProjects = async (projects: Project[], query: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const projectSummary = projects.map(p => 
    `- ${p.description} (Mã: ${p.code}): Trạng thái ${p.status}, PM: ${p.pm}, Designer: ${p.designer}, Release: ${p.releaseDate}, KPI: ${p.kpi || 'Chưa có'}`
  ).join('\n');

  const systemPrompt = `
    Bạn là Trợ lý AI chuyên nghiệp của Trưởng phòng Sản phẩm & Công nghệ VnExpress.
    Dữ liệu dưới đây được lấy trực tiếp từ hệ thống Google Sheets theo thời gian thực (Live Data):
    
    ${projectSummary}
    
    Nhiệm vụ của bạn:
    1. Trả lời chính xác dựa trên danh sách trên. Nếu dự án không có trong danh sách, hãy nói rõ là chưa tìm thấy trong dữ liệu hiện tại.
    2. Phân tích rủi ro về tiến độ hoặc quá tải nhân sự (ví dụ: một PM/Designer ôm quá nhiều việc trong cùng một quý).
    3. Đưa ra gợi ý ngắn gọn, súc tích, phong cách quản lý cấp cao (Executive Summary).
    4. Trả lời bằng tiếng Việt chuyên ngành Product Management.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: query,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
      },
    });
    return response.text || "Xin lỗi, tôi không thể xử lý yêu cầu lúc này.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại sau.";
  }
};
