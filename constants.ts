
import { Project, ProjectStatus, ProjectType } from './types';

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

export const TEAM_MEMBERS = [
  'NgocDT', 'HieuNT', 'AnhTH', 'TungTD', 'TrangNT', 
  'NhuanTP', 'LinhNTN', 'NgocNV', 'BinhVH', 'VietLX', 
  'ThaoPP', 'NamNH', 'DatNH', 'SonLH', 'SonVN', 
  'TrungTD', 'MinhTB', 'DungNY'
];

// Danh sách PMS cũ để tương thích ngược nếu cần, nhưng ưu tiên TEAM_MEMBERS
export const PMS = TEAM_MEMBERS;
export const DESIGNERS = TEAM_MEMBERS;
