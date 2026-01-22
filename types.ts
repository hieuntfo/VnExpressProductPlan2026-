
export enum ProjectStatus {
  NOT_STARTED = 'Not Started',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
  PENDING = 'Pending',
  RE_OPEN = 'Re-Open',
  IOS_DONE = 'iOS Done',
  ANDROID_DONE = 'Android Done',
  CANCELLED = 'Cancelled',
  HAND_OFF = 'Hand-Off',
  PLANNING = 'Planning'
}

export enum ProjectType {
  STRATEGIC = 'Strategic',
  ANNUAL = 'Annual', // ANN
  NEW = 'New' // NEW
}

export interface Project {
  id: string;
  year: number;
  code: string;
  description: string;
  type: ProjectType;
  department: string;
  status: ProjectStatus;
  phase: string;
  quarter: number;
  techHandoff: string;
  releaseDate: string;
  pm: string;
  designer: string;
  po: string;
  kpi: string;
  dashboardUrl?: string;
  notes?: string;
}

export enum UserRole {
  MEMBER = 'Member',
  EDITOR = 'Editor',
  VIEWER = 'Viewer'
}

export interface User {
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Member {
  name: string; // From Column B "Member"
  fullName: string; // From Column C "Name"
  position: string; // From Column J "Job"
  dob: string; // From Column D "Date"
  phone: string; // From Column E "Phone"
  email: string; // From Column F "Mail"
  startDate: string; // From Column G "Startdate"
  avatar: string; // From Column I "Avatar"
}

export interface MemberWithStats extends Member {
  active: number;
  total: number;
}

export interface Document {
  id: string;
  name: string;
  description: string;
}