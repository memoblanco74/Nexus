import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Building,
  CreditCard,
  AlertCircle,
  Megaphone,
  Percent,
  MessageSquare,
  Search,
  Filter,
  Download,
  Plus,
  Send,
  MoreVertical,
  CheckCircle2,
  Clock,
  Ban,
  Radio,
  ExternalLink,
  ChevronRight,
  Sparkles,
  DollarSign,
  Trash2,
} from 'lucide-react';

export const SuperAdminView: React.FC = () => {
  const {
    language,
    isRTL,
    subscriptions,
    updateSubscriptionStatus,
    applyDiscountCode,
    updateTenant,
    deleteTenant,
    chats,
    selectedChatId,
    setSelectedChatId,
    sendChatMessage,
    announcement,
    updateAnnouncement,
    defaultDiscount,
    setDefaultDiscount,
    setIsTenantModalOpen,
    openPdfExport,
    showToast,
    t,
  } = useApp();

  const [chatInput, setChatInput] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [subFilter, setSubFilter] = useState<'all' | 'Active' | 'Expiring Soon' | 'Suspended'>('all');
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);
  const [announcementText, setAnnouncementText] = useState(
    language === 'ar' ? announcement.messageAr : announcement.message
  );
  const [announcementTitle, setAnnouncementTitle] = useState(
    language === 'ar' ? announcement.titleAr : announcement.title
  );

  const selectedChat = chats.find((c) => c.id === selectedChatId) || chats[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !selectedChat) return;
    sendChatMessage(selectedChat.id, chatInput);
    setChatInput('');
  };

  const handleSaveAnnouncement = () => {
    updateAnnouncement({
      title: language === 'ar' ? announcement.title : announcementTitle,
      titleAr: language === 'ar' ? announcementTitle : announcement.titleAr,
      message: language === 'ar' ? announcement.message : announcementText,
      messageAr: language === 'ar' ? announcementText : announcement.messageAr,
    });
    setIsEditingAnnouncement(false);
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.tenantName.toLowerCase().includes(subSearch.toLowerCase()) ||
      sub.tenantNameAr.toLowerCase().includes(subSearch.toLowerCase()) ||
      sub.projectId.toLowerCase().includes(subSearch.toLowerCase()) ||
      sub.planType.toLowerCase().includes(subSearch.toLowerCase());
    const matchesFilter = subFilter === 'all' || sub.status === subFilter;
    return matchesSearch && matchesFilter;
  });

  const exportCsv = () => {
    const headers = ['Tenant Name', 'Project ID', 'Plan Type', 'Discount Code', 'Expiry Date', 'Status'];
    const rows = filteredSubscriptions.map((s) => [
      s.tenantName,
      s.projectId,
      s.planType,
      s.discount,
      s.expiryDate,
      s.status,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexus_subscriptions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(isRTL ? 'تم تصدير ملف الاشتراكات بنجاح' : 'Subscriptions exported to CSV');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white dark:text-white light:text-slate-900">
              {t('super_admin.title')}
            </h1>
            <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/30">
              {t('super_admin.badge')}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-medium">
              {t('super_admin.system_status')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTenantModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>{t('super_admin.add_tenant')}</span>
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition dark:border-slate-800 dark:bg-slate-900/80 light:border-slate-300 light:bg-slate-100 light:text-slate-800"
          >
            <Download className="h-4 w-4" />
            <span>{t('super_admin.export_csv')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (4 Top Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total MRR */}
        <div className="glass-card rounded-2xl p-4 transition-all hover:border-blue-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('super_admin.total_mrr')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900">
              $284,500
            </h3>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400">
              +22%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {isRTL ? 'إجمالي الإيرادات السنوية: ٤.٢ مليون دولار' : '$4.2M Total Platform ARR'}
          </p>
        </div>

        {/* Active Tenants */}
        <div className="glass-card rounded-2xl p-4 transition-all hover:border-blue-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('super_admin.active_tenants')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900">
              1,248
            </h3>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400">
              +14
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {isRTL ? 'عبر ٦ دول ومناطق صحية' : 'Across 6 GCC healthcare zones'}
          </p>
        </div>

        {/* Active Subscriptions */}
        <div className="glass-card rounded-2xl p-4 transition-all hover:border-blue-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('super_admin.active_subscriptions')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold tracking-tight text-white dark:text-white light:text-slate-900">
              1,105
            </h3>
            <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-400">
              98.2%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {isRTL ? 'معدل التجديد والاحتفاظ' : 'Renewal & retention health'}
          </p>
        </div>

        {/* Critical Support */}
        <div className="glass-card rounded-2xl p-4 transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {t('super_admin.critical_support')}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <h3 className="text-2xl font-bold tracking-tight text-amber-400">
              24
            </h3>
            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-amber-300">
              {isRTL ? 'متوسط الرد: ٤ دقائق' : 'Avg 4m SLA'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {isRTL ? '٣ حالات عاجلة تتطلب مراجعة' : '3 urgent cases pending review'}
          </p>
        </div>
      </div>

      {/* Middle Section: System Announcement & Default Discount */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Announcement Box */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Megaphone className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                {t('super_admin.system_announcements')}
              </h3>
            </div>
            <button
              onClick={() => setIsEditingAnnouncement(!isEditingAnnouncement)}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
            >
              {isEditingAnnouncement
                ? isRTL ? 'إلغاء' : 'Cancel'
                : isRTL ? 'تعديل الإعلان' : 'Edit Broadcast'}
            </button>
          </div>

          {isEditingAnnouncement ? (
            <div className="mt-3 space-y-3">
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Announcement Title"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/90 p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveAnnouncement}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
                >
                  {isRTL ? 'حفظ ونشر الإعلان' : 'Broadcast Announcement'}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-start gap-3 rounded-xl bg-slate-900/50 p-3 border border-slate-800/60 dark:bg-slate-900/50 light:bg-slate-50">
              <span className="mt-0.5 flex h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              <div>
                <p className="text-xs font-bold text-white dark:text-white light:text-slate-900">
                  {language === 'ar' ? announcement.titleAr : announcement.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-300 dark:text-slate-300 light:text-slate-600 leading-relaxed">
                  {language === 'ar' ? announcement.messageAr : announcement.message}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Global Discount Settings */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800/80">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Percent className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                {t('super_admin.default_discount')}
              </h3>
            </div>
            <p className="mt-2.5 text-xs text-slate-400">
              {isRTL
                ? 'نسبة الخصم التلقائية المطبقة على عقود المستأجرين الجدد وتجديدات الباقات.'
                : 'Global baseline discount applied to newly provisioned clinic contracts.'}
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {['10%', '15%', '20%', '25%'].map((disc) => (
              <button
                key={disc}
                onClick={() => {
                  setDefaultDiscount(disc);
                  showToast(isRTL ? `تم تعيين الخصم الافتراضي: ${disc}` : `Default discount set to ${disc}`);
                }}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                  defaultDiscount === disc
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {disc}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Bottom Section: Live Chat & Subscriptions Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Live Support & Projects Chat (5 Cols) */}
        <div className="lg:col-span-5 glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden h-[540px]">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 p-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white dark:text-white light:text-slate-900">
                  {t('super_admin.live_support')}
                </h3>
                <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  3 {isRTL ? 'مؤسسون متصلون الآن' : 'Founders Online'}
                </span>
              </div>
            </div>
          </div>

          {/* Chat Thread Selector Bar */}
          <div className="flex gap-2 overflow-x-auto border-b border-slate-800/60 bg-slate-950/40 p-2 text-xs">
            {chats.map((c) => {
              const isSelected = selectedChat ? c.id === selectedChat.id : false;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedChatId(c.id)}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 whitespace-nowrap transition ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-[9px] font-bold text-white">
                    {c.tenant.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium text-xs">{c.tenant}</span>
                </button>
              );
            })}
          </div>

          {/* Active Chat Conversation Feed */}
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <p className="text-xs text-slate-500">
                {isRTL ? 'لا توجد محادثات دعم حتى الآن' : 'No support conversations yet'}
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {/* Sender Info Banner */}
                <div className="flex items-center gap-3 rounded-xl bg-slate-900/60 p-2.5 border border-slate-800/50">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {selectedChat.senderName.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-white truncate">{selectedChat.senderName}</p>
                      <span className="text-[10px] text-slate-400">{selectedChat.projectId}</span>
                    </div>
                    <p className="text-[10px] text-blue-400 truncate">
                      {language === 'ar' ? selectedChat.senderRoleAr : selectedChat.senderRole} • {selectedChat.tenant}
                    </p>
                  </div>
                </div>

                {/* Message Bubbles */}
                {selectedChat.messages.map((msg) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isAdmin ? (isRTL ? 'items-start' : 'items-end') : isRTL ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          isAdmin
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-800/90 text-slate-200 rounded-tl-none border border-slate-700/60'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="mt-1 text-[10px] text-slate-500 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} className="border-t border-slate-800/80 p-3 bg-slate-950/60">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={
                      isRTL
                        ? `رد على ${selectedChat.senderName}...`
                        : `Reply to ${selectedChat.senderName}...`
                    }
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition active:scale-95 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Subscriptions Table (7 Cols) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl border border-slate-800 flex flex-col overflow-hidden h-[540px]">
          {/* Table Header & Search Filter */}
          <div className="p-4 border-b border-slate-800/80 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-bold text-white dark:text-white light:text-slate-900">
              {t('super_admin.subscriptions_mgmt')}
            </h3>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className={`absolute top-2 ${isRTL ? 'right-2.5' : 'left-2.5'} h-3.5 w-3.5 text-slate-400`} />
                <input
                  type="text"
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                  placeholder={isRTL ? 'بحث بالاسم أو المعرف...' : 'Search tenant or ID...'}
                  className={`rounded-lg border border-slate-800 bg-slate-900/90 py-1.5 ${
                    isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'
                  } text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none`}
                />
              </div>

              {/* Status Filter Buttons */}
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value as any)}
                className="rounded-lg border border-slate-800 bg-slate-900/90 px-2 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">{isRTL ? 'جميع الحالات' : 'All Status'}</option>
                <option value="Active">{isRTL ? 'نشط' : 'Active'}</option>
                <option value="Expiring Soon">{isRTL ? 'ينتهي قريباً' : 'Expiring Soon'}</option>
                <option value="Suspended">{isRTL ? 'موقوف' : 'Suspended'}</option>
              </select>
            </div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="sticky top-0 bg-slate-900/90 text-[11px] font-semibold text-slate-400 border-b border-slate-800/80 uppercase tracking-wider backdrop-blur-md">
                <tr>
                  <th className="py-2.5 px-4">{t('common.tenant')}</th>
                  <th className="py-2.5 px-3">{t('common.plan_type')}</th>
                  <th className="py-2.5 px-3">{isRTL ? 'المبلغ' : 'Amount'}</th>
                  <th className="py-2.5 px-3">{t('common.discount')}</th>
                  <th className="py-2.5 px-3">{isRTL ? 'بداية الاشتراك' : 'Started'}</th>
                  <th className="py-2.5 px-3">{t('common.expiry_date')}</th>
                  <th className="py-2.5 px-3">{t('common.status')}</th>
                  <th className="py-2.5 px-4 text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredSubscriptions.map((sub) => {
                  return (
                    <tr key={sub.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4 font-medium text-white">
                        <div>
                          <span>{language === 'ar' ? sub.tenantNameAr : sub.tenantName}</span>
                          <span className="block text-[10px] text-slate-500">{sub.projectId}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-200">{sub.planType}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-emerald-400">{sub.mrr.toLocaleString()} EGP</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {sub.discount}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{sub.startDate}</td>
                      <td className="py-3 px-3 text-slate-400">{sub.expiryDate}</td>
                      <td className="py-3 px-3">
                        {sub.status === 'Active' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            {isRTL ? 'نشط' : 'Active'}
                          </span>
                        )}
                        {sub.status === 'Expiring Soon' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            {isRTL ? 'ينتهي قريباً' : 'Expiring'}
                          </span>
                        )}
                        {sub.status === 'Suspended' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                            {isRTL ? 'موقوف' : 'Suspended'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() =>
                              updateSubscriptionStatus(
                                sub.id,
                                sub.status === 'Active' ? 'Suspended' : 'Active'
                              )
                            }
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                            title={sub.status === 'Active' ? 'Suspend' : 'Activate'}
                          >
                            {sub.status === 'Active' ? (
                              <Ban className="h-3.5 w-3.5 text-red-400" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              const newCode = prompt(
                                isRTL ? 'أدخل كود الخصم الجديد:' : 'Enter new discount code:',
                                sub.discount === '-' ? 'SPECIAL-20' : sub.discount
                              );
                              if (newCode) applyDiscountCode(sub.id, newCode);
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-blue-400"
                            title="Edit Discount Code"
                          >
                            <Percent className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const newAmount = prompt(
                                isRTL ? 'أدخل المبلغ الجديد (جنيه):' : 'Enter new amount (EGP):',
                                String(sub.mrr)
                              );
                              if (newAmount && !isNaN(Number(newAmount))) {
                                updateTenant(sub.id, { mrr: Number(newAmount) });
                              }
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-emerald-400"
                            title={isRTL ? 'تعديل المبلغ' : 'Edit Amount'}
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const name = language === 'ar' ? sub.tenantNameAr : sub.tenantName;
                              const confirmed = window.confirm(
                                isRTL
                                  ? `متأكد إنك عايز تحذف "${name}" نهائيًا؟ هيتمسح كل بياناته (مرضى، حجوزات، فواتير، مخزون) ومش هترجع تاني.`
                                  : `Permanently delete "${name}"? All their data (patients, bookings, invoices, inventory) will be erased and cannot be recovered.`
                              );
                              if (confirmed) deleteTenant(sub.id);
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-red-400"
                            title={isRTL ? 'حذف نهائي' : 'Delete Permanently'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
