import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type NavPage =
  | 'dashboard'
  // Job Cards
  | 'new-jobcard'
  | 'add-member'
  | 'jobcards'
  | 'card-detail'
  // Payments
  | 'payments'
  | 'payments-received'
  | 'payments-outstanding'
  | 'record-payment'
  // Demand
  | 'demand-work'
  | 'demand-pmayg'
  // Party
  | 'party-new'
  | 'parties'
  | 'party-detail'
  // Price
  | 'price-new-jobcard'
  | 'price-add-member'
  | 'price-work-demand'
  | 'price-pmayg'
  // Reports
  | 'monthly-report'
  // Settings
  | 'change-password'
  | 'change-username'
  | 'backup-restore';

export interface RouteState {
  page: NavPage;
  params: Record<string, string>;
}

interface NavigationContextValue {
  currentPage: NavPage;
  params: Record<string, string>;
  navigate: (page: NavPage, params?: Record<string, string>, replace?: boolean) => void;
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

function parseUrlToRoute(): RouteState {
  if (typeof window === 'undefined') return { page: 'dashboard', params: {} };
  const searchParams = new URLSearchParams(window.location.search);
  const page = (searchParams.get('page') as NavPage) || 'dashboard';
  const params: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    if (key !== 'page') params[key] = val;
  });
  return { page, params };
}

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState<RouteState>(() => parseUrlToRoute());

  // Listen to browser Back / Forward events
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseUrlToRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback(
    (page: NavPage, newParams: Record<string, string> = {}, replace = false) => {
      const search = new URLSearchParams();
      search.set('page', page);
      Object.entries(newParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          search.set(k, String(v));
        }
      });

      const queryString = search.toString();
      const newUrl = `${window.location.pathname}?${queryString}`;

      if (replace) {
        window.history.replaceState({ page, params: newParams }, '', newUrl);
      } else {
        window.history.pushState({ page, params: newParams }, '', newUrl);
      }

      setRoute({ page, params: newParams });
      // Scroll to top on navigation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        currentPage: route.page,
        params: route.params,
        navigate,
        goBack,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
};
