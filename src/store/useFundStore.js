import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getFundDetails } from '../services/api';

const calculatePortfolio = (transactions) => {
  const now = new Date();
  const portfolioMap = {}; // code -> { ... }
  
  // Sort transactions by time to ensure correct order of operations (especially for sell ratios)
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.time) - new Date(b.time));

  sortedTransactions.forEach(tx => {
    // Use confirmationTime if available, otherwise time for portfolio calculation
    const effectiveTime = tx.confirmationTime ? new Date(tx.confirmationTime) : new Date(tx.time);
    
    // Only process effective transactions
    if (effectiveTime > now) return; 
    
    if (!portfolioMap[tx.fundCode]) {
      portfolioMap[tx.fundCode] = {
        id: tx.fundCode, // Use code as ID for simplicity in map
        code: tx.fundCode,
        name: tx.name,
        amount: 0,
        shares: 0,
        cost: 0
      };
    }
    
    const p = portfolioMap[tx.fundCode];
    
    if (tx.type === 'buy') {
      p.amount += Number(tx.amount);
      p.cost += Number(tx.cost);
      if (tx.shares) {
        p.shares += Number(tx.shares);
      }
      if (tx.name) p.name = tx.name;
    } else if (tx.type === 'sell') {
       if (tx.shares) {
         p.shares -= Number(tx.shares);
       }
       
       if (tx.shareRatio) {
         p.amount -= Number(tx.redeemAmount);
         p.cost -= p.cost * Number(tx.shareRatio);
       } else {
         // Fallback
         p.amount -= Number(tx.amount || 0);
       }
    }
    
    // Ensure numbers are clean
    p.amount = Math.max(0, p.amount);
    p.shares = Math.max(0, p.shares);
    p.cost = Math.max(0, p.cost);
  });
  
  // Filter out empty holdings (amount close to 0)
  return Object.values(portfolioMap).filter(p => p.amount > 0.01);
};

const useFundStore = create(
  persist(
    (set, get) => ({
      portfolio: [], // { id, code, cost, amount }
      transactions: [], // { id, type, fundCode, amount, cost, time, createTime, ... }
      watchlist: [], // { id, code, name }
      fundData: {}, // { code: { ...data } }
      isLoading: false,

      // Deprecated: addToPortfolio (use addTransaction)
      addToPortfolio: (fund) => get().addTransaction({
        type: 'buy',
        fundCode: fund.code,
        name: fund.name,
        amount: fund.amount,
        cost: fund.cost,
        time: new Date().toISOString()
      }),

      // Deprecated: updatePortfolioItem
      updatePortfolioItem: (fund) => set((state) => ({
        portfolio: state.portfolio.map((f) => f.id === fund.id ? fund : f)
      })),

      // Deprecated: removeFromPortfolio (use deleteTransaction or sell all)
      removeFromPortfolio: (id) => set((state) => ({
        portfolio: state.portfolio.filter((f) => f.id !== id)
      })),

      addTransaction: (transaction) => set((state) => {
        const newTx = {
          ...transaction,
          id: Date.now().toString(),
          createTime: new Date().toISOString(),
          // Ensure time is ISO string
          time: transaction.time instanceof Date ? transaction.time.toISOString() : transaction.time,
          confirmationTime: transaction.confirmationTime instanceof Date ? transaction.confirmationTime.toISOString() : transaction.confirmationTime
        };
        
        // Handle syncWatchlist
        if (transaction.syncWatchlist) {
           get().addToWatchlist({ code: transaction.fundCode, name: transaction.name });
        }

        const newTransactions = [...(state.transactions || []), newTx];
        return {
          transactions: newTransactions,
          portfolio: calculatePortfolio(newTransactions)
        };
      }),

      deleteTransaction: (id) => set((state) => {
        const newTransactions = state.transactions.filter(t => t.id !== id);
        return {
          transactions: newTransactions,
          portfolio: calculatePortfolio(newTransactions)
        };
      }),
      
      refreshPortfolio: () => set((state) => ({
        portfolio: calculatePortfolio(state.transactions || [])
      })),

      addToWatchlist: (fund) => set((state) => {
        if (state.watchlist.some(f => f.code === fund.code)) return state;
        return { watchlist: [...state.watchlist, { ...fund, id: Date.now().toString() }] };
      }),

      removeFromWatchlist: (code) => set((state) => ({
        watchlist: state.watchlist.filter((f) => f.code !== code)
      })),

      fetchFundData: async () => {
        const state = get();
        const codes = new Set([
          ...state.portfolio.map(f => f.code),
          ...state.watchlist.map(f => f.code)
        ]);
        
        if (codes.size === 0) return;

        set({ isLoading: true });
        try {
          const data = await getFundDetails(Array.from(codes));
          set((state) => ({
            fundData: { ...state.fundData, ...data },
            isLoading: false
          }));
        } catch (error) {
          console.error("Failed to fetch fund data", error);
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'fund-storage',
      partialize: (state) => ({ 
        portfolio: state.portfolio, 
        watchlist: state.watchlist,
        transactions: state.transactions 
      }),
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0 || !version) {
          const transactions = [];
          if (persistedState.portfolio) {
            persistedState.portfolio.forEach(p => {
              transactions.push({
                id: Date.now().toString() + Math.random(),
                type: 'buy',
                fundCode: p.code,
                name: p.name,
                amount: p.amount,
                cost: p.cost,
                time: new Date().toISOString(),
                createTime: new Date().toISOString()
              });
            });
          }
          return { ...persistedState, transactions, version: 1 };
        }
        return persistedState;
      },
    }
  )
);

export default useFundStore;
