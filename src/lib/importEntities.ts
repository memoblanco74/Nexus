import { supabase } from './supabaseClient';
import { ColumnDef, toIsoDate, toNumber, toPhone } from './importSheet';
import type { ImportEntity } from '../components/ui/ImportModal';

const chunk = <T,>(arr: T[], n: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};

const isMale = (v: string) => /^(male|boy|m|ولد|ذكر|ذكور)$/i.test(v.trim());
const isFemale = (v: string) => /^(female|girl|f|بنت|انثى|أنثى|اناث|إناث)$/i.test(v.trim());

const childColumns: ColumnDef[] = [
  { key: 'full_name', labelAr: 'اسم الطفل', labelEn: 'Child name', aliases: ['الاسم', 'name', 'full name'], required: true, sampleAr: 'يوسف أحمد', sampleEn: 'Youssef Ahmed' },
  { key: 'birth_date', labelAr: 'تاريخ الميلاد', labelEn: 'Birth date', aliases: ['birth', 'dob', 'الميلاد'], sampleAr: '2023-05-14', sampleEn: '2023-05-14' },
  { key: 'gender', labelAr: 'النوع', labelEn: 'Gender', aliases: ['الجنس', 'sex'], sampleAr: 'ولد', sampleEn: 'Boy' },
  { key: 'father_name', labelAr: 'اسم الأب', labelEn: 'Father name', aliases: ['الاب'], sampleAr: 'أحمد محمود', sampleEn: 'Ahmed Mahmoud' },
  { key: 'father_phone', labelAr: 'موبايل الأب', labelEn: 'Father phone', aliases: ['تليفون الاب', 'رقم الاب'], sampleAr: '01012345678', sampleEn: '01012345678' },
  { key: 'mother_name', labelAr: 'اسم الأم', labelEn: 'Mother name', aliases: ['الام'], sampleAr: 'منى علي', sampleEn: 'Mona Ali' },
  { key: 'mother_phone', labelAr: 'موبايل الأم', labelEn: 'Mother phone', aliases: ['تليفون الام', 'رقم الام'], sampleAr: '01112345678', sampleEn: '01112345678' },
  { key: 'guardian_phone', labelAr: 'موبايل ولي الأمر', labelEn: 'Guardian phone', aliases: ['ولي الامر', 'guardian'], sampleAr: '', sampleEn: '' },
  { key: 'address', labelAr: 'العنوان', labelEn: 'Address', sampleAr: 'مدينة نصر', sampleEn: 'Nasr City' },
  { key: 'allergies', labelAr: 'حساسية', labelEn: 'Allergies', aliases: ['الحساسية'], sampleAr: 'بيض', sampleEn: 'Eggs' },
  { key: 'notes', labelAr: 'ملاحظات', labelEn: 'Notes', sampleAr: '', sampleEn: '' },
];

export const childrenEntity = (tenantId: string, existingNames: string[]): ImportEntity => ({
  title: 'الأطفال',
  titleEn: 'children',
  filename: 'children-template.xlsx',
  columns: childColumns,
  validate: (r) => {
    if (existingNames.some((n) => n.trim().toLowerCase() === r.full_name.trim().toLowerCase())) return 'مسجّل بالفعل / Already exists';
    if (r.birth_date && !toIsoDate(r.birth_date)) return 'تاريخ ميلاد غير صالح / Invalid date';
    return null;
  },
  insert: async (records) => {
    const rows = records.map((r) => ({
      tenant_id: tenantId,
      full_name: r.full_name.trim(),
      birth_date: toIsoDate(r.birth_date),
      gender: isMale(r.gender) ? 'male' : isFemale(r.gender) ? 'female' : null,
      father_name: r.father_name || null,
      father_phone: toPhone(r.father_phone) || null,
      mother_name: r.mother_name || null,
      mother_phone: toPhone(r.mother_phone) || null,
      guardian_phone: toPhone(r.guardian_phone) || null,
      address: r.address || null,
      allergies: r.allergies || null,
      notes: r.notes || null,
      status: 'active',
    }));
    for (const part of chunk(rows, 200)) {
      const { error } = await supabase.from('nursery_children').insert(part);
      if (error) return { error: error.message };
    }
    return { error: null };
  },
});

