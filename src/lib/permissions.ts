export interface PermDef { key: string; group: string; ar: string; en: string }

export const PERM_GROUPS: Array<{ id: string; ar: string; en: string }> = [
  { id: 'children', ar: 'الأطفال', en: 'Children' },
  { id: 'daily', ar: 'اليومية', en: 'Daily log' },
  { id: 'payments', ar: 'تحصيل الاشتراكات', en: 'Fee collection' },
  { id: 'fees', ar: 'أنواع الاشتراكات', en: 'Subscription types' },
  { id: 'money', ar: 'المصاريف والمرتبات', en: 'Expenses & payroll' },
  { id: 'home', ar: 'الصفحة الرئيسية', en: 'Home page' },
];

export const PERMISSIONS: PermDef[] = [
  { key: 'children.add', group: 'children', ar: 'إضافة أطفال', en: 'Add children' },
  { key: 'children.edit', group: 'children', ar: 'تعديل بيانات الأطفال', en: 'Edit children' },
  { key: 'children.import', group: 'children', ar: 'استيراد أطفال من Excel', en: 'Import from Excel' },
  { key: 'children.contacts', group: 'children', ar: 'رؤية أرقام وأسماء أولياء الأمور', en: 'See parent names and phones' },
  { key: 'children.health', group: 'children', ar: 'رؤية الحساسية والملاحظات الصحية والتطعيمات', en: 'See allergies, health notes, vaccines' },
  { key: 'vaccines.edit', group: 'children', ar: 'تسجيل التطعيمات', en: 'Record vaccinations' },
  { key: 'classes.manage', group: 'children', ar: 'إدارة الفصول (إنشاء وتسمية ونقل الأطفال)', en: 'Manage classes' },
  { key: 'portal.manage', group: 'children', ar: 'إدارة رابط بوابة ولي الأمر', en: 'Manage parent portal links' },
  { key: 'messages.send', group: 'children', ar: 'إرسال رسائل واتساب لأولياء الأمور', en: 'Send WhatsApp messages to parents' },
  { key: 'daily.view', group: 'daily', ar: 'رؤية اليومية والحضور', en: 'View daily log' },
  { key: 'daily.mark', group: 'daily', ar: 'تسجيل الحضور واليومية', en: 'Record attendance and daily log' },
  { key: 'payments.view', group: 'payments', ar: 'رؤية المدفوعات والمتأخرات', en: 'View payments and arrears' },
  { key: 'payments.collect', group: 'payments', ar: 'تسجيل دفعات الاشتراكات', en: 'Record payments' },
  { key: 'fees.view', group: 'fees', ar: 'رؤية صفحة الاشتراكات وأسعارها', en: 'View subscription types and prices' },
  { key: 'fees.edit', group: 'fees', ar: 'إضافة وتعديل أنواع الاشتراكات والأسعار', en: 'Edit subscription types and prices' },
  { key: 'expenses.view', group: 'money', ar: 'رؤية المصروفات', en: 'View expenses' },
  { key: 'expenses.add', group: 'money', ar: 'تسجيل وحذف المصروفات', en: 'Add and delete expenses' },
  { key: 'staff.attendance', group: 'money', ar: 'تسجيل حضور الموظفين', en: 'Record staff attendance' },
  { key: 'staff.payroll', group: 'money', ar: 'رؤية وصرف المرتبات', en: 'View and pay salaries' },
  { key: 'reports.view', group: 'money', ar: 'رؤية الأرباح والخسائر', en: 'View profit and loss' },
  { key: 'home.attendance', group: 'home', ar: 'كارت الحضور حسب الفصل', en: 'Attendance by class card' },
  { key: 'home.birthdays', group: 'home', ar: 'كارت أعياد الميلاد', en: 'Birthdays card' },
  { key: 'home.quick_actions', group: 'home', ar: 'أزرار الإجراءات السريعة', en: 'Quick actions' },
  { key: 'home.alerts', group: 'home', ar: 'تنبيهات الحساسية والفصول', en: 'Allergy and class alerts' },
  { key: 'home.staff', group: 'home', ar: 'كارت الموظفين (الغياب والزيادات المستحقة)', en: 'Staff card (absences, due raises)' },
  { key: 'home.money', group: 'home', ar: 'الكروت المالية (المقارنة والمتأخرين)', en: 'Money cards (comparison, late payers)' },
];

export const DEFAULT_ACTIONS: string[] = [
  'children.add', 'children.edit', 'children.import', 'children.contacts', 'children.health', 'vaccines.edit', 'classes.manage',
  'portal.manage', 'messages.send', 'daily.view', 'daily.mark', 'payments.view', 'payments.collect', 'fees.view',
  'home.attendance', 'home.birthdays', 'home.quick_actions', 'home.alerts',
];

export const canDo = (role: string | undefined, actions: string[] | null | undefined, key: string): boolean => {
  if (role !== 'assistant') return true;
  return (actions ?? DEFAULT_ACTIONS).includes(key);
};

export const deriveScreens = (actions: string[]): string[] => {
  const has = (...keys: string[]) => keys.some((k) => actions.includes(k));
  const out: string[] = [];
  if (has('children.add', 'children.edit', 'children.import', 'children.contacts', 'children.health', 'vaccines.edit', 'classes.manage', 'portal.manage', 'messages.send', 'daily.view', 'daily.mark', 'payments.view', 'payments.collect')) out.push('patients');
  if (has('fees.view', 'fees.edit')) out.push('subscriptions');
  if (has('expenses.view', 'expenses.add', 'staff.attendance', 'staff.payroll', 'reports.view')) out.push('accounting');
  return out;
};
