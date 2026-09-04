import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ScreenId,
  Language,
  ThemeMode,
  Tenant,
  Subscription,
  ChatMessage,
  InventoryItem,
  AutoDeductLog,
  Invoice,
  Patient,
  Booking,
  Project,
} from '../types';
import {
  INITIAL_AUTO_DEDUCTIONS,
  FINANCIAL_METRICS,
} from '../data/mockData';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import {
  mapTenantRow,
  tenantToSubscription,
  mapPatientRow,
  mapBookingRow,
  mapInventoryRow,
  mapInvoiceRow,
  mapProjectRow,
} from '../lib/dataMappers';

interface AppContextType {
  screen: ScreenId;
  setScreen: (screen: ScreenId) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  isRTL: boolean;

  activeTenant: Tenant | null;
  setActiveTenant: (tenant: Tenant) => void;
  tenants: Tenant[];
  addTenant: (tenant: Omit<Tenant, 'id'>) => void;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;

  subscriptions: Subscription[];
  updateSubscriptionStatus: (id: string, status: 'Active' | 'Expiring Soon' | 'Suspended') => void;
  applyDiscountCode: (id: string, code: string) => void;

  chats: ChatMessage[];
  selectedChatId: string;
  setSelectedChatId: (id: string) => void;
  sendChatMessage: (chatId: string, text: string) => void;

  announcement: { title: string; titleAr: string; message: string; messageAr: string };
  updateAnnouncement: (a: { title: string; titleAr: string; message: string; messageAr: string }) => void;
  defaultDiscount: string;
  setDefaultDiscount: (discount: string) => void;

