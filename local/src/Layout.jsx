import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { logAuditEvent } from './components/audit/AuditLogger';
import Sidebar from './components/Sidebar/Sidebar';
import { ToastProvider } from './components/ui/toast-provider';
import { FilterProvider } from './lib/FilterContext';
import GlobalFilterBar from './components/ui/GlobalFilterBar';



export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // Close the drawer after navigating, and on Escape.
  useEffect(() => setNavOpen(false), [location.pathname]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setNavOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const initUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Log first access / login
        await logAuditEvent({
          actionType: 'Login',
          entity: 'User',
          recordId: currentUser.id,
          remarks: `User ${currentUser.email} accessed the system`
        });
      } catch (error) {
        // Redirect to login if not authenticated
        base44.auth.redirectToLogin();
      }
    };
    initUser();
  }, []);

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <ToastProvider />
      <div className="min-h-screen" style={{ background: '#F7F9FC', fontFamily: "'Public Sans', system-ui, -apple-system, sans-serif" }}>
        <style>{`
          .scrollbar-thin {
            scrollbar-width: thin;
            scrollbar-color: #d1d5db transparent;
          }
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 3px;
          }
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
          .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
            background: #d1d5db;
          }
        `}</style>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>

      {navOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setNavOpen(false)} aria-hidden="true" />
      )}

      <Sidebar user={user} onLogout={handleLogout} currentPageName={currentPageName} open={navOpen} />

      {/* Main Content */}
      <main id="main-content" tabIndex={-1} className="min-h-screen lg:ml-64" style={{ background: '#F7F9FC' }}>
        <div className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-semibold text-[#1E3A5F]">DQAMP 2026</span>
        </div>
        <FilterProvider>
          {currentPageName !== 'MainDashboard' && <GlobalFilterBar />}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </FilterProvider>
      </main>
      </div>
    </>
  );
}