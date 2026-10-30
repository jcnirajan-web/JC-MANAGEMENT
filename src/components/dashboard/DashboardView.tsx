import React, { useMemo } from 'react';
import {
  CreditCard,
  UserPlus,
  ListOrdered,
  Receipt,
  AlertTriangle,
  FileSpreadsheet,
  Building,
  Users,
  FileBarChart,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useNavigation, NavPage } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const DashboardView: React.FC = () => {
  const { navigate } = useNavigation();
  const { currentUser } = useAuth();
  const { jobCards, parties, payments, getPartySummary } = useData();

  // Summary Metrics Calculation
  const activeJobCardsCount = useMemo(() => {
    return jobCards.filter((c) => c.status !== 'Rejected').length;
  }, [jobCards]);

  const newCardsCount = useMemo(() => {
    return jobCards.filter((c) => c.serviceType === 'New Job Card').length;
  }, [jobCards]);

  const memberAddCount = useMemo(() => {
    return jobCards.filter((c) => c.serviceType === 'Member Add').length;
  }, [jobCards]);

  const pendingCardsCount = useMemo(() => {
    return jobCards.filter((c) => c.status === 'Pending' || c.status === 'In Process').length;
  }, [jobCards]);

  const totalOutstanding = useMemo(() => {
    const totalBilled = jobCards.reduce((sum, c) => sum + c.billAmount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, totalBilled - totalPaid);
  }, [jobCards, payments]);

  const partiesWithDueCount = useMemo(() => {
    return parties.filter((p) => getPartySummary(p.partyId).outstanding > 0).length;
  }, [parties, getPartySummary]);

  const totalPartiesCount = parties.length;
  const activePartiesCount = useMemo(() => {
    return parties.filter((p) => p.status === 'Active').length;
  }, [parties]);

  const recentParties = useMemo(() => {
    return [...parties].slice(0, 3);
  }, [parties]);

  // The 11 exact Quick Links required by Section 6
  const quickLinks: {
    title: string;
    description: string;
    page: NavPage;
    params?: Record<string, string>;
    icon: React.ReactNode;
    colorClasses: {
      border: string;
      hoverBg: string;
      iconBg: string;
      iconColor: string;
    };
  }[] = [
    {
      title: 'New Job Card',
      description: 'Register a new Job Card application or bulk import entries',
      page: 'new-jobcard',
      icon: <CreditCard className="w-5 h-5" />,
      colorClasses: {
        border: 'hover:border-blue-300',
        hoverBg: 'hover:bg-blue-50/50',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
      },
    },
    {
      title: 'Add Member',
      description: 'Add family member to existing Job Card with automated billing',
      page: 'add-member',
      icon: <UserPlus className="w-5 h-5" />,
      colorClasses: {
        border: 'hover:border-indigo-300',
        hoverBg: 'hover:bg-indigo-50/50',
        iconBg: 'bg-indigo-100',
        iconColor: 'text-indigo-600',
      },
    },
    {
      title: 'Job Cards List',
      description: 'Search, filter by party/status/date, and download filtered PDF',
      page: 'jobcards',
      icon: <ListOrdered className="w-5 h-5" />,
      colorClasses: {
        border: 'hover:border-slate-300',
        hoverBg: 'hover:bg-slate-50',
        iconBg: 'bg-slate-100',
        iconColor: 'text-slate-700',
      },
    },
    {
      title: 'Record Payment',
      description: 'Record party collections with chronological FIFO card allocation',
      page: 'record-payment',
      icon: <Receipt className="w-5 h-5" />,
      colorClasses: {
        border: 'hover:border-emerald-300',
        hoverBg: 'hover:bg-emerald-50/50',
        iconBg: 'bg-emerald-100',
        iconColor: 'text-emerald-600',
      },
    },
    {
      title: 'All Payments',
      description: 'Complete payments ledger, total billed, received and outstanding',
      page: 'payments',
      icon: <Receipt className="w-5 h-5" />,
      colorClasses: {
        border: 'hover:border-teal-300',
        hoverBg: 'hover:bg-teal-50/50',
        iconBg: 'bg-teal-100',
        iconColor: 'text-teal-600',
      },
    },
    {
      title: 'Outstanding',
      description: 'View pending balances by party and download Outstanding Statement PDF',
      page: 'payments-outstanding',
      icon: <AlertTriangle className="w-5 h-5" />,
      colorClasses: {
        border: 'hover:border-amber-300',
        hoverBg: 'hover:bg-amber-50/50',
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
      },
    },
    {
      title: 'Work Demand',
      description: 'Track and manage Work Demand amounts submitted by parties',
      page: 'demand-work',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      colorClasses: {
        border: 'hover:border-orange-300',
        hoverBg: 'hover:bg-orange-50/50',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
      },
    },
    {
      title: 'PMAY-G Demand',
      description: 'Record and track PMAY-G demand entries and download reports',
      page: 'demand-pmayg',
      icon: <Building className="w-5 h-5" />,
      colorClasses: {
        border: 'hover:border-cyan-300',
        hoverBg: 'hover:bg-cyan-50/50',
        iconBg: 'bg-cyan-100',
        iconColor: 'text-cyan-600',
      },
    },
    {
      title: 'Add New Party',
      description: 'Register a new customer or Digital Seva Kendra partner',
      page: 'party-new',
      icon: <UserPlus className="w-5 h-5" />,
      colorClasses: {
        border: 'hover:border-purple-300',
        hoverBg: 'hover:bg-purple-50/50',
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
      },
    },
    {
      title: 'Party List',
      description: 'View party directories, accounts, card histories, and hisab',
      page: 'parties',
      icon: <Users className="w-5 h-5" />,
      colorClasses: {
        border: 'hover:border-violet-300',
        hoverBg: 'hover:bg-violet-50/50',
        iconBg: 'bg-violet-100',
        iconColor: 'text-violet-600',
      },
    },
    {
      title: 'Monthly Report',
      description: 'Generate month-wise business summaries and official PDF reports',
      page: 'monthly-report',
      icon: <FileBarChart className="w-5 h-5" />,
      colorClasses: {
        border: 'hover:border-rose-300',
        hoverBg: 'hover:bg-rose-50/50',
        iconBg: 'bg-rose-100',
        iconColor: 'text-rose-600',
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Professional Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Job Card Operations Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {currentUser?.name || 'Administrator'}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Manage your Parties, Job Card registrations, Member Add entries, Collections,
            Demand records, and Monthly Reports efficiently.
          </p>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* 2. Summary Overview Cards Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              SYSTEM OVERVIEW &amp; METRICS
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time snapshot of active applications, outstanding dues, and party master records
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live System State
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Summary Card 1: Total Active Job Cards */}
          <div
            onClick={() => navigate('jobcards')}
            className="group relative bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Total Active Job Cards
                </span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {activeJobCardsCount}
                </div>
                <div className="flex items-center gap-2 mt-1.5 text-xs">
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {newCardsCount} New
                  </span>
                  <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {memberAddCount} Member Add
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-blue-600 font-semibold transition">
              <span>{pendingCardsCount} pending processing</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Summary Card 2: Pending Payments / Outstanding */}
          <div
            onClick={() => navigate('payments-outstanding')}
            className="group relative bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Pending Payments
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-extrabold text-amber-700 tracking-tight">
                  ₹{totalOutstanding.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Outstanding balance across {partiesWithDueCount} {partiesWithDueCount === 1 ? 'party' : 'parties'}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-amber-700 font-semibold transition">
              <span>View outstanding ledger</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Summary Card 3: Recent Party Registrations */}
          <div
            onClick={() => navigate('parties')}
            className="group relative bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Recent Party Registrations
                </span>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div>
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {totalPartiesCount}
                </div>
                <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activePartiesCount} Active
                  </span>
                  <span className="text-slate-600 font-medium">
                    Registered Parties
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 group-hover:text-purple-600 font-semibold transition">
              <span>Manage party master</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Recent Parties Highlights Widget */}
        {recentParties.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                Latest Registered Parties &amp; Dues
              </span>
              <button
                onClick={() => navigate('parties')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View All Master Records</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recentParties.map((party) => {
                const summary = getPartySummary(party.partyId);
                return (
                  <div
                    key={party.partyId}
                    onClick={() => navigate('party-detail', { partyId: party.partyId })}
                    className="p-3 rounded-lg bg-slate-50 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-200 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                          {party.partyId}
                        </span>
                        <span className="font-bold text-xs text-slate-900 truncate group-hover:text-purple-700 transition">
                          {party.partyName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {party.mobile ? `Ph: ${party.mobile}` : 'No phone'} &bull; {summary.totalCards} cards
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {summary.outstanding > 0 ? (
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          Due: ₹{summary.outstanding.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Clear
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Quick Links Section (Section 6) */}
      <div className="space-y-3">
        <div className="border-b border-slate-200 pb-2">
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
            QUICK LINKS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Direct access to primary management workflows and transaction modules
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <button
              key={link.title}
              onClick={() => navigate(link.page, link.params)}
              className={`group text-left p-4 rounded-xl bg-white border border-slate-200 shadow-xs transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${link.colorClasses.border} ${link.colorClasses.hoverBg}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${link.colorClasses.iconBg} ${link.colorClasses.iconColor} shadow-inner`}>
                    {link.icon}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
                    {link.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-snug line-clamp-2">
                    {link.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-1 text-[11px] font-semibold text-slate-600 group-hover:text-blue-600 transition">
                <span>Open module</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