  inventory: InventoryItem[];
  autoDeductLogs: AutoDeductLog[];
  toggleAutoDeduct: (id: string) => void;
  adjustStock: (id: string, newStock: number, reason?: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;

  invoices: Invoice[];
  financials: typeof FINANCIAL_METRICS;
  addExpense: (expense: { category: string; description: string; amount: number; date: string }) => void;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoiceStatus: (id: string, status: 'paid' | 'pending' | 'overdue') => void;

  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id'>) => void;
  updateBookingStatus: (id: string, status: 'confirmed' | 'pending' | 'cancelled') => void;

  projects: Project[];

  isCreateInvoiceOpen: boolean;
  setIsCreateInvoiceOpen: (open: boolean) => void;
  isAddPatientOpen: boolean;
  setIsAddPatientOpen: (open: boolean) => void;
  isNewBookingOpen: boolean;
  setIsNewBookingOpen: (open: boolean) => void;
  isAdjustStockOpen: boolean;
  setIsAdjustStockOpen: (open: boolean) => void;
  selectedStockItem: InventoryItem | null;
  setSelectedStockItem: (item: InventoryItem | null) => void;
  isQrScannerOpen: boolean;
  setIsQrScannerOpen: (open: boolean) => void;
  isTenantModalOpen: boolean;
  setIsTenantModalOpen: (open: boolean) => void;
  isPdfExportOpen: boolean;
  setIsPdfExportOpen: (open: boolean) => void;
  pdfExportTitle: string;
  setPdfExportTitle: (title: string) => void;
  openPdfExport: (title: string) => void;

  toastMessage: string | null;
  showToast: (msg: string) => void;

  t: (key: string) => string;
}

const DICTIONARY: Record<string, { en: string; ar: string }> = {
  'nav.super_admin': { en: 'Super Admin', ar: 'المشرف العام' },
  'nav.founder': { en: 'Founder & Clinic', ar: 'المؤسس والعيادة' },
  'nav.assistant': { en: 'Assistant Desk', ar: 'مكتب المساعد' },
  'nav.projects': { en: 'Projects', ar: 'المشاريع' },
  'nav.patients': { en: 'Patients', ar: 'المرضى' },
  'nav.bookings': { en: 'Bookings', ar: 'الحجوزات' },
  'nav.inventory': { en: 'Inventory & ERP', ar: 'المخزون ونظام ERP' },
  'nav.accounting': { en: 'Accounting', ar: 'المحاسبة والمالية' },
  'nav.reports': { en: 'Reports', ar: 'التقارير والإحصاءات' },
  'nav.settings': { en: 'Settings', ar: 'الإعدادات' },
  'nav.support': { en: 'Support', ar: 'الدعم الفني' },
  'nav.collapse': { en: 'Collapse', ar: 'طي القائمة' },
  'super_admin.title': { en: 'Super Admin Control Center', ar: 'مركز تحكم المشرف العام' },
  'super_admin.badge': { en: 'Nexus Cloud v2.4 (Enterprise)', ar: 'سحابة نيكسوس الإصدار ٢.٤ (المؤسسات)' },
  'super_admin.system_status': { en: 'System Operational: All 12 Data Centers Normal', ar: 'النظام يعمل بكفاءة: جميع مراكز البيانات الـ١٢ طبيعية' },
  'super_admin.total_mrr': { en: 'Total Monthly Revenue (MRR)', ar: 'إجمالي الإيرادات الشهرية المتكررة' },
  'super_admin.active_tenants': { en: 'Active Tenants', ar: 'المستأجرون النشطون' },
  'super_admin.active_subscriptions': { en: 'Active Subscriptions', ar: 'الاشتراكات النشطة' },
  'super_admin.critical_support': { en: 'Critical Support Cases', ar: 'حالات الدعم الحرجة' },
  'super_admin.system_announcements': { en: 'System Announcements', ar: 'الإعلانات العامة للنظام' },
  'super_admin.default_discount': { en: 'Default Discount %', ar: 'نسبة الخصم الافتراضية' },
  'super_admin.live_support': { en: 'Live Support & Projects Chat', ar: 'الدعم المباشر ومحادثات المشاريع' },
  'super_admin.subscriptions_mgmt': { en: 'Project Subscriptions & Tenants Management', ar: 'إدارة اشتراكات المشاريع والمستأجرين' },
  'super_admin.add_tenant': { en: 'Add Tenant', ar: 'إضافة مستأجر جديد' },
  'super_admin.export_csv': { en: 'Export CSV', ar: 'تصدير CSV' },
  'super_admin.search_placeholder': { en: 'Search tenant, project ID or code...', ar: 'ابحث عن مستأجر، معرف المشروع أو الرمز...' },
  'founder.title': { en: 'Founder & Clinic Overview', ar: 'نظرة عامة للمؤسس والعيادة' },
  'founder.welcome': { en: 'Welcome back', ar: 'مرحباً بعودتك' },
  'founder.subtitle': { en: 'Here is what is happening across your clinics today.', ar: 'إليك ملخص ما يحدث في عياداتك ومراكزك اليوم.' },
  'founder.add_patient': { en: 'Add Patient', ar: 'إضافة مريض' },
  'founder.new_booking': { en: 'New Booking', ar: 'حجز جديد' },
  'founder.gen_invoice': { en: 'Gen Invoice', ar: 'إنشاء فاتورة' },
  'founder.rev_mtd': { en: 'Revenue (MTD)', ar: 'الإيرادات (الشهر حتى تاريخه)' },
  'founder.today_bookings': { en: "Today's Bookings", ar: 'حجوزات اليوم' },
  'founder.monthly_patients': { en: 'Monthly Patients', ar: 'المرضى شهرياً' },
  'founder.inventory_alerts': { en: 'Inventory Alerts', ar: 'تنبيهات المخزون الحرجة' },
  'founder.financial_overview': { en: 'Financial Overview', ar: 'الملخص المالي' },
  'founder.export_pdf': { en: 'Export PDF', ar: 'تصدير PDF' },
  'inventory.title': { en: 'ERP & Medical Inventory', ar: 'إدارة المخزون الطبي ونظام ERP' },
  'inventory.subtitle': { en: 'Automated booking deductions, smart purchase history, & live stock level controls.', ar: 'الاستقطاع التلقائي للحجوزات، سجل المشتريات الذكي، ومراقبة المخزون المباشرة.' },
  'inventory.total_items': { en: 'Total Tracked Items', ar: 'إجمالي المواد المتابعة' },
  'inventory.low_stock': { en: 'Low & Critical Stock Items', ar: 'المواد منخفضة وحرجة المخزون' },
  'inventory.auto_deducted_today': { en: 'Auto-Deducted Today', ar: 'المستقطع تلقائياً اليوم' },
  'inventory.avg_cost': { en: 'Avg Unit Cost', ar: 'متوسط تكلفة الوحدة' },
  'inventory.purchase_history': { en: 'Purchase History & Price Tracking', ar: 'سجل المشتريات ومتابعة الأسعار' },
  'inventory.auto_deduct_log': { en: 'Live Auto-Deduction Activity Log', ar: 'سجل نشاط الاستقطاع التلقائي المباشر' },
  'inventory.inventory_master': { en: 'Inventory Master List', ar: 'قائمة المخزون الرئيسية' },
  'inventory.scan_qr': { en: 'Scan QR / Barcode', ar: 'مسح الباركود / QR' },
  'inventory.adjust_stock': { en: 'Adjust Stock', ar: 'تعديل المخزون' },
  'inventory.add_item': { en: 'Add Item', ar: 'إضافة مادة' },
  'accounting.title': { en: 'Financial & Accounting Overview', ar: 'الملخص المالي والمحاسبي' },
  'accounting.subtitle': { en: 'Real-time cash flow, automated tax estimation, profit & loss, and client invoices.', ar: 'التدفقات النقدية اللحظية، تقدير الضرائب الآلي، الأرباح والخسائر وفواتير العملاء.' },
  'accounting.total_income': { en: 'Total Income', ar: 'إجمالي الإيرادات' },
  'accounting.total_expenses': { en: 'Total Expenses', ar: 'إجمالي المصروفات' },
  'accounting.net_profit': { en: 'Net Profit', ar: 'صافي الأرباح' },
  'accounting.estimated_taxes': { en: 'Estimated Taxes (15% VAT)', ar: 'الضرائب التقديرية (١٥٪ ضريبة القيمة المضافة)' },
  'accounting.pnl': { en: 'Profit & Loss (P&L) Trends', ar: 'اتجاهات الأرباح والخسائر' },
  'accounting.recent_invoices': { en: 'Recent Client & Corporate Invoices', ar: 'أحدث فواتير العملاء والشركات' },
  'accounting.create_invoice': { en: 'Create Invoice', ar: 'إنشاء فاتورة جديدة' },
  'accounting.export_excel': { en: 'Export Excel', ar: 'تصدير إكسيل' },
  'common.tenant': { en: 'Tenant / Organization', ar: 'المستأجر / المؤسسة' },
  'common.project_id': { en: 'Project ID', ar: 'معرف المشروع' },
  'common.plan_type': { en: 'Plan Type', ar: 'نوع الباقة' },
  'common.discount': { en: 'Discount Code', ar: 'رمز الخصم' },
  'common.expiry_date': { en: 'Expiry Date', ar: 'تاريخ الانتهاء' },
  'common.status': { en: 'Status', ar: 'الحالة' },
  'common.actions': { en: 'Actions', ar: 'الإجراءات' },
  'common.save': { en: 'Save Changes', ar: 'حفظ التغييرات' },
  'common.cancel': { en: 'Cancel', ar: 'إلغاء' },
  'common.close': { en: 'Close', ar: 'إغلاق' },
  'common.item': { en: 'Item', ar: 'المادة / الصنف' },
  'common.sku': { en: 'SKU', ar: 'رمز الصنف (SKU)' },
  'common.category': { en: 'Category', ar: 'التصنيف' },
  'common.stock_level': { en: 'Stock Level', ar: 'مستوى المخزون' },
  'common.min_required': { en: 'Min Required', ar: 'الحد الأدنى المطلوب' },
  'common.unit_cost': { en: 'Unit Cost', ar: 'تكلفة الوحدة' },
  'common.auto_deduct': { en: 'Auto-Deduct', ar: 'استقطاع تلقائي' },
  'common.location': { en: 'Location', ar: 'الموقع' },
  'common.invoice_no': { en: 'Invoice #', ar: 'رقم الفاتورة' },
  'common.client': { en: 'Client / Company', ar: 'العميل / الشركة' },
  'common.amount': { en: 'Amount', ar: 'المبلغ' },
  'common.date': { en: 'Date', ar: 'التاريخ' },
  'common.due_date': { en: 'Due Date', ar: 'تاريخ الاستحقاق' },
  'common.patient_name': { en: 'Patient Name', ar: 'اسم المريض' },
  'common.doctor': { en: 'Attending Doctor', ar: 'الطبيب المعالج' },
  'common.department': { en: 'Department', ar: 'القسم' },
  'common.time': { en: 'Time', ar: 'الوقت' },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, activeTenantId, setActiveTenantId, tenantMemberships } = useAuth();

