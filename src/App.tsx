/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

// Screens
import { SuperAdminView } from './components/screens/SuperAdminView';
import { FounderView } from './components/screens/FounderView';
import { InventoryView } from './components/screens/InventoryView';
import { AccountingView } from './components/screens/AccountingView';
import { PatientsView } from './components/screens/PatientsView';
import { BookingsView } from './components/screens/BookingsView';
import { AssistantView } from './components/screens/AssistantView';
import { ProjectsView } from './components/screens/ProjectsView';
import { ReportsView } from './components/screens/ReportsView';
import { SettingsView, SupportView } from './components/screens/SettingsView';

// Modals
import { CreateInvoiceModal, AddPatientModal } from './components/modals/CreateInvoiceModal';
import { NewBookingModal, AdjustStockModal } from './components/modals/NewBookingModal';
import {
  QrScannerModal,
  TenantSwitcherModal,
  ExportPdfModal,
} from './components/modals/QrScannerModal';

const DashboardContent: React.FC = () => {
  const { screen, toastMessage } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-slate-100 dark:bg-[#0b0f17] dark:text-slate-100 light:bg-slate-50 light:text-slate-900 font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <Header onToggleSidebar={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {screen === 'super_admin' && <SuperAdminView />}
          {screen === 'founder' && <FounderView />}
          {screen === 'inventory' && <InventoryView />}
          {screen === 'accounting' && <AccountingView />}
          {screen === 'patients' && <PatientsView />}
          {screen === 'bookings' && <BookingsView />}
          {screen === 'assistant' && <AssistantView />}
          {screen === 'projects' && <ProjectsView />}
          {screen === 'reports' && <ReportsView />}
          {screen === 'settings' && <SettingsView />}
          {screen === 'support' && <SupportView />}
        </main>

        <MobileBottomNav />
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-blue-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Interactive Global Modals */}
      <CreateInvoiceModal />
      <AddPatientModal />
      <NewBookingModal />
      <AdjustStockModal />
      <QrScannerModal />
      <TenantSwitcherModal />
      <ExportPdfModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}
