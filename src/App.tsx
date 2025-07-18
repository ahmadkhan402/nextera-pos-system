import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/SupabaseAppContext';
import { LoginPage } from './components/auth/LoginPage';
import { Header } from './components/layout/Header';
import { POSTerminal } from './components/pos/POSTerminal';
import { TransactionsManager } from './components/transactions/TransactionsManager';
import { InventoryManager } from './components/inventory/InventoryManager';
import { CustomerManager } from './components/customers/CustomerManager';
import { ReportsManager } from './components/reports/ReportsManager';
import { Settings } from './components/settings/Settings';
import { DiscountManager } from './components/discounts/DiscountManager';
import { UserManager } from './components/users/UserManager';

function AppContent() {
  const { user, loading } = useAuth();
  const { state } = useApp();
  const [currentView, setCurrentView] = useState('pos');

  // Show loading spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login page if no user is authenticated
  if (!user || !state.currentUser) {
    return <LoginPage />;
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'pos':
        return <POSTerminal />;
      case 'transactions':
        return <TransactionsManager />;
      case 'inventory':
        return <InventoryManager />;
      case 'customers':
        return <CustomerManager />;
      case 'reports':
        return <ReportsManager />;
      case 'discounts':
        return <DiscountManager />;
      case 'users':
        return <UserManager />;
      case 'settings':
        return <Settings />;
      default:
        return <POSTerminal />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-hidden">
        {state.loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderCurrentView()
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;