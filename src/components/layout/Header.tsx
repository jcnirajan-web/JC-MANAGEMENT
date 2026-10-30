import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  RotateCw,
  LogOut,
  Menu,
  CloudCheck,
  ChevronRight,
  Database,
  Search,
  X,
  CreditCard,
  Building2,
  Phone,
  ArrowRight,
  Command,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNavigation, NavPage } from '../../context/NavigationContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { currentUser, logout, isGoogleConnected } = useAuth();
  const {
    jobCards,
    parties,
    lastSyncedTime,
    isSyncing,
    refreshData,
    settings,
    connectOrCreateGoogleSpreadsheet,
    getPartySummary,
    getCardFinancials,
  } = useData();
  const { currentPage, navigate } = useNavigation();

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Mobile search expand
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut (Ctrl+K / Cmd+K) listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setIsDropdownOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      } else if (e.key === 'Escape') {
        setIsDropdownOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to dismiss search results dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter matching Parties and Job Cards dynamically
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return { matchedParties: [], matchedCards: [], totalPartiesCount: 0, totalCardsCount: 0 };
    }

    const matchedParties = parties.filter(
      (p) =>
        p.partyId.toLowerCase().includes(q) ||
        p.partyName.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        p.address.toLowerCase().includes(q)
    );

    const matchedCards = jobCards.filter(
      (c) =>
        c.jobCardNo.toLowerCase().includes(q) ||
        c.applicantName.toLowerCase().includes(q) ||
        c.aadhaarNo.includes(q) ||
        c.transactionId.toLowerCase().includes(q) ||
        (c.partyName || '').toLowerCase().includes(q)
    );

    return {
      matchedParties: matchedParties.slice(0, 5),
      matchedCards: matchedCards.slice(0, 5),
      totalPartiesCount: matchedParties.length,
      totalCardsCount: matchedCards.length,
    };
  }, [searchQuery, parties, jobCards]);

  const hasResults =
    searchResults.matchedParties.length > 0 || searchResults.matchedCards.length > 0;

  const handleSelectParty = (partyId: string) => {
    setIsDropdownOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate('party-detail', { partyId });
  };

  const handleSelectCard = (cardNo: string) => {
    setIsDropdownOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate('jobcards', { search: cardNo });
  };

  const handleViewAllCards = () => {
    setIsDropdownOpen(false);
    setIsSearchOpen(false);
    navigate('jobcards', { search: searchQuery.trim() });
    setSearchQuery('');
  };

  const handleViewAllParties = () => {
    setIsDropdownOpen(false);
    setIsSearchOpen(false);
    navigate('parties', { search: searchQuery.trim() });
    setSearchQuery('');
  };

  const handleKeyDownSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (searchResults.matchedCards.length > 0) {
        handleSelectCard(searchResults.matchedCards[0].jobCardNo);
      } else if (searchResults.matchedParties.length > 0) {
        handleSelectParty(searchResults.matchedParties[0].partyId);
      } else {
        handleViewAllCards();
      }
    }
  };

  const getPageTitle = (page: NavPage): string => {
    switch (page) {
      case 'dashboard':
        return 'Dashboard';
      case 'new-jobcard':
        return 'New Job Card';
      case 'add-member':
        return 'Add Member';
      case 'jobcards':
        return 'Job Cards List';
      case 'payments':
        return 'All Payments';
      case 'payments-received':
        return 'Received Payments';
      case 'payments-outstanding':
        return 'Outstanding Payments';
      case 'record-payment':
        return 'Record Payment';
      case 'demand-work':
        return 'Work Demand';
      case 'demand-pmayg':
        return 'PMAY-G Demand';
      case 'party-new':
        return 'Add New Party';
      case 'parties':
        return 'Party List';
      case 'party-detail':
        return 'Party Profile';
      case 'price-new-jobcard':
        return 'Price: New Job Card';
      case 'price-add-member':
        return 'Price: Add Member';
      case 'price-work-demand':
        return 'Price: Work Demand';
      case 'price-pmayg':
        return 'Price: PMAY-G';
      case 'monthly-report':
        return 'Monthly Report';
      case 'change-password':
        return 'Change Password';
      case 'change-username':
        return 'Change Username';
      case 'backup-restore':
        return 'Backup & Restore';
      default:
        return 'Job Card Management System';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-3 sm:px-4 md:px-6 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-sm gap-2 sm:gap-4">
      {/* Left side: Hamburger (mobile) + Logo & Breadcrumb */}
      <div className={`flex items-center gap-2 sm:gap-3 shrink-0 ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg md:hidden hover:bg-slate-800 transition cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('dashboard')}>
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white font-bold shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div className="hidden lg:block">
            <div className="text-sm font-bold tracking-tight text-white leading-none">
              {settings.applicationName}
            </div>
            <div className="text-[11px] text-slate-400 leading-none mt-1">
              Pragati Digital Seva Portal
            </div>
          </div>
        </div>

        {/* Breadcrumb separator */}
        <div className="hidden xl:flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-700/60 text-xs text-slate-400">
          <span
            onClick={() => navigate('dashboard')}
            className="hover:text-blue-400 cursor-pointer transition"
          >
            Portal
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-semibold text-slate-200">{getPageTitle(currentPage)}</span>
        </div>
      </div>

      {/* Middle: Global Search Bar Component */}
      <div
        ref={searchContainerRef}
        className={`relative flex-1 max-w-xl transition-all ${
          isSearchOpen ? 'flex w-full z-40' : 'hidden md:flex'
        }`}
      >
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-slate-400" />
          </div>

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onKeyDown={handleKeyDownSearch}
            placeholder="Search Job Cards, Applicant Names, Aadhaar, Party ID or Name..."
            className="w-full pl-9 pr-20 py-2 text-xs sm:text-sm bg-slate-800/90 border border-slate-700/90 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-inner"
          />

          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700/60 transition cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-medium text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/80">
                <Command className="w-2.5 h-2.5" />K
              </span>
            )}

            {isSearchOpen && (
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setIsDropdownOpen(false);
                }}
                className="md:hidden p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Results Dropdown Overlay */}
        {isDropdownOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl z-50 overflow-hidden text-slate-100 divide-y divide-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Job Cards Category */}
            {searchResults.matchedCards.length > 0 && (
              <div className="p-2 space-y-1">
                <div className="px-2.5 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <CreditCard className="w-3.5 h-3.5" />
                    Job Cards ({searchResults.totalCardsCount})
                  </span>
                  {searchResults.totalCardsCount > 5 && (
                    <button
                      onClick={handleViewAllCards}
                      className="text-blue-400 hover:underline hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      View All {searchResults.totalCardsCount} &rarr;
                    </button>
                  )}
                </div>

                <div className="space-y-0.5">
                  {searchResults.matchedCards.map((card) => {
                    const fin = getCardFinancials(card);
                    return (
                      <div
                        key={card.transactionId}
                        onClick={() => handleSelectCard(card.jobCardNo)}
                        className="px-3 py-2 rounded-lg hover:bg-slate-800/90 cursor-pointer transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs text-blue-300 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800/60">
                              {card.jobCardNo}
                            </span>
                            <span className="font-semibold text-sm text-slate-100 group-hover:text-blue-300 transition truncate">
                              {card.applicantName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                card.serviceType === 'New Job Card'
                                  ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                                  : 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50'
                              }`}
                            >
                              {card.serviceType}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span>Party: {card.partyName || card.partyId}</span>
                            <span>Aadhaar: {card.aadhaarNo ? `...${card.aadhaarNo.slice(-4)}` : 'N/A'}</span>
                            <span
                              className={`text-[10px] font-semibold px-1.5 rounded ${
                                card.status === 'Completed'
                                  ? 'text-emerald-400 bg-emerald-950/60'
                                  : 'text-amber-400 bg-amber-950/60'
                              }`}
                            >
                              {card.status}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-slate-200">
                            ₹{fin.billAmount.toLocaleString('en-IN')}
                          </div>
                          {fin.outstanding > 0 ? (
                            <div className="text-[10px] font-bold text-red-400">
                              Due: ₹{fin.outstanding.toLocaleString('en-IN')}
                            </div>
                          ) : (
                            <div className="text-[10px] font-semibold text-emerald-400">
                              Paid
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Parties Category */}
            {searchResults.matchedParties.length > 0 && (
              <div className="p-2 space-y-1">
                <div className="px-2.5 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Building2 className="w-3.5 h-3.5" />
                    Party Master / Agencies ({searchResults.totalPartiesCount})
                  </span>
                  {searchResults.totalPartiesCount > 5 && (
                    <button
                      onClick={handleViewAllParties}
                      className="text-emerald-400 hover:underline hover:text-emerald-300 font-semibold cursor-pointer"
                    >
                      View All {searchResults.totalPartiesCount} &rarr;
                    </button>
                  )}
                </div>

                <div className="space-y-0.5">
                  {searchResults.matchedParties.map((party) => {
                    const partySum = getPartySummary(party.partyId);
                    return (
                      <div
                        key={party.partyId}
                        onClick={() => handleSelectParty(party.partyId)}
                        className="px-3 py-2 rounded-lg hover:bg-slate-800/90 cursor-pointer transition flex items-center justify-between gap-3 group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
                              {party.partyId}
                            </span>
                            <span className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition truncate">
                              {party.partyName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                party.status === 'Active'
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {party.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            {party.mobile && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-500" />
                                {party.mobile}
                              </span>
                            )}
                            <span>{partySum.totalCards} Total Cards</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {partySum.outstanding > 0 ? (
                            <div className="text-xs font-extrabold text-red-400 bg-red-950/60 px-2 py-0.5 rounded border border-red-800/60">
                              Due: ₹{partySum.outstanding.toLocaleString('en-IN')}
                            </div>
                          ) : (
                            <div className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                              Clear Balance
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty Search Results State */}
            {!hasResults && (
              <div className="p-6 text-center text-slate-400 space-y-1">
                <Search className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-200">
                  No job cards or party profiles match "{searchQuery}"
                </p>
                <p className="text-[11px] text-slate-500">
                  Try searching by Applicant Name, Card No. (e.g., MH-04...), Party Name, or Phone Number
                </p>
              </div>
            )}

            {/* Footer search shortcuts */}
            {hasResults && (
              <div className="p-2 bg-slate-950/70 flex items-center justify-between text-xs text-slate-400 px-3">
                <button
                  onClick={handleViewAllCards}
                  className="hover:text-blue-400 font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>See all in Job Cards list</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleViewAllParties}
                  className="hover:text-emerald-400 font-semibold flex items-center gap-1 transition cursor-pointer"
                >
                  <span>See all in Party Master list</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Mobile Search Toggle Button + Sync Status + User Profile + Logout */}
      <div className={`flex items-center gap-2 sm:gap-4 shrink-0 ${isSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
        {/* Mobile Search Toggle Icon */}
        <button
          onClick={() => {
            setIsSearchOpen(true);
            setIsDropdownOpen(true);
            setTimeout(() => {
              searchInputRef.current?.focus();
            }, 50);
          }}
          className="p-2 text-slate-400 hover:text-white rounded-lg md:hidden hover:bg-slate-800 transition cursor-pointer"
          title="Search Job Cards or Parties"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Google Sheets Sync Indicator (Requirement #27) */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-800/80 border border-slate-700/70 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
              }`}
            />
            <span className="hidden lg:inline text-slate-400">Last synced:</span>
            <span className="font-mono text-slate-200 text-xs">{lastSyncedTime}</span>
          </div>

          <button
            onClick={() => refreshData()}
            disabled={isSyncing}
            title="Fetch latest updates from Google Sheets"
            className="p-1 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded transition disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {isGoogleConnected ? (
            <span
              title="Connected to Google Workspace (JOB_CARD_SYSTEM_DB)"
              className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60"
            >
              <CloudCheck className="w-3.5 h-3.5" />
              Sheets Live
            </span>
          ) : (
            <button
              onClick={() => connectOrCreateGoogleSpreadsheet()}
              title="Connect Google Workspace to enable direct Google Sheets and Drive synchronization"
              className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/60 transition cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              Link Sheets
            </button>
          )}
        </div>

        {/* User Profile & Role */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-white leading-tight">
              {currentUser?.name || 'Administrator'}
            </span>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-900/60 text-blue-300 border border-blue-700/60 uppercase tracking-wide">
                {currentUser?.role || 'Admin'}
              </span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-200 font-bold border border-slate-600 text-xs shadow-inner">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
          </div>

          {/* Logout Button */}
          <button
            onClick={() => logout()}
            title="Logout from session"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

