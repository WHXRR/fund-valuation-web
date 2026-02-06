import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, Trash2, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import useFundStore from '../store/useFundStore';
import AddFundModal from '../components/AddFundModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import clsx from 'clsx';
import { Skeleton } from "@/components/ui/skeleton";

export default function Watchlist() {
  const { watchlist, fundData, fetchFundData, isLoading, fundLoading, addToWatchlist, removeFromWatchlist } = useFundStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFundData('watchlist');
    const timer = setInterval(() => fetchFundData('watchlist'), 30000);
    return () => clearInterval(timer);
  }, [watchlist]);

  const getTrendColor = (val) => {
    if (val > 0) return 'text-red-500';
    if (val < 0) return 'text-green-500';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <header className="flex justify-between items-center">
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

      <div className="space-y-3">
        {watchlist.length === 0 ? (
          isLoading ? (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="border rounded-xl p-4 flex justify-between items-center">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="space-y-2 flex flex-col items-end">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <p>暂无自选</p>
                <Button variant="link" onClick={() => setIsModalOpen(true)}>点击添加</Button>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {watchlist.map((item) => {
              const data = fundData[item.code] || {};
              const gszzl = parseFloat(data.gszzl || 0);

              return (
                <Card 
                  key={item.id} 
                  className="relative overflow-hidden hover:bg-accent/5 transition-all cursor-pointer active:scale-95 md:active:scale-100 md:hover:-translate-y-1 hover:shadow-md"
                  onClick={() => !fundLoading?.[item.code] && !isLoading && navigate(`/fund/${item.code}`)}
                >
                  {(fundLoading?.[item.code] || (isLoading && !fundLoading)) && (
                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 z-20 flex items-center justify-center backdrop-blur-[1px] transition-opacity duration-200">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  )}
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="font-medium line-clamp-1 mb-1" title={item.name}>{item.name}</div>
                      <div className="flex items-center text-xs text-muted-foreground space-x-2">
                        <span className="font-mono bg-muted px-1 rounded">{item.code}</span>
                        <span>净值: {data.nav || '--'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className={clsx("text-lg font-bold font-mono leading-none", getTrendColor(gszzl))}>
                          {gszzl > 0 ? '+' : ''}{gszzl}%
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">估算涨幅</div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromWatchlist(item.code);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
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
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={addToWatchlist}
        mode="watchlist"
      />
    </div>
  );
}
