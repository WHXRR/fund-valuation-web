import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Watchlist from './pages/Watchlist';
import FundDetail from './pages/FundDetail';
import useFundStore from './store/useFundStore';

function App() {
  const refreshPortfolio = useFundStore(state => state.refreshPortfolio);

  useEffect(() => {
    // Refresh on mount to ensure effective transactions are up to date
    refreshPortfolio();

    // Refresh when app becomes visible (e.g. user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshPortfolio();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshPortfolio]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="watchlist" element={<Watchlist />} />
        </Route>
        <Route path="/fund/:code" element={<FundDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
