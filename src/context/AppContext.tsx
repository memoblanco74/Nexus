import React, { createContext, useContext, useState, useEffect } from 'react';
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
  INITIAL_TENANTS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_CHATS,
  INITIAL_INVENTORY,
  INITIAL_AUTO_DEDUCTIONS,
  INITIAL_INVOICES,
  INITIAL_PATIENTS,
  INITIAL_BOOKINGS,
  INITIAL_PROJECTS,
  FINANCIAL_METRICS,
} from '../data/mockData';

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

  // Active Tenant
  activeTenant: Tenant;
  setActiveTenant: (tenant: Tenant) => void;
  tenants: Tenant[];
  addTenant: (tenant: Omit<Tenant, 'id'>) => void;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;

  // Subscriptions
  subscriptions: Subscription[];
  updateSubscriptionStatus: (
    id: string,
    status: 'Active' | 'Expiring Soon' | 'Suspended'
  ) => void;
  applyDiscountCode: (id: string, code: string) => void;

  // Live Chat
  chats: ChatMessage[];
  selectedChatId: string;
  setSelectedChatId: (id: string) => void;
  sendChatMessage: (chatId: string, text: string) => void;

  // Announcement & Global Discount
  announcement: { title: string; titleAr: string; message: string; messageAr: string };
  updateAnnouncement: (announcement: {
    title: string;
    titleAr: string;
    message: string;
    messageAr: string;
  }) => void;
  defaultDiscount: string;
  setDefaultDiscount: (discount: string) => void;

  // Inventory & ERP
  inventory: InventoryItem[];
  autoDeductLogs: AutoDeductLog[];
  toggleAutoDeduct: (id: string) => void;
  adjustStock: (id: string, newStock: number, reason?: string) => void;
  addInventoryItem: (item: Omit<InventoryItem, 'id'>) => void;

  // Accounting & Invoices
  invoices: Invoice[];
  financials: typeof FINANCIAL_METRICS;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoiceStatus: (id: string, status: 'paid' | 'pending' | 'overdue') => void;

  // Patients & Bookings
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id'>) => void;
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id'>) => void;
  updateBookingStatus: (id: string, status: 'confirmed' | 'pending' | 'cancelled') => void;

  // Projects
  projects: Project[];

  // Modals & UI helpers
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

  // Toast / Notification banner
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Translation helper
  t: (key: string) => string;
}

