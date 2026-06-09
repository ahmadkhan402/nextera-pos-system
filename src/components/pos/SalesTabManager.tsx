import { Plus, X } from 'lucide-react';
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

  const getItemCount = (tab: SalesTab) => {
    return tab.cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="flex h-full w-16 flex-col rounded-3xl border border-slate-200/70 bg-white shadow-xl shadow-slate-200/60">
      {/* Sale Buttons with Rotated Text */}
      <div className="flex-1 space-y-2 overflow-y-auto py-3">
        {state.salesTabs.map((tab, index) => {
          const isActive = state.activeSalesTab === tab.id;
          const itemCount = getItemCount(tab);
          const tabNumber = index + 1; // Correct sequential numbering
          
          return (
            <div key={tab.id} className="relative flex flex-col items-center">
              <button
                onClick={() => switchTab(tab.id)}
                className={`group relative flex h-20 w-12 items-center justify-center rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-400/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-white hover:shadow-md'
                }`}
              >
                {/* Rotated Text Label */}
                <div className="transform rotate-90 whitespace-nowrap">
                  <span className="text-xs font-medium">
                    Sale {tabNumber}
                  </span>
                </div>

                {/* Item Count Badge */}
                {itemCount > 0 && (
                  <div className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                    isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                  }`}>
                    {itemCount}
                  </div>
                )}

                {/* Close button */}
                {state.salesTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600 ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <X className="h-2 w-2" />
                  </button>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add New Sale Button */}
      <div className="border-t border-gray-100 p-2">
        <button
          onClick={createNewTab}
          className="mx-auto flex h-11 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl"
          title="Add New Sale"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}