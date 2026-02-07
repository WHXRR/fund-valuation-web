import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Wallet,
  List,
  LogOut,
  User,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
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

  const navItems = [
    { to: "/", icon: Wallet, label: "持仓", exact: true },
    { to: "/market", icon: TrendingUp, label: "行情" },
    { to: "/watchlist", icon: List, label: "自选" },
  ];

  return (
    <div className="flex lg:h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-gray-800 fixed inset-y-0 left-0 z-50">
        <div className="flex h-14 items-center border-b px-6">
          <div className="font-bold text-lg text-primary flex items-center gap-2">
            <img src="/logo.svg" className="h-8 w-8" alt="" />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-50"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-gray-700 dark:text-gray-200">
                {user?.email || "未登录"}
              </p>
            </div>
            {user && (
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300 overflow-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-md md:hidden">
          <div className="font-bold text-lg text-primary">
            <img src="/logo.svg" className="h-8 w-8" alt="" />
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full">
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
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-red-600 focus:text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <NavLink to="/login" className="text-sm font-medium text-primary">
                登录
              </NavLink>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto overflow-hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex flex-col items-center justify-center w-full h-full space-y-1",
                  isActive
                    ? "text-primary"
                    : "text-gray-500 hover:text-gray-700"
                )
              }
            >
              <item.icon size={24} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
