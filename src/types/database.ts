export type UserRole =
  | 'admin'
  | 'project_manager'
  | 'superintendent'
  | 'subcontractor'
  | 'client'
  | 'safety_officer';

export type ProjectStatus =
  | 'planning'
  | 'bidding'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'archived';

export type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'done'
  | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export type RFIStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'answered'
  | 'closed';

export type PunchStatus =
  | 'open'
  | 'ready_for_inspection'
  | 'in_review'
  | 'approved'
  | 'rejected';

export type PunchSeverity = 'cosmetic' | 'minor' | 'major' | 'critical_safety';

export type ChangeOrderStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'void';

export type DocCategory =
  | 'architectural'
  | 'structural'
  | 'mep'
  | 'civil'
  | 'specifications'
  | 'permits'
  | 'contracts'
  | 'safety';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company_name?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  zip_code?: string;
  client_name: string;
  client_email?: string;
  status: ProjectStatus;
  budget: number;
  spent: number;
  start_date: string;
  target_completion_date: string;
  actual_completion_date?: string;
  cover_image_url?: string;
  created_by?: string;
  created_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: UserRole;
  user?: Profile;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string;
  assignee?: Profile;
  trade_category?: string;
  start_date?: string;
  due_date?: string;
  completed_at?: string;
  order_index: number;
  created_at: string;
}

export interface DailyLogCrew {
  id: string;
  daily_log_id: string;
  contractor_name: string;
  trade: string;
  worker_count: number;
  hours_worked: number;
}

export interface DailyLog {
  id: string;
  project_id: string;
  log_date: string;
  author_id: string;
  author?: Profile;
  weather_condition?: string;
  temp_high?: number;
  temp_low?: number;
  site_conditions?: string;
  work_performed: string;
  delays_notes?: string;
  safety_incidents?: string;
  visitors_log?: string;
  crews?: DailyLogCrew[];
  created_at: string;
}

export interface DrawingDocument {
  id: string;
  project_id: string;
  title: string;
  sheet_number?: string;
  category: DocCategory;
  version: number;
  file_url: string;
  file_size_bytes?: number;
  storage_path: string;
  description?: string;
  uploaded_by?: string;
  uploader?: Profile;
  created_at: string;
}

export interface RFI {
  id: string;
  project_id: string;
  rfi_number: number;
  subject: string;
  question: string;
  suggested_solution?: string;
  status: RFIStatus;
  impact_cost: boolean;
  impact_days: number;
  cost_estimate: number;
  assigned_to?: string;
  assignee?: Profile;
  submitted_by: string;
  submitter?: Profile;
  official_answer?: string;
  answered_by?: string;
  due_date?: string;
  created_at: string;
}

export interface PunchItem {
  id: string;
  project_id: string;
  item_number: number;
  title: string;
  description?: string;
  location: string;
  status: PunchStatus;
  severity: PunchSeverity;
  trade?: string;
  assigned_to?: string;
  assignee?: Profile;
  reported_by: string;
  reporter?: Profile;
  photo_urls: string[];
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ChangeOrder {
  id: string;
  project_id: string;
  co_number: number;
  title: string;
  description: string;
  status: ChangeOrderStatus;
  amount: number;
  schedule_impact_days: number;
  reason?: string;
  requested_by: string;
  requester?: Profile;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface BudgetLineItem {
  id: string;
  project_id: string;
  cost_code: string;
  category: string;
  description: string;
  original_budget: number;
  approved_changes: number;
  committed_costs: number;
  actual_spent: number;
}