const patientColumns: ColumnDef[] = [
  { key: 'name', labelAr: 'اسم المريض', labelEn: 'Patient name', aliases: ['الاسم', 'name', 'full name'], required: true, sampleAr: 'محمود حسن', sampleEn: 'Mahmoud Hassan' },
  { key: 'phone', labelAr: 'الموبايل', labelEn: 'Phone', aliases: ['تليفون', 'رقم الموبايل', 'mobile'], sampleAr: '01012345678', sampleEn: '01012345678' },
  { key: 'gender', labelAr: 'النوع', labelEn: 'Gender', aliases: ['الجنس'], sampleAr: 'ذكر', sampleEn: 'Male' },
  { key: 'age', labelAr: 'السن', labelEn: 'Age', aliases: ['العمر'], sampleAr: '35', sampleEn: '35' },
  { key: 'blood', labelAr: 'فصيلة الدم', labelEn: 'Blood type', aliases: ['blood'], sampleAr: 'O+', sampleEn: 'O+' },
  { key: 'national_id', labelAr: 'الرقم القومي', labelEn: 'National ID', aliases: ['الهوية'], sampleAr: '', sampleEn: '' },
  { key: 'doctor', labelAr: 'الطبيب', labelEn: 'Doctor', aliases: ['دكتور'], sampleAr: 'د. سامي', sampleEn: 'Dr. Sami' },
  { key: 'condition', labelAr: 'الحالة / التشخيص', labelEn: 'Condition', aliases: ['التشخيص', 'الحالة'], sampleAr: '', sampleEn: '' },
];

export const patientsEntity = (tenantId: string, existingPhones: string[]): ImportEntity => ({
  title: 'المرضى',
  titleEn: 'patients',
  filename: 'patients-template.xlsx',
  columns: patientColumns,
  validate: (r) => {
    const ph = toPhone(r.phone);
    if (ph && existingPhones.includes(ph)) return 'الموبايل مسجّل بالفعل / Phone already exists';
    return null;
  },
  insert: async (records) => {
    const rows = records.map((r) => {
      const name = r.name.trim();
      const age = Math.round(toNumber(r.age));
      return {
        tenant_id: tenantId,
        full_name: name,
        name_en: name,
        name_ar: name,
        phone: toPhone(r.phone) || null,
        gender: isFemale(r.gender) ? 'Female' : 'Male',
        age: age > 0 && age < 130 ? age : null,
        blood_type: r.blood || null,
        national_id: r.national_id || null,
        doctor: r.doctor || null,
        condition: r.condition || null,
        status: 'Active',
      };
    });
    for (const part of chunk(rows, 200)) {
      const { error } = await supabase.from('patients').insert(part);
      if (error) return { error: error.message };
    }
    return { error: null };
  },
});

const inventoryColumns: ColumnDef[] = [
  { key: 'name', labelAr: 'اسم الصنف', labelEn: 'Item name', aliases: ['الاسم', 'name', 'الصنف'], required: true, sampleAr: 'قفازات طبية', sampleEn: 'Medical gloves' },
  { key: 'sku', labelAr: 'الكود', labelEn: 'SKU', aliases: ['باركود', 'barcode', 'code'], sampleAr: 'GLV-001', sampleEn: 'GLV-001' },
  { key: 'category', labelAr: 'التصنيف', labelEn: 'Category', aliases: ['الفئة'], sampleAr: 'مستهلكات', sampleEn: 'Consumables' },
  { key: 'unit', labelAr: 'الوحدة', labelEn: 'Unit', sampleAr: 'علبة', sampleEn: 'box' },
  { key: 'stock', labelAr: 'الكمية الحالية', labelEn: 'Current stock', aliases: ['الكمية', 'stock', 'quantity'], sampleAr: '50', sampleEn: '50' },
  { key: 'min', labelAr: 'حد الطلب', labelEn: 'Reorder level', aliases: ['الحد الادنى', 'min'], sampleAr: '10', sampleEn: '10' },
  { key: 'cost', labelAr: 'سعر الوحدة', labelEn: 'Unit cost', aliases: ['السعر', 'cost', 'price'], sampleAr: '120', sampleEn: '120' },
  { key: 'supplier', labelAr: 'المورد', labelEn: 'Supplier', sampleAr: '', sampleEn: '' },
];

export const inventoryEntity = (tenantId: string, existingSkus: string[]): ImportEntity => ({
  title: 'أصناف المخزون',
  titleEn: 'inventory items',
  filename: 'inventory-template.xlsx',
  columns: inventoryColumns,
  validate: (r) => (r.sku && existingSkus.includes(r.sku.toLowerCase()) ? 'الكود موجود بالفعل / SKU exists' : null),
  insert: async (records) => {
    for (const part of chunk(records, 100)) {
      const rows = part.map((r) => ({
        tenant_id: tenantId,
        name_en: r.name.trim(),
        name_ar: r.name.trim(),
        sku: r.sku || null,
        category: r.category || null,
        category_ar: r.category || null,
        unit: r.unit || 'unit',
        max_stock: Math.max(toNumber(r.stock), toNumber(r.min) * 3, 1),
        reorder_level: toNumber(r.min),
        unit_cost: toNumber(r.cost),
        supplier: r.supplier || null,
        auto_deduct: false,
      }));
      const { data, error } = await supabase.from('inventory_items').insert(rows).select('id');
      if (error || !data) return { error: error?.message || 'Error' };
      const stock = data.map((d: any, i: number) => ({ item_id: d.id, quantity_on_hand: toNumber(part[i].stock) }));
      const { error: e2 } = await supabase.from('inventory_stock').insert(stock);
      if (e2) return { error: e2.message };
    }
    return { error: null };
  },
});
