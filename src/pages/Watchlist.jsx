import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Trash2, TrendingUp, TrendingDown, Loader2, ArrowUpDown } from 'lucide-react';
import useFundStore from '../store/useFundStore';
import AddFundModal from '../components/AddFundModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import clsx from 'clsx';
import { Skeleton } from "@/components/ui/skeleton";

export default function Watchlist() {
  const { watchlist, fundData, fetchFundData, isLoading, fundLoading, addToWatchlist, removeFromWatchlist } = useFundStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchFundData('watchlist');
    const timer = setInterval(() => fetchFundData('watchlist'), 30000);
    return () => clearInterval(timer);
  }, [watchlist]);

  const sortedWatchlist = useMemo(() => {
    let sortableItems = [...watchlist];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const dataA = fundData[a.code] || {};
        const dataB = fundData[b.code] || {};
        
        let valA, valB;
        if (sortConfig.key === 'gszzl') {
          valA = parseFloat(dataA.gszzl || 0);
          valB = parseFloat(dataB.gszzl || 0);
        } else {
          valA = 0;
          valB = 0;
        }

        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [watchlist, fundData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = (e, code) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个自选基金吗？')) {
      removeFromWatchlist(code);
    }
  };

  const getTrendColor = (val) => {
    if (val > 0) return 'text-red-500';
    if (val < 0) return 'text-green-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0 h-full flex flex-col">
      <header className="flex justify-between items-center flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">自选基金</h1>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => fetchFundData('watchlist')} 
            disabled={isLoading}
          >
            <RefreshCw className={clsx("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
          <Button 
            variant="outline"
            size="icon"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-auto border rounded-xl bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">基金名称</TableHead>
              <TableHead className="text-right">最新净值</TableHead>
              <TableHead 
                className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => requestSort('gszzl')}
              >
                <div className="flex items-center justify-end gap-1">
                  估算涨幅
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedWatchlist.length === 0 ? (
              isLoading ? (
                [1, 2, 3].map(i => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    暂无自选基金，点击右上角添加
                  </TableCell>
                </TableRow>
              )
            ) : (
              sortedWatchlist.map((item) => {
                const data = fundData[item.code] || {};
                const gszzl = parseFloat(data.gszzl || 0);
                const isItemLoading = fundLoading?.[item.code] || (isLoading && !fundLoading);

                return (
                  <TableRow 
                    key={item.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => !isItemLoading && navigate(`/fund/${item.code}`)}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium line-clamp-1" title={item.name}>{item.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{item.code}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono">{data.nav || '--'}</span>
                        <span className="text-xs text-muted-foreground">{data.gztime ? data.gztime.split(' ')[1] : '--:--'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={clsx("font-bold font-mono", getTrendColor(gszzl))}>
                        {gszzl > 0 ? '+' : ''}{gszzl}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDelete(e, item.code)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AddFundModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAdd={addToWatchlist}
        mode="watchlist"
      />
    </div>
  );
}
