import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { logAuditEvent } from './components/audit/AuditLogger';
import Sidebar from './components/Sidebar/Sidebar';
import { ToastProvider } from './components/ui/toast-provider';
import { FilterProvider } from './lib/FilterContext';
import GlobalFilterBar from './components/ui/GlobalFilterBar';



export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);

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

      {/* Premium Sidebar */}
      <Sidebar user={user} onLogout={handleLogout} currentPageName={currentPageName} />

      {/* Main Content */}
      <main className="ml-64 min-h-screen" style={{ background: '#F7F9FC' }}>
        <FilterProvider>
          {currentPageName !== 'MainDashboard' && <GlobalFilterBar />}
          <div className="p-8">
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