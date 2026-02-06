import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const getHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    'Content-Type': 'application/json'
  };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
};

// --- Fund Data APIs (Public) ---

let allFundsCache = null;
let isFetchingFunds = false;
let fetchPromise = null;

export const getAllFunds = async () => {
  if (allFundsCache) return allFundsCache;
  if (isFetchingFunds) return fetchPromise;

  isFetchingFunds = true;
  fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/all-funds`);
      if (!response.ok) throw new Error('Failed to fetch fund list');
      const data = await response.json();
      allFundsCache = data; // Backend returns clean format
      return data;
    } catch (error) {
      console.error('Error loading funds:', error);
      return [];
    } finally {
      isFetchingFunds = false;
    }
  })();

  return fetchPromise;
};

export const searchFund = async (keyword) => {
  if (!keyword) return [];
  const funds = await getAllFunds();
  const lowerKeyword = keyword.toLowerCase();
  return funds.filter(fund => 
    fund.code.includes(lowerKeyword) || 
    fund.name.includes(lowerKeyword) || 
    fund.abbr.toLowerCase().includes(lowerKeyword) ||
    fund.pinyin.toLowerCase().includes(lowerKeyword)
  ).slice(0, 20);
};

export const getFundDetails = async (codes) => {
  if (!codes || codes.length === 0) return {};

  const promises = codes.map(async (code) => {
    try {
      const response = await fetch(`${API_BASE}/valuation/${code}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      // Backend returns parsed JSON from jsonpgz({...})
      // Data format from backend: { fundcode: "...", dwjz: "...", ... }
      if (data && data.fundcode) {
        return {
          code: data.fundcode,
          name: data.name,
          nav: parseFloat(data.dwjz),
          navDate: data.jzrq,
          gsz: parseFloat(data.gsz),
          gszzl: data.gszzl,
          gztime: data.gztime
        };
      }
      return null;
    } catch (error) {
      // Fallback to cache if available
      if (allFundsCache) {
        const fund = allFundsCache.find(f => f.code === code);
        if (fund) {
          return {
            code: fund.code,
            name: fund.name,
            nav: 0,
            gsz: 0,
            gszzl: 0,
            gztime: '--'
          };
        }
      }
      console.warn(`Failed to fetch data for fund ${code}`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  
  const dataMap = {};
  results.forEach(item => {
    if (item) {
      dataMap[item.code] = item;
    }
  });
  
  return dataMap;
};

export const getFundChartData = async (code) => {
  try {
    const response = await fetch(`${API_BASE}/pingzhongdata/${code}`);
    if (!response.ok) throw new Error('Failed to fetch chart data');
    const data = await response.json();
    
    // Backend returns { Data_netWorthTrend: [], ... }
    return { 
      name: data.fS_name || code, 
      netWorthTrend: data.Data_netWorthTrend || [], 
      acWorthTrend: data.Data_ACWorthTrend || [] 
    };
  } catch (error) {
    console.error('Error fetching fund chart data:', error);
    return null;
  }
};

export const getFundHistory = async (code, page = 1, pageSize = 20) => {
  try {
    const response = await fetch(`${API_BASE}/f10/lsjz/${code}?pageIndex=${page}&pageSize=${pageSize}`);
    if (!response.ok) throw new Error('Failed to fetch history');
    const data = await response.json();
    
    if (data.Data && data.Data.LSJZList) {
      return {
        list: data.Data.LSJZList,
        total: data.TotalCount
      };
    }
    return { list: [], total: 0 };
  } catch (error) {
    console.error('Error fetching fund history:', error);
    return { list: [], total: 0 };
  }
};

// --- User Data APIs (Protected) ---

export const getTransactions = async () => {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE}/transactions`, { headers });
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
};

export const addTransaction = async (transaction) => {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(transaction)
  });
  if (!response.ok) throw new Error('Failed to add transaction');
  return response.json();
};

export const deleteTransaction = async (id) => {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE}/transactions/${id}`, {
    method: 'DELETE',
    headers
  });
  if (!response.ok) throw new Error('Failed to delete transaction');
  return response.json();
};

export const deleteFundTransactions = async (code) => {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE}/funds/${code}/transactions`, {
    method: 'DELETE',
    headers
  });
  if (!response.ok) throw new Error('Failed to delete fund transactions');
  return response.json();
};

export const getWatchlist = async () => {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE}/watchlist`, { headers });
  if (!response.ok) throw new Error('Failed to fetch watchlist');
  return response.json();
};

export const addToWatchlist = async (fund) => {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE}/watchlist`, {
    method: 'POST',
    headers,
    body: JSON.stringify(fund)
  });
  if (!response.ok) throw new Error('Failed to add to watchlist');
  return response.json();
};

export const removeFromWatchlist = async (code) => {
  const headers = await getHeaders();
  const response = await fetch(`${API_BASE}/watchlist/${code}`, {
    method: 'DELETE',
    headers
  });
  if (!response.ok) throw new Error('Failed to remove from watchlist');
  return response.json();
};
