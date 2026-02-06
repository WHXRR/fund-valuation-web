import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Wallet, List, LogOut, User } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Bar for User Info */}
      <header className="bg-white border-b px-4 py-2 flex justify-between items-center sticky top-0 z-40">
        <div className="font-bold text-lg text-primary">FundVal</div>
        <div className="flex items-center gap-2">
           {user ? (
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                   <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">
                     <User className="h-4 w-4" />
                   </div>
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent className="w-56" align="end" forceMount>
                 <DropdownMenuLabel className="font-normal">
                   <div className="flex flex-col space-y-1">
                     <p className="text-sm font-medium leading-none">用户</p>
                     <p className="text-xs leading-none text-muted-foreground">
                       {user.email}
                     </p>
                   </div>
                 </DropdownMenuLabel>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={signOut} className="text-red-600 focus:text-red-600">
                   <LogOut className="mr-2 h-4 w-4" />
                   <span>退出登录</span>
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           ) : (
             <NavLink to="/login" className="text-sm font-medium text-blue-600">
               登录
             </NavLink>
           )}
        </div>
      </header>

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
