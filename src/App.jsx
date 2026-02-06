import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Watchlist from './pages/Watchlist';
import FundDetail from './pages/FundDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import useFundStore from './store/useFundStore';

import FullPageLoading from './components/FullPageLoading';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <FullPageLoading />;
  if (!user) return <Navigate to="/login" />;
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  const refreshPortfolio = useFundStore(state => state.refreshPortfolio);

  useEffect(() => {
    // Only refresh if user is logged in
    if (user) {
      refreshPortfolio();

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          refreshPortfolio();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [refreshPortfolio, user]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Home />} />
        <Route path="watchlist" element={<Watchlist />} />
      </Route>
      
      <Route path="/fund/:code" element={
        <ProtectedRoute>
          <FundDetail />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
