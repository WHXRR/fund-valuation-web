import { create } from 'zustand';
import { getFundDetails, getTransactions, addTransaction as apiAddTransaction, deleteTransaction as apiDeleteTransaction, deleteFundTransactions as apiDeleteFundTransactions, getWatchlist, addToWatchlist as apiAddToWatchlist, removeFromWatchlist as apiRemoveFromWatchlist } from '../services/api';

const calculatePortfolio = (transactions) => {
  const now = new Date();
  const portfolioMap = {}; 
  
  // Sort transactions by time
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.time) - new Date(b.time));

  sortedTransactions.forEach(tx => {
    // Effective time check
    const effectiveTime = tx.confirmationTime ? new Date(tx.confirmationTime) : new Date(tx.time);
    if (effectiveTime > now) return; 
    
    // Use fund_code/fund_name from backend format
    const code = tx.fund_code || tx.fundCode;
    const name = tx.fund_name || tx.name;
    
    if (!portfolioMap[code]) {
      portfolioMap[code] = {
        id: code, 
        code: code,
        name: name,
        amount: 0,
        shares: 0,
        cost: 0
      };
    }
    
    const p = portfolioMap[code];
    const amount = Number(tx.amount || 0);
    const cost = Number(tx.cost || 0);
    const shares = Number(tx.shares || 0);
    
    if (tx.type === 'buy') {
      p.amount += amount;
      p.cost += cost;
      p.shares += shares;
      if (name) p.name = name;
    } else if (tx.type === 'sell') {
       if (shares > 0) {
         p.shares -= shares;
       }
       p.amount -= amount;
       p.cost -= cost;
    }
    
    p.amount = Math.max(0, p.amount);
    p.shares = Math.max(0, p.shares);
    p.cost = Math.max(0, p.cost);
  });
  
  return Object.values(portfolioMap).filter(p => p.amount > 0.01);
};

const useFundStore = create((set, get) => ({
  portfolio: [],
  transactions: [],
  watchlist: [],
  fundData: {},
  fundLoading: {}, // Individual loading state per fund code
  isLoading: false,

  refreshPortfolio: async () => {
    try {
      set({ isLoading: true });
      const [txs, wl] = await Promise.all([
        getTransactions(),
        getWatchlist()
      ]);
      
      const portfolio = calculatePortfolio(txs);
      
      set({ 
        transactions: txs,
        watchlist: wl,
        portfolio,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to refresh portfolio:', error);
      set({ isLoading: false });
    }
  },

  addTransaction: async (transaction) => {
    try {
      // Adapt frontend model to backend model
      const newTx = {
         fundCode: transaction.fundCode,
         name: transaction.name,
         type: transaction.type,
         amount: transaction.amount,
         shares: transaction.shares,
         cost: transaction.cost,
         time: transaction.time instanceof Date ? transaction.time.toISOString() : transaction.time,
         confirmationTime: transaction.confirmationTime instanceof Date ? transaction.confirmationTime.toISOString() : transaction.confirmationTime
      };

      await apiAddTransaction(newTx);
      
      if (transaction.syncWatchlist) {
        await get().addToWatchlist({ code: transaction.fundCode, name: transaction.name });
      }

      get().refreshPortfolio();
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  },

  deleteTransaction: async (id) => {
    try {
      await apiDeleteTransaction(id);
      get().refreshPortfolio();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  },

  deleteFundTransactions: async (code) => {
    try {
      await apiDeleteFundTransactions(code);
      get().refreshPortfolio();
    } catch (error) {
      console.error('Failed to delete fund transactions:', error);
    }
  },

  addToWatchlist: async (fund) => {
    try {
      // Check locally first to avoid dup calls
      const { watchlist } = get();
      if (watchlist.some(w => w.code === fund.code)) return;
      
      await apiAddToWatchlist(fund);
      get().refreshPortfolio();
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
    }
  },

  removeFromWatchlist: async (code) => {
    try {
      await apiRemoveFromWatchlist(code);
      get().refreshPortfolio();
    } catch (error) {
      console.error('Failed to remove from watchlist:', error);
    }
  },

  // Compatibility methods
  addToPortfolio: (fund) => get().addTransaction({
    type: 'buy',
    fundCode: fund.code,
    name: fund.name,
    amount: fund.amount,
    cost: fund.cost,
    time: new Date().toISOString()
  }),

  updatePortfolioItem: (fund) => {
    console.warn("Direct update not supported in backend mode. Please use transactions.");
  },

  removeFromPortfolio: (id) => {
    // In Home.jsx, item.id is set to item.code for portfolio items
    // So we can use id as code here
    get().deleteFundTransactions(id);
  },

  fetchFundData: async (type = 'all') => {
    const state = get();
    const codes = new Set();
    
    if (type === 'all' || type === 'portfolio') {
      state.portfolio.forEach(f => codes.add(f.code));
    }
    
    if (type === 'all' || type === 'watchlist') {
      state.watchlist.forEach(f => codes.add(f.code));
    }
    
    if (codes.size === 0) return;

    // Set initial loading state for all targeted funds
    const loadingState = {};
    codes.forEach(code => {
      loadingState[code] = true;
    });
    
    set((state) => ({
      isLoading: true,
      fundLoading: { ...state.fundLoading, ...loadingState }
    }));

    // Fetch individual fund data concurrently and update state progressively
    const promises = Array.from(codes).map(async (code) => {
      try {
        // Use the API's internal fetch logic but handle individual updates
        // We bypass the bulk getFundDetails to control granularity
        // Re-using the logic from getFundDetails but for single item
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
        const response = await fetch(`${API_BASE}/valuation/${code}`);
        let fundData = null;
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.fundcode) {
            fundData = {
              code: data.fundcode,
              name: data.name,
              nav: parseFloat(data.dwjz),
              navDate: data.jzrq,
              gsz: parseFloat(data.gsz),
              gszzl: data.gszzl,
              gztime: data.gztime
            };
          }
        }
        
        // Update state for this specific fund immediately
        if (fundData) {
          set((state) => ({
            fundData: { ...state.fundData, [code]: fundData },
            fundLoading: { ...state.fundLoading, [code]: false }
          }));
        } else {
           // Handle failure/empty by clearing loading
           set((state) => ({
            fundLoading: { ...state.fundLoading, [code]: false }
          }));
        }
      } catch (error) {
        console.warn(`Failed to fetch data for fund ${code}`, error);
        set((state) => ({
          fundLoading: { ...state.fundLoading, [code]: false }
        }));
      }
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Error in batch fetch", error);
    } finally {
      set({ isLoading: false });
    }
  }
}));

export default useFundStore;
