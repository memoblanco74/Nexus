import { Tenant, Patient, Booking, InventoryItem, Invoice, InvoiceItem, Subscription, Project, SystemTemplate } from '../types';

export function mapTenantRow(row: any): Tenant {
  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar || row.name,
    code: row.code || row.id.slice(0, 8).toUpperCase(),
    logo: row.logo_url || '',
    plan: (row.plan || 'Basic') as Tenant['plan'],
    status: (row.status || 'Active') as Tenant['status'],
    discountCode: row.discount_code || undefined,
    expiryDate: row.subscription_ends_at || row.subscription_renews_at || '',
    mrr: Number(row.mrr || 0),
    patientsCount: Number(row.patients_count || 0),
    todayBookings: Number(row.today_bookings || 0),
    location: row.location || '',
    systemId: row.system_id || undefined,
    subscriptionPaused: row.subscription_paused === true,
    startDate: row.subscription_started_at || '',
  };
}

export function tenantToSubscription(t: Tenant): Subscription {
  return {
    id: t.id,
    tenantName: t.name,
    tenantNameAr: t.nameAr,
    projectId: t.code,
    planType: t.plan,
    discount: t.discountCode || '-',
    expiryDate: t.expiryDate,
    status: t.status,
    startDate: t.startDate,
    mrr: t.mrr,
  };
}

export function mapPatientRow(row: any): Patient {
  return {
    id: row.id,
    nameEn: row.name_en || row.full_name || '',
    nameAr: row.name_ar || row.full_name || '',
    age: row.age || 0,
    gender: (row.gender || 'Male') as Patient['gender'],
    phone: row.phone || '',
    email: row.email || '',
    bloodType: row.blood_type || '',
    nationalId: row.national_id || '',
    lastVisit: row.created_at ? new Date(row.created_at).toLocaleDateString() : '',
    nextAppointment: undefined,
    doctor: row.doctor || '',
    condition: row.condition || '',
    status: (row.status || 'Active') as Patient['status'],
  };
}

export function mapBookingRow(row: any): Booking {
  const scheduled = row.scheduled_at ? new Date(row.scheduled_at) : null;
  return {
    id: row.id,
    bookingNumber: row.booking_number || row.id.slice(0, 8).toUpperCase(),
    patientName: row.patients ? row.patients.full_name : row.patient_name_ar || '',
    patientNameAr: row.patient_name_ar || (row.patients ? row.patients.full_name : ''),
    doctorName: row.doctor_name || '',
    doctorNameAr: row.doctor_name_ar || row.doctor_name || '',
    department: row.department || row.service_name || '',
    departmentAr: row.department_ar || row.department || '',
    time: row.time_label || (scheduled ? scheduled.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
    date: row.date_label || (scheduled ? scheduled.toLocaleDateString() : ''),
    status: (row.status || 'confirmed') as Booking['status'],
    type: (row.booking_type || 'Consultation') as Booking['type'],
  };
}

export function mapInventoryRow(row: any): InventoryItem {
  const stock = row.inventory_stock ? Number(row.inventory_stock.quantity_on_hand) : 0;
  const minReq = Number(row.reorder_level || 0);
  const status: InventoryItem['status'] = stock <= minReq / 2 ? 'critical' : stock <= minReq ? 'low' : 'normal';

  const history = (row.inventory_price_history || [])
    .slice()
    .sort((a: any, b: any) => new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime())
    .map((h: any) => ({
      month: new Date(h.effective_date).toLocaleDateString(undefined, { month: 'short' }),
      price: Number(h.purchase_price),
      unitsUsed: 0,
    }));

  let costChangePercent = 0;
  let costChangeDirection: InventoryItem['costChangeDirection'] = 'neutral';
  if (history.length >= 2) {
    const prev = history[history.length - 2].price;
    const latest = history[history.length - 1].price;
    if (prev > 0) {
      costChangePercent = Math.round(((latest - prev) / prev) * 100);
      costChangeDirection = latest > prev ? 'up' : latest < prev ? 'down' : 'neutral';
    }
  }

  return {
    id: row.id,
    nameEn: row.name_en || '',
    nameAr: row.name_ar || '',
    sku: row.sku || '',
    category: row.category || '',
    categoryAr: row.category_ar || row.category || '',
    stockLevel: stock,
    maxStock: Number(row.max_stock || 0),
    minReq,
    unit: row.unit || 'unit',
    unitCost: Number(row.unit_cost || 0),
    costChangePercent,
    costChangeDirection,
    autoDeduct: row.auto_deduct !== false,
    status,
    location: row.location || '',
    supplier: row.supplier || '',
    history,
  };
}

export function mapInvoiceRow(row: any): Invoice {
  const items: InvoiceItem[] = (row.invoice_items || []).map((it: any) => ({
    description: it.description,
    quantity: Number(it.quantity),
    unitPrice: Number(it.unit_price),
    total: Number(it.quantity) * Number(it.unit_price),
  }));

  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    clientName: row.client_name || (row.patients ? row.patients.full_name : ''),
    clientNameAr: row.client_name_ar || undefined,
    amount: Number(row.total_amount || 0),
    status: (row.status || 'pending') as Invoice['status'],
    date: row.issued_at ? new Date(row.issued_at).toLocaleDateString() : '',
    dueDate: row.due_date || '',
    items,
  };
}

export function mapProjectRow(row: any): Project {
  return {
    id: row.id,
    title: row.title,
    titleAr: row.title_ar || row.title,
    tenantName: row.tenants ? row.tenants.name : '',
    progress: row.progress || 0,
    status: (row.status || 'Planning') as Project['status'],
    budget: Number(row.budget || 0),
    spent: Number(row.spent || 0),
    targetDate: row.target_date || '',
    manager: row.manager || '',
  };
}

export function mapSystemTemplateRow(row: any): SystemTemplate {
  return {
    id: row.id,
    key: row.key,
    name: row.name_en,
    nameAr: row.name_ar,
    icon: row.icon || '📦',
    brief: row.brief_en || '',
    briefAr: row.brief_ar || '',
    subscriptionPrice: Number(row.subscription_price || 0),
    subscriptionPeriod: row.subscription_period || 'monthly',
    isActive: row.is_active !== false,
    subscriberCount: 0,
    features: (row.system_template_features || [])
      .slice()
      .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
      .map((f: any) => ({
        id: f.id,
        title: f.title_en,
        titleAr: f.title_ar,
        description: f.description_en,
        descriptionAr: f.description_ar,
        icon: f.icon || '✨',
      })),
  };
}
