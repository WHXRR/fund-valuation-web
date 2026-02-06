import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, ArrowUpRight, ArrowDownRight, Pencil, ArrowUpDown, Loader2, CheckCircle2 } from 'lucide-react';
import useFundStore from '../store/useFundStore';
import AddFundModal from '../components/AddFundModal';
import MarketIndices from '../components/MarketIndices';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import clsx from 'clsx';

import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { portfolio, fundData, fetchFundData, fetchMarketIndices, isLoading, fundLoading, addToPortfolio, updatePortfolioItem, deleteFundTransactions } = useFundStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState(null);
  const [sortBy, setSortBy] = useState('default'); // 'default', 'change', 'profit'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  const navigate = useNavigate();

  const handleDelete = (item) => {
    if (confirm('确定要删除该基金的所有持仓记录吗？此操作不可恢复。')) {
      deleteFundTransactions(item.code);
    }
  };

  useEffect(() => {
    fetchFundData('portfolio');
    const timer = setInterval(() => fetchFundData('portfolio'), 30000); // Auto refresh every 30s
    return () => clearInterval(timer);
  }, [fetchFundData, portfolio]);

  const summary = useMemo(() => {
    let totalAmount = 0;
    let totalCost = 0;
    let dayProfit = 0;

    portfolio.forEach((item) => {
      const data = fundData[item.code];
      if (data) {
        const currentValuation = item.amount * (1 + parseFloat(data.gszzl || 0) / 100);
        dayProfit += currentValuation - item.amount;
        totalAmount += currentValuation;
        totalCost += item.cost;
      } else {
        totalAmount += item.amount;
        totalCost += item.cost;
      }
    });

    const totalProfit = totalAmount - totalCost;
    const totalProfitRate = totalCost > 0.01 ? (totalProfit / totalCost) * 100 : 0;
    const startOfDayValue = totalAmount - dayProfit;
    const dayProfitRate = startOfDayValue > 0.01 ? (dayProfit / startOfDayValue) * 100 : 0;

    return {
      totalAmount,
      dayProfit,
      totalProfit,
      totalProfitRate,
      dayProfitRate
    };
  }, [portfolio, fundData]);

  const sortedPortfolio = useMemo(() => {
    let sorted = [...portfolio];
    
    if (sortBy === 'default') return sorted;

    sorted.sort((a, b) => {
      const dataA = fundData[a.code] || {};
      const dataB = fundData[b.code] || {};
      
      const gszzlA = parseFloat(dataA.gszzl || 0);
      const gszzlB = parseFloat(dataB.gszzl || 0);
      
      const profitA = a.amount * (gszzlA / 100);
      const profitB = b.amount * (gszzlB / 100);

      let valA = 0;
      let valB = 0;

      if (sortBy === 'change') {
        valA = gszzlA;
        valB = gszzlB;
      } else if (sortBy === 'profit') {
        valA = profitA;
        valB = profitB;
      }

      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return sorted;
  }, [portfolio, fundData, sortBy, sortOrder]);

  const handleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(type);
      setSortOrder('desc');
    }
  };

  const getSortLabel = () => {
    if (sortBy === 'change') return '涨跌幅';
    if (sortBy === 'profit') return '估算收益';
    return '默认排序';
  };

  const getTrendColor = (val) => {
    if (val > 0) return 'text-red-500';
    if (val < 0) return 'text-green-500';
    return 'text-muted-foreground';
  };

  const getTrendBadge = (val) => {
    if (val > 0) return 'positive';
    if (val < 0) return 'negative';
    return 'secondary';
  };

  const handleEdit = (item) => {
    setEditingFund(item);
  };

  const isFundUpdated = (code) => {
    const data = fundData[code];
    if (!data?.navDate || !data?.gztime) return false;
    const navDate = data.navDate;
    const gzDate = data.gztime.split(' ')[0];
    return navDate === gzDate;
  };

  const handleRefresh = () => {
    fetchFundData('portfolio');
    fetchMarketIndices();
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">我的持仓</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh} 
          disabled={isLoading}
        >
          <RefreshCw className={clsx("h-5 w-5", isLoading && "animate-spin")} />
        </Button>
      </header>

      <MarketIndices />

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card className="bg-gradient-to-br from-primary/90 to-primary text-primary-foreground border-none shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
              <div>
                <div className="text-primary-foreground/80 text-sm mb-1">总资产 (元)</div>
                <div className="text-4xl font-bold tracking-tight">¥{summary.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-8 md:gap-12">
                <div>
                  <div className="text-primary-foreground/80 text-xs mb-1">当日收益</div>
                  <div className="text-lg font-semibold flex items-center">
                    {summary.dayProfit > 0 ? '+' : summary.dayProfit < 0 ? '-' : ''}¥{Math.abs(summary.dayProfit).toFixed(2)}
                    <span className="text-xs ml-1 opacity-80">
                      ({summary.dayProfitRate > 0 ? '+' : ''}{summary.dayProfitRate.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-primary-foreground/80 text-xs mb-1">总收益</div>
                  <div className="text-lg font-semibold flex items-center">
                    {summary.totalProfit > 0 ? '+' : summary.totalProfit < 0 ? '-' : ''}¥{Math.abs(summary.totalProfit).toFixed(2)}
                    <span className="text-xs ml-1 opacity-80">
                      ({summary.totalProfitRate > 0 ? '+' : ''}{summary.totalProfitRate.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fund List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-muted-foreground">持仓列表</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs px-2 text-muted-foreground">
                  <ArrowUpDown className="h-3 w-3 mr-1" />
                  {getSortLabel()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setSortBy('default')}>
                  默认排序
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('change')}>
                  按涨跌幅 {sortBy === 'change' && (sortOrder === 'desc' ? '↓' : '↑')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('profit')}>
                  按估算收益 {sortBy === 'profit' && (sortOrder === 'desc' ? '↓' : '↑')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsModalOpen(true)}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" /> 添加
          </Button>
        </div>

        {portfolio.length === 0 ? (
          isLoading ? (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="border rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-8" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <p>暂无持仓</p>
                <Button variant="link" onClick={() => setIsModalOpen(true)}>点击添加基金</Button>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedPortfolio.map((item) => {
              const data = fundData[item.code] || {};
              const gszzl = parseFloat(data.gszzl || 0);
              
              // Calculate Current Valuation
              let currentValuation = 0;
              const currentPrice = parseFloat(data.gsz) || parseFloat(data.dwjz) || 1;
              
              if (item.shares && item.shares > 0) {
                 currentValuation = item.shares * currentPrice;
              } else {
                 currentValuation = item.amount * (1 + gszzl / 100);
              }
              
              const yesterdayValuation = currentValuation / (1 + gszzl / 100);
              const dayProfit = currentValuation - yesterdayValuation;
              
              const totalProfit = currentValuation - item.cost;
              const totalProfitRate = item.cost > 0.01 ? (totalProfit / item.cost) * 100 : 0;

              return (
                <Card 
                  key={item.id} 
                  className="relative overflow-hidden transition-all hover:shadow-md cursor-pointer active:scale-95 md:active:scale-100 md:hover:-translate-y-1"
                  onClick={() => !fundLoading?.[item.code] && !isLoading && navigate(`/fund/${item.code}`)}
                >
                  {(fundLoading?.[item.code] || (isLoading && !fundLoading)) && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 z-20 flex items-center justify-center backdrop-blur-[1px] transition-opacity duration-200">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-1 overflow-hidden mr-2">
                        <div className="font-semibold text-base truncate" title={item.name}>{item.name}</div>
                        <div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                          {item.code}
                          {isFundUpdated(item.code) && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                              <CheckCircle2 className="h-3 w-3" />
                              已更新
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={getTrendBadge(gszzl)} className="text-sm px-2 py-0.5 h-6 shrink-0">
                        {gszzl > 0 ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : gszzl < 0 ? <ArrowDownRight className="h-3 w-3 mr-0.5" /> : null}
                        {gszzl > 0 ? '+' : ''}{gszzl}%
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                      <div>
                        <div className="text-muted-foreground text-xs mb-0.5">持有</div>
                        <div className="font-medium font-mono">¥{currentValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-0.5">当日</div>
                        <div className={clsx("font-medium font-mono flex items-center gap-1", getTrendColor(dayProfit))}>
                          <span>{dayProfit > 0 ? '+' : dayProfit < 0 ? '-' : ''}¥{Math.abs(dayProfit).toFixed(2)}</span>
                          {/* Hidden percentage on small cards if too crowded, but keeping for now */}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-0.5">持仓</div>
                        <div className={clsx("font-medium font-mono flex flex-col items-start leading-none gap-1", getTrendColor(totalProfit))}>
                          <span>{totalProfit > 0 ? '+' : totalProfit < 0 ? '-' : ''}¥{Math.abs(totalProfit).toFixed(2)}</span>
                          <span className="text-[10px] opacity-80">
                            {totalProfitRate > 0 ? '+' : ''}{totalProfitRate.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-2 pt-2 border-t border-dashed">
                       <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(item);
                          }}
                       >
                         <Pencil className="h-3.5 w-3.5" />
                       </Button>
                       <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-6 text-xs text-muted-foreground hover:text-destructive px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item);
                          }}
                       >
                         删除
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AddFundModal 
        isOpen={isModalOpen || !!editingFund} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingFund(null);
        }} 
        onAdd={(fund) => {
          if (editingFund) {
            updatePortfolioItem(fund);
          } else {
            addToPortfolio(fund);
          }
        }}
        initialFund={editingFund}
        mode="portfolio"
      />
    </div>
  );
}
