import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ArrowUpRight, ArrowDownRight, Pencil, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from "@/components/ui/skeleton";
import clsx from 'clsx';

export function PortfolioTableSkeleton() {
  return (
    <div className="rounded-md border relative overflow-hidden flex flex-col max-w-full">
      <div className="overflow-auto flex-1 w-full">
        <table className="w-full text-sm text-left relative border-collapse">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-30">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium min-w-[160px]">
                <div className="flex items-center gap-2">
                  基金名称
                </div>
              </th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                估算涨幅
              </th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                估算收益
              </th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                持有金额
              </th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                持有收益
              </th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap text-right sticky right-0 z-20 backdrop-blur shadow-[-1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[-1px_0_0_0_rgba(255,255,255,0.1)]">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="bg-background">
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Skeleton className="h-5 w-16" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Skeleton className="h-4 w-20" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right sticky right-0 z-10 bg-background shadow-[-1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[-1px_0_0_0_rgba(255,255,255,0.1)]">
                  <div className="flex justify-end gap-1">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PortfolioTable({
  portfolio,
  fundData,
  isLoading,
  fundLoading,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete
}) {
  const navigate = useNavigate();

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

  const isFundUpdated = (code) => {
    const data = fundData[code];
    if (!data?.navDate || !data?.gztime) return false;
    const navDate = data.navDate;
    const gzDate = data.gztime.split(' ')[0];
    return navDate === gzDate;
  };

  const renderSortIcon = (key) => {
    if (sortBy !== key) return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground/50" />;
    return sortOrder === 'desc' ? <ArrowDownRight className="h-3 w-3 ml-1" /> : <ArrowUpRight className="h-3 w-3 ml-1" />;
  };

  return (
    <div className="rounded-md border relative overflow-hidden flex flex-col max-w-full flex-1">
      <div className="overflow-auto flex-1 w-full">
        <table className="w-full text-sm text-left relative border-collapse">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/90 sticky top-0 z-30">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium min-w-[160px]">
                <div className="flex items-center gap-2">
                  基金名称
                </div>
              </th>
              <th scope="col" className="px-4 py-3 font-medium cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => onSort('change')}>
                <div className="flex items-center">
                  估算涨幅
                  {renderSortIcon('change')}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 font-medium cursor-pointer hover:text-foreground whitespace-nowrap" onClick={() => onSort('profit')}>
                <div className="flex items-center">
                  估算收益
                  {renderSortIcon('profit')}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                持有金额
              </th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">
                持有收益
              </th>
              <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap text-right sticky right-0 z-20 backdrop-blur shadow-[-1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[-1px_0_0_0_rgba(255,255,255,0.1)]">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {portfolio.map((item) => {
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

              const isItemLoading = fundLoading?.[item.code] || (isLoading && !fundLoading);

              return (
                <tr 
                  key={item.id} 
                  className="bg-background hover:bg-muted/50 transition-colors group"
                  onClick={() => !isItemLoading && navigate(`/fund/${item.code}`)}
                >
                  <td className="px-4 py-3">
                    <div className="relative">
                      {isItemLoading && (
                        <div className="absolute inset-0 bg-background/80 z-20 flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                        </div>
                      )}
                      <div className="font-medium text-foreground truncate max-w-[140px]" title={item.name}>
                        {item.name}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                        {item.code}
                        {isFundUpdated(item.code) && (
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Badge variant={getTrendBadge(gszzl)} className="font-mono font-normal">
                      {gszzl > 0 ? '+' : ''}{gszzl}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className={clsx("font-mono font-medium", getTrendColor(dayProfit))}>
                      {dayProfit > 0 ? '+' : dayProfit < 0 ? '-' : ''}¥{Math.abs(dayProfit).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-mono">
                      ¥{currentValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className={clsx("font-mono flex flex-col items-start leading-none gap-1", getTrendColor(totalProfit))}>
                      <span>{totalProfit > 0 ? '+' : totalProfit < 0 ? '-' : ''}¥{Math.abs(totalProfit).toFixed(2)}</span>
                      <span className="text-[10px] opacity-80">
                        {totalProfitRate > 0 ? '+' : ''}{totalProfitRate.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right sticky right-0 z-10 bg-background group-hover:bg-muted/50 transition-colors">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
