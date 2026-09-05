export type ThemeMode = 'dark' | 'light';
export type Language = 'en' | 'ar';
export type ScreenId =
  | 'super_admin'
  | 'founder'
  | 'assistant'
  | 'projects'
  | 'patients'
  | 'bookings'
  | 'inventory'
  | 'accounting'
  | 'reports'
  | 'settings'
  | 'support'
  | 'catalog'
  | 'assistants';

export interface Tenant {
  id: string;
  name: string;
  nameAr: string;
  code: string;
  logo: string;
  plan: 'Basic' | 'Professional' | 'Enterprise' | 'Enterprise Plus';
  status: 'Active' | 'Expiring Soon' | 'Suspended';
  discountCode?: string;
  expiryDate: string;
  mrr: number;
  patientsCount: number;
  todayBookings: number;
  location: string;
  systemId?: string;
  subscriptionPaused: boolean;
  startDate: string;
}

export interface Subscription {
  id: string;
  tenantName: string;
  tenantNameAr: string;
  projectId: string;
  planType: string;
  discount: string;
  expiryDate: string;
  status: 'Active' | 'Expiring Soon' | 'Suspended';
  startDate: string;
  mrr: number;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: string;
  senderRoleAr: string;
  tenant: string;
  projectId: string;
  avatar: string;
  isOnline: boolean;
  statusColor: 'green' | 'yellow' | 'gray';
  timeAgo: string;
  unreadCount?: number;
  lastMessage: string;
  messages: Array<{
    id: string;
    text: string;
    sender: 'user' | 'admin';
    timestamp: string;
  }>;
}

export interface InventoryItem {
  id: string;
  nameEn: string;
  nameAr: string;
  sku: string;
  category: string;
  categoryAr: string;
  stockLevel: number;
  maxStock: number;
  minReq: number;
  unit: string;
  unitCost: number;
  costChangePercent: number;
  costChangeDirection: 'up' | 'down' | 'neutral';
  autoDeduct: boolean;
  status: 'critical' | 'low' | 'normal';
  location: string;
  supplier: string;
  history?: Array<{ month: string; price: number; unitsUsed: number }>;
}

export interface AutoDeductLog {
  id: string;
  itemName: string;
  itemNameAr: string;
  units: number;
  bookingId: string;
  timeAgo: string;
  status: 'success' | 'failed';
  reason?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientNameAr?: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  date: string;
  dueDate: string;
  items: InvoiceItem[];
}

export interface Patient {
  id: string;
  nameEn: string;
  nameAr: string;
  age: number;
  gender: 'Male' | 'Female';
  phone: string;
  email: string;
  bloodType: string;
  nationalId: string;
  lastVisit: string;
  nextAppointment?: string;
  doctor: string;
  condition: string;
  status: 'Active' | 'Admitted' | 'Discharged';
}

export interface Booking {
  id: string;
  bookingNumber: string;
  patientName: string;
  patientNameAr: string;
  doctorName: string;
  doctorNameAr: string;
  department: string;
  departmentAr: string;
  time: string;
  date: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  type: 'General Checkup' | 'Surgery Follow-up' | 'Dental' | 'Radiology' | 'Consultation';
}

export interface Project {
  id: string;
  title: string;
  titleAr: string;
  tenantName: string;
  progress: number;
  status: 'In Progress' | 'Completed' | 'Planning';
  budget: number;
  spent: number;
  targetDate: string;
  manager: string;
}

export interface SystemTemplateFeature {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
}

export interface SystemTemplate {
  id: string;
  key: string;
  name: string;
  nameAr: string;
  icon: string;
  brief: string;
  briefAr: string;
  subscriptionPrice: number;
  subscriptionPeriod: string;
  isActive: boolean;
  features: SystemTemplateFeature[];
}

export interface AssistantAccount {
  id: string;
  username: string;
  fullName: string;
  createdAt: string;
}
