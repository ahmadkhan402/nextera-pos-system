import { Plus, X, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/SupabaseAppContext';
import { SalesTab } from '../../types';
import { salesTabsService } from '../../lib/services';
import { useAuth } from '../../context/AuthContext';

export function SalesTabManager() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();

  const createNewTab = async () => {
    if (!user) return;
    
    try {
      // Save current tab's state before creating a new one
      if (state.activeSalesTab) {
        const currentTab = state.salesTabs.find(tab => tab.id === state.activeSalesTab);
        if (currentTab) {
          const updates = {
            cart: state.cart,
            selectedCustomer: state.selectedCustomer,
          };
          
          await salesTabsService.update(state.activeSalesTab, updates);
          dispatch({
            type: 'UPDATE_SALES_TAB',
            payload: {
              id: state.activeSalesTab,
              updates
            }
          });
        }
      }

      const newTabData: Omit<SalesTab, 'id' | 'createdAt'> = {
        name: `Sale ${state.salesTabs.length + 1}`,
        cart: [],
        selectedCustomer: null,
      };
      
      const newTab = await salesTabsService.create(user.id, newTabData);
      dispatch({ type: 'ADD_SALES_TAB', payload: newTab });
    } catch (error) {
      console.error('Error creating new tab:', error);
    }
  };

  const closeTab = async (tabId: string) => {
    if (state.salesTabs.length > 1) {
      try {
        await salesTabsService.delete(tabId);
        dispatch({ type: 'REMOVE_SALES_TAB', payload: tabId });
      } catch (error) {
        console.error('Error closing tab:', error);
      }
    }
  };

  const switchTab = async (tabId: string) => {
    // Save current cart to active tab
    if (state.activeSalesTab) {
      const currentTab = state.salesTabs.find(tab => tab.id === state.activeSalesTab);
      if (currentTab) {
        try {
          const updates = {
            cart: state.cart,
            selectedCustomer: state.selectedCustomer,
          };
          
          await salesTabsService.update(state.activeSalesTab, updates);
          dispatch({
            type: 'UPDATE_SALES_TAB',
            payload: {
              id: state.activeSalesTab,
              updates
            }
          });
        } catch (error) {
          console.error('Error saving current tab:', error);
        }
      }
    }
    
    dispatch({ type: 'SET_ACTIVE_SALES_TAB', payload: tabId });
  };

  return (
    <div className="bg-white border-b border-gray-100 px-4 lg:px-6 py-3">
      <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide">
        {state.salesTabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all cursor-pointer min-w-0 flex-shrink-0 ${
              state.activeSalesTab === tab.id
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => switchTab(tab.id)}
          >
            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium truncate max-w-24">{tab.name}</span>
            {tab.cart.length > 0 && (
              <span className="badge badge-info text-xs flex-shrink-0">
                {tab.cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
            {state.salesTabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1 rounded-lg hover:bg-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
        
        <button
          onClick={createNewTab}
          className="btn btn-success btn-sm flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Sale</span>
        </button>
      </div>
    </div>
  );
}