  const [screen, setScreen] = useState<ScreenId>('founder');
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<ThemeMode>('dark');

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null);

  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>('');

  const [announcement, setAnnouncement] = useState({
    title: 'Scheduled Maintenance',
    titleAr: 'صيانة دورية مجدولة',
    message: 'System upgrade on Oct 15, 02:00 UTC. Zero downtime expected.',
    messageAr: 'ترقية البنية السحابية في ١٥ أكتوبر، الساعة ٠٢:٠٠ ص بتوقيت UTC. دون أي انقطاع للخدمة.',
  });
  const [defaultDiscount, setDefaultDiscount] = useState<string>('15%');

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [autoDeductLogs, setAutoDeductLogs] = useState<AutoDeductLog[]>(INITIAL_AUTO_DEDUCTIONS);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<
    { id: string; category: string; description: string; amount: number; date: string }[]
  >([]);

  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<InventoryItem | null>(null);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [pdfExportTitle, setPdfExportTitle] = useState('Nexus Executive Summary');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isRTL = language === 'ar';

  useEffect(() => {
    const htmlEl = document.documentElement;
    htmlEl.lang = language;
    htmlEl.dir = isRTL ? 'rtl' : 'ltr';
    if (theme === 'dark') {
      htmlEl.classList.add('dark');
      htmlEl.classList.remove('light');
    } else {
      htmlEl.classList.add('light');
      htmlEl.classList.remove('dark');
    }
  }, [language, isRTL, theme]);

  useEffect(() => {
    if (!profile) return;
    if (profile.roleCode === 'super_admin') setScreen('super_admin');
    else if (profile.roleCode === 'assistant') setScreen('assistant');
    else setScreen('founder');
  }, [profile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((prev) => (prev === msg ? null : prev)), 3500);
  };

  const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const t = (key: string): string => {
    const entry = DICTIONARY[key];
    if (!entry) return key;
    return entry[language] || entry.en;
  };

  const refreshTenants = useCallback(async () => {
    if (!profile) return;
    let query = supabase.from('tenants').select('*');
    if (profile.roleCode !== 'super_admin') {
      const ids = tenantMemberships.map((m) => m.tenantId);
      if (ids.length === 0) {
        setTenants([]);
        return;
      }
      query = query.in('id', ids);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return;
    const mapped = data.map(mapTenantRow);
    setTenants(mapped);
    if (!activeTenantId && mapped.length > 0) {
      setActiveTenantId(mapped[0].id);
    }
  }, [profile, tenantMemberships, activeTenantId, setActiveTenantId]);

  useEffect(() => {
    refreshTenants();
  }, [refreshTenants]);

  useEffect(() => {
    const found = tenants.find((tn) => tn.id === activeTenantId);
    if (found) setActiveTenantState(found);
  }, [tenants, activeTenantId]);

  const subscriptions: Subscription[] = tenants.map(tenantToSubscription);

  const refreshPatients = useCallback(async () => {
    if (!activeTenantId) return;
    const { data } = await supabase.from('patients').select('*').eq('tenant_id', activeTenantId).order('created_at', { ascending: false });
    if (data) setPatients(data.map(mapPatientRow));
  }, [activeTenantId]);

  const refreshBookings = useCallback(async () => {
    if (!activeTenantId) return;
    const { data } = await supabase
      .from('bookings')
      .select('*, patients(full_name)')
      .eq('tenant_id', activeTenantId)
      .order('scheduled_at', { ascending: false });
    if (data) setBookings(data.map(mapBookingRow));
  }, [activeTenantId]);

  const refreshInventory = useCallback(async () => {
    if (!activeTenantId) return;
    const { data } = await supabase
      .from('inventory_items')
      .select('*, inventory_stock(quantity_on_hand), inventory_price_history(purchase_price, effective_date)')
      .eq('tenant_id', activeTenantId);
    if (data) setInventory(data.map(mapInventoryRow));
  }, [activeTenantId]);

  const refreshInvoices = useCallback(async () => {
    if (!activeTenantId) return;
    const { data } = await supabase
      .from('invoices')
      .select('*, invoice_items(*), patients(full_name)')
      .eq('tenant_id', activeTenantId)
      .order('issued_at', { ascending: false });
    if (data) setInvoices(data.map(mapInvoiceRow));
  }, [activeTenantId]);

  const refreshExpenses = useCallback(async () => {
    if (!activeTenantId) return;
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', activeTenantId)
      .order('expense_date', { ascending: false });
    if (data) {
      setExpenses(
        data.map((e: any) => ({
          id: e.id,
          category: e.category || '',
          description: e.description,
          amount: Number(e.amount),
          date: e.expense_date,
        }))
      );
    }
  }, [activeTenantId]);

  const refreshProjects = useCallback(async () => {
    if (!profile) return;
    let query = supabase.from('projects').select('*, tenants(name)');
    if (profile.roleCode !== 'super_admin') {
      if (!activeTenantId) {
        setProjects([]);
        return;
      }
      query = query.eq('tenant_id', activeTenantId);
    }
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setProjects(data.map(mapProjectRow));
  }, [profile, activeTenantId]);

  const refreshChats = useCallback(async () => {
    if (!profile || profile.roleCode !== 'super_admin') return;

    const { data: conversations } = await supabase
      .from('support_conversations')
      .select('id, tenant_id, tenants(name)')
      .order('created_at', { ascending: false });

    if (!conversations || conversations.length === 0) {
      setChats([]);
      return;
    }

    const mapped: ChatMessage[] = [];
    for (const conv of conversations) {
      const { data: msgs } = await supabase
        .from('support_messages')
        .select('id, body, sender_user_id, created_at, users(full_name)')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: true });

      const tenantName = (conv as any).tenants ? (conv as any).tenants.name : 'Unknown';
      const messages = (msgs || []).map((m: any) => ({
        id: m.id,
        text: m.body,
        sender: m.sender_user_id === profile.id ? ('admin' as const) : ('user' as const),
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
      const last = messages[messages.length - 1];

      mapped.push({
        id: conv.id,
        tenant: tenantName,
        senderName: tenantName,
        senderRole: 'Project Founder',
        senderRoleAr: 'مؤسس المشروع',
        projectId: (conv.tenant_id as string).slice(0, 8).toUpperCase(),
        lastMessage: last ? last.text : '',
        timeAgo: last ? last.timestamp : '',
        avatar: '',
        isOnline: true,
        statusColor: 'green',
        messages,
      });
    }

    setChats(mapped);
    if (!selectedChatId && mapped.length > 0) setSelectedChatId(mapped[0].id);
  }, [profile, selectedChatId]);

  useEffect(() => {
    refreshPatients();
    refreshBookings();
    refreshInventory();
    refreshInvoices();
    refreshProjects();
    refreshExpenses();
  }, [refreshPatients, refreshBookings, refreshInventory, refreshInvoices, refreshProjects, refreshExpenses]);

  useEffect(() => {
    refreshChats();
  }, [refreshChats]);

  const addTenant = async (tenant: Omit<Tenant, 'id'>) => {
    const { error } = await supabase.from('tenants').insert({
      name: tenant.name,
      name_ar: tenant.nameAr,
      code: tenant.code,
      logo_url: tenant.logo,
      plan: tenant.plan,
      status: tenant.status,
      discount_code: tenant.discountCode || null,
      subscription_renews_at: tenant.expiryDate || null,
      mrr: tenant.mrr,
      location: tenant.location,
    });
    if (error) {
      showToast(error.message);
      return;
    }
    await refreshTenants();
    showToast(isRTL ? 'تمت إضافة المستأجر الجديد بنجاح' : 'New tenant added successfully');
  };

  const updateTenant = async (id: string, updates: Partial<Tenant>) => {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.nameAr !== undefined) payload.name_ar = updates.nameAr;
    if (updates.code !== undefined) payload.code = updates.code;
    if (updates.logo !== undefined) payload.logo_url = updates.logo;
    if (updates.plan !== undefined) payload.plan = updates.plan;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.discountCode !== undefined) payload.discount_code = updates.discountCode;
    if (updates.expiryDate !== undefined) payload.subscription_renews_at = updates.expiryDate;
    if (updates.mrr !== undefined) payload.mrr = updates.mrr;
    if (updates.location !== undefined) payload.location = updates.location;

    const { error } = await supabase.from('tenants').update(payload).eq('id', id);
    if (error) {
      showToast(error.message);
      return;
    }
    await refreshTenants();
  };

  const setActiveTenant = (tenant: Tenant) => setActiveTenantId(tenant.id);

  const updateSubscriptionStatus = (id: string, status: 'Active' | 'Expiring Soon' | 'Suspended') => {
    updateTenant(id, { status });
    showToast(isRTL ? `تم تحديث حالة الاشتراك إلى "${status}"` : `Subscription status updated to "${status}"`);
  };

  const applyDiscountCode = (id: string, code: string) => {
    updateTenant(id, { discountCode: code });
    showToast(isRTL ? `تم تطبيق كود الخصم "${code}"` : `Discount code "${code}" applied`);
  };

  const sendChatMessage = async (chatId: string, text: string) => {
    if (!text.trim() || !profile) return;
    const { error } = await supabase.from('support_messages').insert({
      conversation_id: chatId,
      sender_user_id: profile.id,
      body: text,
    });
    if (error) {
      showToast(error.message);
      return;
    }
    await refreshChats();
  };

  const updateAnnouncement = (ann: { title: string; titleAr: string; message: string; messageAr: string }) => {
    setAnnouncement(ann);
    showToast(isRTL ? 'تم تحديث الإعلان العام للنظام' : 'System announcement updated');
  };

  const toggleAutoDeduct = async (id: string) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    const { error } = await supabase.from('inventory_items').update({ auto_deduct: !item.autoDeduct }).eq('id', id);
    if (error) {
      showToast(error.message);
      return;
    }
    await refreshInventory();
  };

  const adjustStock = async (id: string, newStock: number, reason?: string) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;
    const diff = newStock - item.stockLevel;

    const { error } = await supabase
      .from('inventory_stock')
      .update({ quantity_on_hand: newStock, updated_at: new Date().toISOString() })
      .eq('item_id', id);
    if (error) {
      showToast(error.message);
      return;
    }

    await refreshInventory();

    if (diff !== 0) {
      const newLog: AutoDeductLog = {
        id: `log-${Date.now()}`,
        itemName: item.nameEn,
        itemNameAr: item.nameAr,
        units: Math.abs(diff),
        bookingId: reason || (diff < 0 ? 'Manual Deduction' : 'Restock Order'),
        timeAgo: 'Just now',
        status: 'success',
      };
      setAutoDeductLogs((prev) => [newLog, ...prev]);
    }

    showToast(
      isRTL ? `تم تحديث رصيد ${item.nameAr} إلى ${newStock} ${item.unit}` : `Updated ${item.nameEn} stock to ${newStock} ${item.unit}`
    );
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    if (!activeTenantId) return;
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        tenant_id: activeTenantId,
        name_en: item.nameEn,
        name_ar: item.nameAr,
        sku: item.sku,
        category: item.category,
        category_ar: item.categoryAr,
        unit: item.unit,
        max_stock: item.maxStock,
        reorder_level: item.minReq,
        unit_cost: item.unitCost,
        auto_deduct: item.autoDeduct,
        location: item.location,
        supplier: item.supplier,
      })
      .select()
      .single();

    if (error || !data) {
      showToast(error?.message || 'Error');
      return;
    }

    await supabase.from('inventory_stock').insert({ item_id: data.id, quantity_on_hand: item.stockLevel });
    if (item.unitCost) {
      await supabase.from('inventory_price_history').insert({ item_id: data.id, purchase_price: item.unitCost, supplier: item.supplier });
    }

    await refreshInventory();
    showToast(isRTL ? 'تمت إضافة الصنف إلى المخزون' : 'Item added to inventory');
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    if (!activeTenantId) return;
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        tenant_id: activeTenantId,
        invoice_number: invoice.invoiceNumber,
        client_name: invoice.clientName,
        client_name_ar: invoice.clientNameAr || null,
        total_amount: invoice.amount,
        status: invoice.status,
        due_date: invoice.dueDate || null,
      })
      .select()
      .single();

    if (error || !data) {
      showToast(error?.message || 'Error');
      return;
    }

    if (invoice.items.length > 0) {
      await supabase.from('invoice_items').insert(
        invoice.items.map((it) => ({
          invoice_id: data.id,
          description: it.description,
          quantity: it.quantity,
          unit_price: it.unitPrice,
        }))
      );
    }

    await refreshInvoices();
    showToast(isRTL ? `تم إنشاء الفاتورة ${invoice.invoiceNumber} بنجاح` : `Invoice ${invoice.invoiceNumber} created successfully`);
  };

  const addExpense = async (expense: { category: string; description: string; amount: number; date: string }) => {
    if (!activeTenantId) return;
    const { error } = await supabase.from('expenses').insert({
      tenant_id: activeTenantId,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      expense_date: expense.date,
      created_by: profile?.id || null,
    });
    if (error) {
      showToast(error.message);
      return;
    }
    await refreshExpenses();
    showToast(isRTL ? 'تم تسجيل المصروف بنجاح' : 'Expense recorded successfully');
  };

  const monthKey = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}`;
  };
  const monthLabel = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, { month: 'short' });

  const financials = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: 'short' }) });
    }

    const paidInvoices = invoices.filter((inv) => inv.status === 'paid');
    const totalIncome = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const estimatedTaxes = Math.max(netProfit, 0) * 0.15;

    const monthlyTrends = months.map((m) => {
      const income = paidInvoices
        .filter((inv) => inv.date && monthKey(inv.date) === m.key)
        .reduce((sum, inv) => sum + inv.amount, 0);
      const exp = expenses
        .filter((e) => e.date && monthKey(e.date) === m.key)
        .reduce((sum, e) => sum + e.amount, 0);
      return { month: m.label, income, expenses: exp, profit: income - exp };
    });

    const maxIncome = Math.max(1, ...monthlyTrends.map((m) => m.income));
    const maxLoss = Math.max(1, ...monthlyTrends.map((m) => Math.max(m.expenses, m.profit)));
    const trendsWithPct = monthlyTrends.map((m) => ({
      ...m,
      barPct: Math.round((m.income / maxIncome) * 100),
      lossPct: Math.round((Math.max(m.expenses, m.profit) / maxLoss) * 100),
    }));

    const thisMonth = monthlyTrends[monthlyTrends.length - 1];
    const lastMonth = monthlyTrends[monthlyTrends.length - 2];
    const pctChange = (curr: number, prev: number) => {
      if (!prev) return curr > 0 ? '+100%' : '0.0%';
      const pct = ((curr - prev) / prev) * 100;
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% vs last month`;
    };

    return {
      totalIncome,
      incomeChange: lastMonth ? pctChange(thisMonth.income, lastMonth.income) : '0.0%',
      totalExpenses,
      expensesChange: lastMonth ? pctChange(thisMonth.expenses, lastMonth.expenses) : '0.0%',
      netProfit,
      profitChange: lastMonth ? pctChange(thisMonth.profit, lastMonth.profit) : '0.0%',
      estimatedTaxes,
      taxesChange: '0.0%',
      totalRevenueMrr: activeTenant?.mrr || 0,
      mrrChange: '0.0%',
      monthlyTrends: trendsWithPct,
    };
  }, [invoices, expenses, activeTenant]);

  const updateInvoiceStatus = async (id: string, status: 'paid' | 'pending' | 'overdue') => {
    const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
    if (error) {
      showToast(error.message);
      return;
    }
    await refreshInvoices();
    showToast(isRTL ? `تم تحديث حالة الفاتورة إلى "${status}"` : `Invoice status updated to "${status}"`);
  };

  const addPatient = async (patient: Omit<Patient, 'id'>) => {
    if (!activeTenantId) return;
    const { error } = await supabase.from('patients').insert({
      tenant_id: activeTenantId,
      full_name: patient.nameEn,
      name_en: patient.nameEn,
      name_ar: patient.nameAr,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      blood_type: patient.bloodType,
      national_id: patient.nationalId,
      doctor: patient.doctor,
      condition: patient.condition,
      status: patient.status,
    });
    if (error) {
      showToast(error.message);
      return;
    }
    await refreshPatients();
    showToast(isRTL ? 'تم تسجيل المريض الجديد بنجاح' : 'Patient registered successfully');
  };

  const addBooking = async (booking: Omit<Booking, 'id'>) => {
    if (!activeTenantId) return;
    const { error } = await supabase.from('bookings').insert({
      tenant_id: activeTenantId,
      patient_id: patients.find((p) => p.nameEn === booking.patientName || p.nameAr === booking.patientNameAr)?.id || null,
      booking_number: booking.bookingNumber,
      patient_name_ar: booking.patientNameAr,
      doctor_name: booking.doctorName,
      doctor_name_ar: booking.doctorNameAr,
      department: booking.department,
      department_ar: booking.departmentAr,
      time_label: booking.time,
      date_label: booking.date,
      status: booking.status,
      booking_type: booking.type,
      service_name: booking.department,
    });
    if (error) {
      showToast(error.message);
      return;
    }
    await refreshBookings();

    const consumableItem = inventory.find((i) => i.autoDeduct && i.stockLevel > 0);
    if (consumableItem) {
      await supabase.from('inventory_consumption_log').insert({
        item_id: consumableItem.id,
        quantity_used: 1,
        created_by: profile?.id || null,
      });
      await refreshInventory();
    }

    showToast(isRTL ? `تم تأكيد حجز الموعد ${booking.bookingNumber}` : `Booking ${booking.bookingNumber} confirmed`);
  };

  const updateBookingStatus = async (id: string, status: 'confirmed' | 'pending' | 'cancelled') => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) {
      showToast(error.message);
      return;
    }
    await refreshBookings();
  };

  const openPdfExport = (title: string) => {
    setPdfExportTitle(title);
    setIsPdfExportOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        language,
        setLanguage,
        toggleLanguage,
        theme,
        setTheme,
        toggleTheme,
        isRTL,
        activeTenant: activeTenant as Tenant,
        setActiveTenant,
        tenants,
        addTenant,
        updateTenant,
        subscriptions,
        updateSubscriptionStatus,
        applyDiscountCode,
        chats,
        selectedChatId,
        setSelectedChatId,
        sendChatMessage,
        announcement,
        updateAnnouncement,
        defaultDiscount,
        setDefaultDiscount,
        inventory,
        autoDeductLogs,
        toggleAutoDeduct,
        adjustStock,
        addInventoryItem,
        invoices,
        financials,
        addExpense,
        addInvoice,
        updateInvoiceStatus,
        patients,
        addPatient,
        bookings,
        addBooking,
        updateBookingStatus,
        projects,
        isCreateInvoiceOpen,
        setIsCreateInvoiceOpen,
        isAddPatientOpen,
        setIsAddPatientOpen,
        isNewBookingOpen,
        setIsNewBookingOpen,
        isAdjustStockOpen,
        setIsAdjustStockOpen,
        selectedStockItem,
        setSelectedStockItem,
        isQrScannerOpen,
        setIsQrScannerOpen,
        isTenantModalOpen,
        setIsTenantModalOpen,
        isPdfExportOpen,
        setIsPdfExportOpen,
        pdfExportTitle,
        setPdfExportTitle,
        openPdfExport,
        toastMessage,
        showToast,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
