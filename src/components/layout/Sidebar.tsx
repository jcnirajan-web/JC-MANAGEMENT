import React, { useState } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  UserPlus,
  ListOrdered,
  Receipt,
  FileCheck,
  AlertTriangle,
  FileSpreadsheet,
  Building,
  Users,
  Tag,
  FileBarChart,
  Settings,
  Key,
  User,
  Database,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useNavigation, NavPage } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: {
    page: NavPage;
    label: string;
    icon: React.ReactNode;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
  isCollapsed,
}) => {
  const { currentPage, navigate } = useNavigation();
  const { logout } = useAuth();

  // Collapsible state for each section
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    jobcards: true,
    payments: true,
    demand: true,
    party: true,
    price: true,
    reports: true,
    settings: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleNavClick = (page: NavPage) => {
    navigate(page);
    onCloseMobile();
  };

  // Structured menu groups matching Section 5 & Section 33 exactly
  const menuGroups: MenuGroup[] = [
    {
      id: 'jobcards',
      label: 'Job Cards',
      icon: <CreditCard className="w-4 h-4 shrink-0 text-blue-400" />,
      items: [
        {
          page: 'new-jobcard',
          label: 'New Job Card',
          icon: <CreditCard className="w-3.5 h-3.5" />,
        },
        {
          page: 'add-member',
          label: 'Add Member',
          icon: <UserPlus className="w-3.5 h-3.5" />,
        },
        {
          page: 'jobcards',
          label: 'Job Cards List',
          icon: <ListOrdered className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'payments',
      label: 'Payments',
      icon: <Receipt className="w-4 h-4 shrink-0 text-emerald-400" />,
      items: [
        {
          page: 'payments',
          label: 'All Payments',
          icon: <Receipt className="w-3.5 h-3.5" />,
        },
        {
          page: 'payments-received',
          label: 'Received',
          icon: <FileCheck className="w-3.5 h-3.5" />,
        },
        {
          page: 'payments-outstanding',
          label: 'Outstanding',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'demand',
      label: 'Demand',
      icon: <FileSpreadsheet className="w-4 h-4 shrink-0 text-amber-400" />,
      items: [
        {
          page: 'demand-work',
          label: 'Work Demand',
          icon: <FileSpreadsheet className="w-3.5 h-3.5" />,
        },
        {
          page: 'demand-pmayg',
          label: 'PMAY-G Demand',
          icon: <Building className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'party',
      label: 'Party',
      icon: <Users className="w-4 h-4 shrink-0 text-indigo-400" />,
      items: [
        {
          page: 'party-new',
          label: 'Add New Party',
          icon: <UserPlus className="w-3.5 h-3.5" />,
        },
        {
          page: 'parties',
          label: 'Party List',
          icon: <Users className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'price',
      label: 'Price',
      icon: <Tag className="w-4 h-4 shrink-0 text-violet-400" />,
      items: [
        {
          page: 'price-new-jobcard',
          label: 'New Job Card',
          icon: <Tag className="w-3.5 h-3.5" />,
        },
        {
          page: 'price-add-member',
          label: 'Add Member',
          icon: <Tag className="w-3.5 h-3.5" />,
        },
        {
          page: 'price-work-demand',
          label: 'Work Demand',
          icon: <Tag className="w-3.5 h-3.5" />,
        },
        {
          page: 'price-pmayg',
          label: 'PMAY-G',
          icon: <Tag className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileBarChart className="w-4 h-4 shrink-0 text-rose-400" />,
      items: [
        {
          page: 'monthly-report',
          label: 'Monthly Report',
          icon: <FileBarChart className="w-3.5 h-3.5" />,
        },
      ],
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4 shrink-0 text-slate-400" />,
      items: [
        {
          page: 'change-password',
          label: 'Change Password',
          icon: <Key className="w-3.5 h-3.5" />,
        },
        {
          page: 'change-username',
          label: 'Change Username',
          icon: <User className="w-3.5 h-3.5" />,
        },
        {
          page: 'backup-restore',
          label: 'Backup & Restore',
          icon: <Database className="w-3.5 h-3.5" />,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-200 select-none">
      {/* Top Section */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800/80">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Portal
          </div>
          <div className="text-sm font-extrabold text-white mt-0.5">Main Menu</div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg md:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 px-3 py-3 space-y-2 overflow-y-auto">
        {/* 1. Dashboard Link */}
        <button
          onClick={() => handleNavClick('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition ${
            currentPage === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-blue-400" />
          <span>Dashboard</span>
        </button>

        {/* 2. Collapsible Menu Groups */}
        {menuGroups.map((group) => {
          const isOpen = !!openGroups[group.id];
          const hasActiveChild = group.items.some((item) => item.page === currentPage);

          return (
            <div key={group.id} className="pt-1">
              <button
                onClick={() => toggleGroup(group.id)}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  hasActiveChild ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {group.icon}
                  <span className="tracking-wide uppercase text-[11px] font-bold">{group.label}</span>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {isOpen && (
                <div className="mt-1 ml-3 pl-2.5 border-l border-slate-800 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = currentPage === item.page;
                    return (
                      <button
                        key={item.page}
                        onClick={() => handleNavClick(item.page)}
                        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Logout Action at Bottom */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