const DICTIONARY: Record<string, { en: string; ar: string }> = {
  // Navigation
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

  // Super Admin Header & Badges
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

  // Founder Dashboard
  'founder.title': { en: 'Founder & Clinic Overview', ar: 'نظرة عامة للمؤسس والعيادة' },
  'founder.welcome': { en: 'Welcome back, Dr. Julian Vance', ar: 'مرحباً بعودتك، د. جوليان فانس' },
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

  // Inventory
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

  // Accounting
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

  // Common Table Headers & Labels
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
  const [screen, setScreen] = useState<ScreenId>('super_admin');
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [activeTenant, setActiveTenant] = useState<Tenant>(INITIAL_TENANTS[0]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [chats, setChats] = useState<ChatMessage[]>(INITIAL_CHATS);
  const [selectedChatId, setSelectedChatId] = useState<string>('chat-1');

  const [announcement, setAnnouncement] = useState({
    title: 'Scheduled Maintenance',
    titleAr: 'صيانة دورية مجدولة',
    message: 'System upgrade on Oct 15, 02:00 UTC. Zero downtime expected.',
    messageAr: 'ترقية البنية السحابية في ١٥ أكتوبر، الساعة ٠٢:٠٠ ص بتوقيت UTC. دون أي انقطاع للخدمة.',
  });
  const [defaultDiscount, setDefaultDiscount] = useState<string>('15%');

  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [autoDeductLogs, setAutoDeductLogs] = useState<AutoDeductLog[]>(INITIAL_AUTO_DEDUCTIONS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [projects] = useState<Project[]>(INITIAL_PROJECTS);
  const [financials] = useState(FINANCIAL_METRICS);

  // Modals state
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
    // Synchronize HTML lang & dir
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const t = (key: string): string => {
    const entry = DICTIONARY[key];
    if (!entry) return key;
    return entry[language] || entry.en;
  };

  const addTenant = (tenant: Omit<Tenant, 'id'>) => {
    const newId = `t-${Date.now()}`;
    const newTenant: Tenant = { ...tenant, id: newId };
    setTenants((prev) => [newTenant, ...prev]);
    showToast(isRTL ? 'تمت إضافة المستأجر الجديد بنجاح' : 'New tenant added successfully');
  };

  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    if (activeTenant.id === id) {
      setActiveTenant((prev) => ({ ...prev, ...updates }));
    }
  };

  const updateSubscriptionStatus = (
    id: string,
    status: 'Active' | 'Expiring Soon' | 'Suspended'
  ) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
    showToast(
      isRTL
        ? `تم تحديث حالة الاشتراك إلى "${status}"`
        : `Subscription status updated to "${status}"`
    );
  };

  const applyDiscountCode = (id: string, code: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, discount: code } : s))
    );
    showToast(
      isRTL ? `تم تطبيق كود الخصم "${code}"` : `Discount code "${code}" applied`
    );
  };

  const sendChatMessage = (chatId: string, text: string) => {
    if (!text.trim()) return;
    const newMsg = {
      id: `m-${Date.now()}`,
      text,
      sender: 'admin' as const,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          return {
            ...c,
            lastMessage: text,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    // Auto-reply simulation for interactive immersion
    setTimeout(() => {
      const repliesEn = [
        'Received. Our clinic IT supervisor is syncing the database nodes right now.',
        'Thank you! That resolved our billing module calculation.',
        'Great! We will test the auto-deduct flow during our next scheduled shift.',
      ];
      const repliesAr = [
        'تم الاستلام. يقوم المشرف التقني لدينا بمزامنة خوادم قواعد البيانات الآن.',
        'شكراً جزيلاً! تم حل احتساب نموذج الفوترة بنجاح.',
        'ممتاز! سنقوم باختبار مسار الاستقطاع التلقائي خلال الوردية القادمة.',
      ];
      const randomReply = isRTL
        ? repliesAr[Math.floor(Math.random() * repliesAr.length)]
        : repliesEn[Math.floor(Math.random() * repliesEn.length)];

      const userReply = {
        id: `m-reply-${Date.now()}`,
        text: randomReply,
        sender: 'user' as const,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === chatId) {
            return {
              ...c,
              lastMessage: randomReply,
              messages: [...c.messages, userReply],
            };
          }
          return c;
        })
      );
    }, 1400);
  };

  const updateAnnouncement = (ann: {
    title: string;
    titleAr: string;
    message: string;
    messageAr: string;
  }) => {
    setAnnouncement(ann);
    showToast(isRTL ? 'تم تحديث الإعلان العام للنظام' : 'System announcement updated');
  };

  const toggleAutoDeduct = (id: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, autoDeduct: !item.autoDeduct } : item
      )
    );
  };

  const adjustStock = (id: string, newStock: number, reason?: string) => {
    const item = inventory.find((i) => i.id === id);
    if (!item) return;

    const diff = newStock - item.stockLevel;
    const newStatus: 'critical' | 'low' | 'normal' =
      newStock <= item.minReq / 2
        ? 'critical'
        : newStock <= item.minReq
        ? 'low'
        : 'normal';

    setInventory((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, stockLevel: newStock, status: newStatus } : i
      )
    );

    // Log the adjustment
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
      isRTL
        ? `تم تحديث رصيد ${item.nameAr} إلى ${newStock} ${item.unit}`
        : `Updated ${item.nameEn} stock to ${newStock} ${item.unit}`
    );
  };

  const addInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
    };
    setInventory((prev) => [newItem, ...prev]);
    showToast(isRTL ? 'تمت إضافة الصنف إلى المخزون' : 'Item added to inventory');
  };

  const addInvoice = (invoice: Omit<Invoice, 'id'>) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
    };
    setInvoices((prev) => [newInvoice, ...prev]);
    showToast(
      isRTL
        ? `تم إنشاء الفاتورة ${invoice.invoiceNumber} بنجاح`
        : `Invoice ${invoice.invoiceNumber} created successfully`
    );
  };

  const updateInvoiceStatus = (
    id: string,
    status: 'paid' | 'pending' | 'overdue'
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, status } : inv))
    );
    showToast(
      isRTL
        ? `تم تحديث حالة الفاتورة إلى "${status}"`
        : `Invoice status updated to "${status}"`
    );
  };

  const addPatient = (patient: Omit<Patient, 'id'>) => {
    const newPatient: Patient = {
      ...patient,
      id: `pat-${Date.now()}`,
    };
    setPatients((prev) => [newPatient, ...prev]);
    showToast(isRTL ? 'تم تسجيل المريض الجديد بنجاح' : 'Patient registered successfully');
  };

  const addBooking = (booking: Omit<Booking, 'id'>) => {
    const newBooking: Booking = {
      ...booking,
      id: `b-${Date.now()}`,
    };
    setBookings((prev) => [newBooking, ...prev]);

    // Perform simulated auto-deduction if inventory items are linked
    const consumableItem = inventory.find((i) => i.autoDeduct && i.stockLevel > 0);
    if (consumableItem) {
      adjustStock(
        consumableItem.id,
        consumableItem.stockLevel - 1,
        `Auto-Deduct (Booking #${booking.bookingNumber})`
      );
    }

    showToast(
      isRTL
        ? `تم تأكيد حجز الموعد ${booking.bookingNumber}`
        : `Booking ${booking.bookingNumber} confirmed`
    );
  };

  const updateBookingStatus = (
    id: string,
    status: 'confirmed' | 'pending' | 'cancelled'
  ) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
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
        activeTenant,
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
