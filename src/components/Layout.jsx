import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Wallet, List, Plus } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <main className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
        <NavLink 
          to="/" 
          className={({ isActive }) => clsx(
            "flex flex-col items-center justify-center w-full h-full",
            isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Wallet size={24} />
          <span className="text-xs mt-1">持仓</span>
        </NavLink>
        
        <NavLink 
          to="/watchlist" 
          className={({ isActive }) => clsx(
            "flex flex-col items-center justify-center w-full h-full",
            isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <List size={24} />
          <span className="text-xs mt-1">自选</span>
        </NavLink>
      </nav>
    </div>
  );
}
