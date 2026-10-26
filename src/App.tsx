/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DialogHost } from './lib/dialog';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { Header } from './components/layout/Header';
import { FreePeriodBanner } from './components/layout/FreePeriodBanner';
import { ReferralPromptStep } from './components/screens/ReferralParts';
import { SubscriptionBanner } from './components/layout/SubscriptionBanner';
import { AnnouncementBanner } from './components/layout/AnnouncementBanner';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { Skeleton, SkeletonList } from './components/ui/Skeleton';
import { OnboardingTour } from './components/layout/OnboardingTour';
import { ViewAsBanner } from './components/layout/ViewAsBanner';
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
import { SystemCatalogView } from './components/screens/SystemCatalogView';
import { AssistantsView } from './components/screens/AssistantsView';
import { ProjectSettingsView } from './components/screens/ProjectSettingsView';
import { PlatformSettingsView } from './components/screens/PlatformSettingsView';
import { SystemCatalogAdminView } from './components/screens/SystemCatalogAdminView';

// Modals
import { CreateInvoiceModal, AddPatientModal } from './components/modals/CreateInvoiceModal';
import { NewBookingModal, AdjustStockModal } from './components/modals/NewBookingModal';
import {
  QrScannerModal,
  TenantSwitcherModal,
  ExportPdfModal,
} from './components/modals/QrScannerModal';

import type { ScreenId } from './types';
import { NurseryRoot } from './components/nursery/NurseryRoot';
import { NURSERY_SCREENS, screensFor } from './lib/screenAccess';

const DashboardContent: React.FC = () => {
  const { screen, toastMessage, tenants, tenantsLoaded, referral, referralLoaded, systemKey } = useApp();
  const { profile, allowedScreens } = useAuth();
  const canSee = (id: string) => allowed.includes(id as ScreenId);
  const allowed = screensFor(profile?.roleCode, systemKey, allowedScreens);
  const isNursery = systemKey === 'nursery' && profile?.roleCode !== 'super_admin';
  const nurseryActive = isNursery && NURSERY_SCREENS.includes(screen) && canSee(screen);

  if (profile?.roleCode === 'founder' && tenantsLoaded && tenants.length === 0) {
    if (!referralLoaded) return null;
    if (referral && !referral.promptDone && !referral.redeemed) return <ReferralPromptStep />;
    return <SystemCatalogView />;
  }

  if (profile?.roleCode === 'founder' && !tenantsLoaded) {
    return (
      <div className="min-h-screen bg-[#0b0f17] p-6">
        <div className="mx-auto max-w-3xl space-y-3 pt-10">
          <Skeleton className="h-8 w-40" />
          <SkeletonList rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f17] text-slate-100 dark:bg-[#0b0f17] dark:text-slate-100 light:bg-[#dcedf0] light:text-[#0f172a] font-sans transition-colors duration-200">
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        <ViewAsBanner />
        <OfflineBanner />
        <Header />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
          <SubscriptionBanner />
          <AnnouncementBanner />
          <FreePeriodBanner />
          {nurseryActive && <NurseryRoot />}
          {screen === 'super_admin' && canSee('super_admin') && <SuperAdminView />}
          {!isNursery && screen === 'founder' && canSee('founder') && <FounderView />}
          {!isNursery && screen === 'inventory' && canSee('inventory') && <InventoryView />}
          {!isNursery && screen === 'accounting' && canSee('accounting') && <AccountingView />}
          {!isNursery && screen === 'patients' && canSee('patients') && <PatientsView />}
          {!isNursery && screen === 'bookings' && canSee('bookings') && <BookingsView />}
          {!isNursery && screen === 'assistant' && canSee('assistant') && <AssistantView />}
          {!isNursery && screen === 'projects' && canSee('projects') && <ProjectsView />}
          {!isNursery && screen === 'reports' && canSee('reports') && <ReportsView />}
          {screen === 'settings' && canSee('settings') && <SettingsView />}
          {screen === 'support' && canSee('support') && <SupportView />}
          {screen === 'catalog' && canSee('catalog') && <SystemCatalogAdminView />}
          {screen === 'platform' && canSee('platform') && <PlatformSettingsView />}
          {screen === 'project_settings' && canSee('project_settings') && <ProjectSettingsView />}
          {screen === 'assistants' && canSee('assistants') && <AssistantsView />}
        </main>

        <MobileBottomNav />
      </div>

      <DialogHost />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-blue-500/40 bg-slate-900/95 px-4 py-3 text-xs font-semibold text-white shadow-2xl backdrop-blur-xl animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Interactive Global Modals */}
      <CreateInvoiceModal />
      <OnboardingTour />
      <AddPatientModal />
      <NewBookingModal />
      <AdjustStockModal />
      <QrScannerModal />
      <TenantSwitcherModal />
      <ExportPdfModal />
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] text-slate-400 text-xs">
        Loading...
      </div>
    );
  }

  if (!session) return <AuthScreen />;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17] text-slate-100 px-4">
        <div className="max-w-sm text-center space-y-3">
          <p className="text-sm font-semibold text-red-400">Account setup issue</p>
          <p className="text-xs text-slate-400">
            Your account is missing a valid role assignment. Please contact the administrator, or check the
            <code className="mx-1 rounded bg-slate-800 px-1">users.role_id</code>
            column in the database.
          </p>
          <button
            onClick={() => signOut()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
