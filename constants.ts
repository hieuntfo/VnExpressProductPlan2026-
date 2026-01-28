

import { Project, ProjectStatus, ProjectType, ProjectPriority } from './types';

// URL Google Apps Script Web App để nhận dữ liệu POST từ form thêm dự án
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx_usOGCDC1Tj6FfSB6nHEAtveU7j8TYEHHqJpuyX8T3v76qsp4Pb7tD5KksA7Q9Vn6/exec"; 

// URL for the new "Member" sheet containing member data. GID changed to 2044840974 as requested.
export const MEMBERS_DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJJ2HYdVoZ45yKhXPX8kydfkXB6eHebun5TNJlcMIFTtbYncCx8Nuq1sphQE0yeB1M9w_aC_QCzB2g/pub?gid=2044840974&single=true&output=tsv";

// URL for the new "File" (Document) sheet.
export const DOCUMENTS_DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQJJ2HYdVoZ45yKhXPX8kydfkXB6eHebun5TNJlcMIFTtbYncCx8Nuq1sphQE0yeB1M9w_aC_QCzB2g/pub?gid=298135720&single=true&output=tsv";

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    year: 2026,
    code: 'TA2026',
    description: 'Tech Awards 2026',
    type: ProjectType.ANNUAL,
    department: 'Công nghệ',
    status: ProjectStatus.IN_PROGRESS,
    phase: 'Thiết kế Landing Page',
    quarter: 1,
    // FIX: Added missing 'priority' property to conform to the Project type.
    priority: ProjectPriority.HIGH,
    techHandoff: '2026-03-15',
    releaseDate: '2026-04-01',
    pm: 'HieuNT',
    designer: 'AnhTH',
    po: 'MinhLQ',
    kpi: '10M Traffic',
    dashboardUrl: 'https://bi.vnexpress.net/ta2026',
    notes: 'Ưu tiên trải nghiệm mobile.'
  }
];

export const DEPARTMENTS = [
  'Sản phẩm', 'Công nghệ', 'Xe', 'Thể thao', 'Giáo dục', 
  'Pháp luật', 'Kinh doanh', 'Đời sống', 'Du lịch', 'Số hóa'
];