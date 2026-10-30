import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { InactivityModal } from './components/auth/InactivityModal';
import { LoginPage } from './components/auth/LoginPage';

// Module Views
import { DashboardView } from './components/dashboard/DashboardView';
import { NewJobCardView } from './components/jobcards/NewJobCardView';
import { AddMemberView } from './components/jobcards/AddMemberView';
import { JobCardList } from './components/jobcards/JobCardList';
import { AllPaymentsView } from './components/payments/AllPaymentsView';
import { ReceivedPaymentsView } from './components/payments/ReceivedPaymentsView';
import { OutstandingPaymentsView } from './components/payments/OutstandingPaymentsView';
import { RecordPaymentView } from './components/payments/RecordPaymentView';
import { WorkDemandView } from './components/demand/WorkDemandView';
import { PmaygDemandView } from './components/demand/PmaygDemandView';
import { AddNewPartyView } from './components/parties/AddNewPartyView';
import { PartyList } from './components/parties/PartyList';
import { PartyProfile } from './components/parties/PartyProfile';
import { PriceManagementView } from './components/price/PriceManagementView';
import { MonthlyReportView } from './components/reports/MonthlyReportView';
import { ChangePasswordView } from './components/settings/ChangePasswordView';
import { ChangeUsernameView } from './components/settings/ChangeUsernameView';
import { BackupRestoreView } from './components/settings/BackupRestoreView';

const MainAppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { currentPage } = useNavigation();

  const [isOpenMobile, setIsOpenMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Unauthenticated users cannot access internal application routes
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Active page renderer supporting full browser back/forward navigation (Requirement #30)
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardView />;

      // Job Cards
      case 'new-jobcard':
        return <NewJobCardView />;
      case 'add-member':
        return <AddMemberView />;
      case 'jobcards':
        return <JobCardList />;

      // Payments
      case 'payments':
        return <AllPaymentsView />;
      case 'payments-received':
        return <ReceivedPaymentsView />;
      case 'payments-outstanding':
        return <OutstandingPaymentsView />;
      case 'record-payment':
        return <RecordPaymentView />;

      // Demand
      case 'demand-work':
        return <WorkDemandView />;
      case 'demand-pmayg':
        return <PmaygDemandView />;

      // Party
      case 'party-new':
        return <AddNewPartyView />;
      case 'parties':
        return <PartyList />;
      case 'party-detail':
        return <PartyProfile />;

      // Price Management
      case 'price-new-jobcard':
        return <PriceManagementView category="New Job Card" />;
      case 'price-add-member':
        return <PriceManagementView category="Add Member" />;
      case 'price-work-demand':
        return <PriceManagementView category="Work Demand" />;
      case 'price-pmayg':
        return <PriceManagementView category="PMAY-G" />;

      // Reports
      case 'monthly-report':
        return <MonthlyReportView />;

      // Settings
      case 'change-password':
        return <ChangePasswordView />;
      case 'change-username':
        return <ChangeUsernameView />;
      case 'backup-restore':
        return <BackupRestoreView />;

      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans antialiased">
      {/* Top Header */}
      <Header onToggleSidebar={() => setIsOpenMobile((prev) => !prev)} />

      {/* Body Area with Sidebar and Main View */}
      <div className="flex-1 flex w-full">
        <Sidebar
          isOpenMobile={isOpenMobile}
          onCloseMobile={() => setIsOpenMobile(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Global Footer on every authenticated page */}
      <Footer />

      {/* Session Security Inactivity Supervisor (Requirement #31) */}
      <InactivityModal />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DataProvider>
          <NavigationProvider>
            <MainAppContent />
          </NavigationProvider>
        </DataProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
