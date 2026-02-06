import React, { useEffect } from 'react';
import useFundStore from '../store/useFundStore';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import clsx from 'clsx';

const MarketIndices = () => {
  const { marketIndices, isIndicesLoading, fetchMarketIndices } = useFundStore();

  useEffect(() => {
    fetchMarketIndices();
    // Refresh every minute
    const interval = setInterval(fetchMarketIndices, 60000);
    return () => clearInterval(interval);
  }, [fetchMarketIndices]);

  if (isIndicesLoading && (!marketIndices || marketIndices.length === 0)) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!marketIndices || marketIndices.length === 0) return null;

  // Filter and map fields
  // f2: latest price, f3: change percent, f4: change amount, f12: code, f14: name
  const displayIndices = marketIndices.map(item => ({
    name: item.f14,
    code: item.f12,
    price: item.f2,
    percent: item.f3,
    amount: item.f4
  }));

  // Reorder to put main indices first if needed
  // Current order from backend is: 上证, 深证, 创业板, 恒生, 道琼斯, 纳指, 标普
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6 overflow-x-auto pb-2 md:pb-0">
      {displayIndices.map((index) => (
        <Card key={index.code} className="min-w-[120px] shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3 flex flex-col items-center justify-center text-center">
            <div className="text-sm font-medium text-muted-foreground truncate w-full">{index.name}</div>
            <div className={clsx("text-lg font-bold my-1", 
              index.percent > 0 ? "text-red-500" : index.percent < 0 ? "text-green-500" : "text-gray-500"
            )}>
              {index.price.toFixed(2)}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className={clsx(
                index.percent > 0 ? "text-red-500" : index.percent < 0 ? "text-green-500" : "text-gray-500"
              )}>
                {index.percent > 0 ? '+' : ''}{index.percent}%
              </span>
              <span className={clsx(
                index.amount > 0 ? "text-red-500" : index.amount < 0 ? "text-green-500" : "text-gray-500"
              )}>
                {index.amount > 0 ? '+' : ''}{index.amount}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MarketIndices;
